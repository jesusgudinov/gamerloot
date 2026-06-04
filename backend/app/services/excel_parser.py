import pandas as pd
from typing import List, Dict, Any, Callable
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product
from app.models.inventory import Warehouse, InventoryStock
from app.core.pricing import recalculate_product_price
from sqlalchemy import update

class PCHExcelParser:
    def __init__(self, file_path: str):
        self.file_path = file_path
        
    async def parse_and_sync(self, db: AsyncSession, exchange_service=None, log_func=None) -> int:
        if log_func: log_func(10, "Cargando archivo Excel de PCH en memoria...")
            
        if self.file_path.endswith('.csv'):
            # En CSV usualmente la cabecera es la fila 0, pero lo buscaremos
            df_raw = pd.read_csv(self.file_path, encoding='utf-8', on_bad_lines='skip', header=None)
        else:
            df_raw = pd.read_excel(self.file_path, header=None)
            
        def normalize_name(name) -> str:
            import unicodedata
            normalized = unicodedata.normalize('NFKD', str(name).strip())
            return "".join(c for c in normalized if not unicodedata.combining(c)).upper()

        header_idx = 0
        for i in range(min(20, len(df_raw))):
            row_vals = [normalize_name(val) for val in df_raw.iloc[i].values]
            if "CLAVE FABRICANTE" in row_vals or "MARCA" in row_vals or "DESCRIPCION" in row_vals:
                header_idx = i
                break
                
        if log_func: log_func(15, f"Encabezados de PCH detectados en la fila {header_idx + 1}")
        
        if self.file_path.endswith('.csv'):
            df = pd.read_csv(self.file_path, encoding='utf-8', on_bad_lines='skip', header=header_idx)
        else:
            df = pd.read_excel(self.file_path, header=header_idx)
            
        if log_func: log_func(30, "Archivo cargado. Limpiando datos...")

        df.columns = [normalize_name(c) for c in df.columns]
        
        if 'CLAVE FABRICANTE' not in df.columns:
            raise ValueError(f"El archivo no contiene la columna 'CLAVE FABRICANTE'. Columnas detectadas: {list(df.columns)}")
            
        df = df.dropna(subset=['CLAVE FABRICANTE'])
        df['CLAVE FABRICANTE'] = df['CLAVE FABRICANTE'].astype(str).str.strip()
        
        def is_refurbished(row):
            sku = str(row.get('CLAVE FABRICANTE', '')).upper()
            desc = str(row.get('DESCRIPCION', '')).upper()
            return '(OB)' in sku or '(RA)' in sku or '(OB)' in desc or '(RA)' in desc or 'OPEN BOX' in desc
            
        df['is_refurbished'] = df.apply(is_refurbished, axis=1)
        df = df[~df['is_refurbished']]
        
        if log_func: log_func(50, f"Limpieza completada. Procesando {len(df)} productos...")

        # --- MOTOR DE MAPEO DE CATEGORÍAS ---
        from app.services.taxonomy_engine import TaxonomyEngine
        
        has_seccion = 'SECCION' in df.columns
        has_linea = 'LINEA' in df.columns
        has_serie = 'SERIE' in df.columns
        
        map_dict = await TaxonomyEngine.get_provider_map(db, "PCH")
            
        all_internal_categories = await TaxonomyEngine.get_all_categories_with_keywords(db)
        # -------------------------------------

        cedis_columns = [col for col in df.columns if col.startswith('PRECIO CEDIS')]
        cedis_ids = [col.replace('PRECIO CEDIS ', '').strip() for col in cedis_columns]
        
        usd_rate = 1.0
        if exchange_service:
            if log_func: log_func(55, "Obteniendo tipo de cambio USD/MXN...")
            usd_rate = await exchange_service.get_usd_to_mxn(db)

        # Crear bodegas para cada CEDIS guardando solo sus IDs
        warehouse_ids_by_cid = {}
        for cid in cedis_ids:
            internal_code = f"PCH_{cid}"
            result = await db.execute(select(Warehouse).where(Warehouse.internal_code == internal_code))
            w = result.scalars().first()
            if not w:
                w = Warehouse(
                    name=f"Bodega PCH - CEDIS {cid}", 
                    provider_name="PCH", 
                    internal_code=internal_code,
                    city="CDMX",
                    state="CDMX"
                )
                db.add(w)
                await db.commit()
                await db.refresh(w)
            warehouse_ids_by_cid[cid] = w.id

        # --- LIMPIEZA DE INVENTARIO FANTASMA ---
        if warehouse_ids_by_cid:
            if log_func: log_func(60, "Limpiando stock fantasma de PCH...")
            w_ids = list(warehouse_ids_by_cid.values())
            await db.execute(update(InventoryStock).where(InventoryStock.warehouse_id.in_(w_ids)).values(quantity=0))
            await db.commit()

        updated = 0
        total_rows = len(df)
        
        processed_product_ids = set()
        
        for i, row in df.iterrows():
            try:
                sku = str(row.get('CLAVE FABRICANTE', '')).strip()
                if not sku: continue
                    
                brand = str(row.get('MARCA', '')).strip().upper()
                if brand.lower() == 'nan': brand = ""
                
                moneda = str(row.get('MONEDA', 'USD')).strip().upper()
                multiplier = usd_rate if moneda in ['USD', 'DOLARES'] else 1.0
                
                result = await db.execute(select(Product).where(Product.sku == sku))
                product = result.scalars().first()
                
                if not product:
                    # AUTO-CREACIÓN DE PRODUCTO (Opción Contingencia sin Syscom)
                    from slugify import slugify
                    from app.models.product import Brand
                    
                    product_name = str(row.get('DESCRIPCION', f"Producto PCH {sku}")).strip()
                    if not product_name or product_name.lower() == 'nan':
                        product_name = f"Producto PCH {sku}"
                        
                    slug = slugify(f"{sku}-{product_name}")[:100]
                    
                    brand_obj = None
                    if brand:
                        brand_slug = slugify(brand)
                        b_res = await db.execute(
                            select(Brand).where(
                                (Brand.slug == brand_slug) | (Brand.name.ilike(brand))
                            )
                        )
                        brand_obj = b_res.scalars().first()
                        if not brand_obj:
                            brand_obj = Brand(name=brand, slug=brand_slug)
                            db.add(brand_obj)
                            await db.flush()
                            
                    # Tomar un precio base del primer CEDIS que encontremos (PCH siempre trae precio)
                    precio_base = 0.0
                    for cid in cedis_ids:
                        precio_col = f"PRECIO CEDIS {cid}"
                        raw_p = row.get(precio_col, 0)
                        if not pd.isna(raw_p) and float(raw_p) > 0:
                            precio_base = round(float(raw_p) * multiplier * 1.3, 2) # 30% margen inicial por si no entra a motor
                            break
                            
                    # Determinar categoría
                    cat_path = ""
                    if has_seccion or has_linea or has_serie:
                        parts = []
                        if has_seccion and not pd.isna(row.get('SECCION')): parts.append(str(row['SECCION']).strip().upper())
                        if has_linea and not pd.isna(row.get('LINEA')): parts.append(str(row['LINEA']).strip().upper())
                        if has_serie and not pd.isna(row.get('SERIE')): parts.append(str(row['SERIE']).strip().upper())
                        cat_path = " > ".join([p for p in parts if p and p.lower() != 'nan'])
                        
                    cat_id = await TaxonomyEngine.categorize_product(db, "PCH", cat_path, product_name, all_internal_categories, map_dict)

                    product = Product(
                        sku=sku,
                        name=product_name,
                        slug=slug,
                        short_description=product_name,
                        base_price=precio_base,
                        brand_id=brand_obj.id if brand_obj else None,
                        category_id=cat_id,
                        status="PUBLISHED"
                    )
                    db.add(product)
                    await db.flush()

                if product:
                    if brand and (not product.brand or product.brand == ""):
                        product.brand = brand
                        
                    # Actualizar categoría si estaba huérfano y ahora encontramos una
                    if not product.category_id:
                        cat_path = ""
                        if has_seccion or has_linea or has_serie:
                            parts = []
                            if has_seccion and not pd.isna(row.get('SECCION')): parts.append(str(row['SECCION']).strip().upper())
                            if has_linea and not pd.isna(row.get('LINEA')): parts.append(str(row['LINEA']).strip().upper())
                            if has_serie and not pd.isna(row.get('SERIE')): parts.append(str(row['SERIE']).strip().upper())
                            cat_path = " > ".join([p for p in parts if p and p.lower() != 'nan'])
                            
                        cat_id = await TaxonomyEngine.categorize_product(db, "PCH", cat_path, product.name, all_internal_categories, map_dict)
                        if cat_id:
                            product.category_id = cat_id

                    stock_result = await db.execute(
                        select(InventoryStock).where(InventoryStock.product_id == product.id)
                    )
                    existing_stocks = {s.warehouse_id: s for s in stock_result.scalars().all()}

                    for cid in cedis_ids:
                        precio_col = f"PRECIO CEDIS {cid}"
                        stock_col = f"STOCK CEDIS {cid}"
                        
                        raw_precio = row.get(precio_col, 0)
                        raw_stock = row.get(stock_col, 0)
                        
                        if pd.isna(raw_precio): raw_precio = 0
                        if pd.isna(raw_stock): raw_stock = 0
                        
                        try:
                            precio = float(raw_precio)
                            stock = int(float(raw_stock))
                        except (ValueError, TypeError):
                            precio = 0.0
                            stock = 0
                        
                        w_id = warehouse_ids_by_cid[cid]
                        
                        if stock > 0 or w_id in existing_stocks:
                            precio_mxn = precio * multiplier
                            stock_entry = existing_stocks.get(w_id)
                            
                            if stock_entry:
                                stock_entry.quantity = stock
                                stock_entry.supplier_cost = precio_mxn
                            else:
                                new_stock = InventoryStock(
                                    product_id=product.id,
                                    warehouse_id=w_id,
                                    quantity=stock,
                                    supplier_cost=precio_mxn
                                )
                                db.add(new_stock)

                    updated += 1
                    processed_product_ids.add(product.id)
                    if updated % 100 == 0:
                        await db.commit()

                if log_func and i % 500 == 0:
                    progress = 60 + int((i / total_rows) * 40)
                    log_func(progress, f"Procesando fila {i} de {total_rows}...")
            except Exception as e:
                print(f"Error procesando SKU {row.get('CLAVE FABRICANTE')} en fila {i}: {e}")
                await db.rollback() # Limpiar estado fallido de SQLAlchemy

        try:
            await db.commit()
            
            # --- MOTOR DE PRECIOS: Recalcular precios de los productos modificados ---
            if log_func: log_func(95, "Recalculando precios públicos con el motor inteligente...")
            for pid in processed_product_ids:
                await recalculate_product_price(pid, db)
            await db.commit()
            
        except Exception as e:
            print(f"Error final de commit en PCH: {e}")
            await db.rollback()
            
        if log_func: log_func(100, f"¡Sincronización de PCH completada! {updated} productos cruzados.")
            
        return updated
