import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product
from app.models.inventory import Warehouse, InventoryStock


class CVAExcelParser:
    def __init__(self, file_path: str):
        self.file_path = file_path

    async def parse_and_sync(self, db: AsyncSession, exchange_service=None, log_func=None):
        if log_func: log_func(10, "Leyendo archivo Excel de CVA (formato .xls)...")
        
        def normalize_name(name) -> str:
            import unicodedata
            normalized = unicodedata.normalize('NFKD', str(name).strip())
            return "".join(c for c in normalized if not unicodedata.combining(c)).upper()

        try:
            # Leer sin cabeceras primero para buscar dónde empiezan
            df_raw = pd.read_excel(self.file_path, header=None)
            header_idx = 0
            
            for i in range(min(20, len(df_raw))):
                row_vals = [normalize_name(val) for val in df_raw.iloc[i].values]
                matches = sum(1 for req in ["CODIGO DE FABRICANTE", "PRECIO", "MONEDA", "DISP", "DISP CD"] if req in row_vals)
                if matches >= 3:
                    header_idx = i
                    break
                    
            if log_func: log_func(15, f"Encabezados detectados en la fila {header_idx + 1}")
            
            df = pd.read_excel(self.file_path, header=header_idx)
            # Limpiar nombres de columnas removiendo acentos
            df.columns = [normalize_name(c) for c in df.columns]
        except Exception as e:
            raise ValueError(f"No se pudo leer el Excel de CVA: {str(e)}")

        required_columns = ["CODIGO DE FABRICANTE", "PRECIO", "MONEDA", "DISP", "DISP CD"]
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"El archivo no contiene la columna '{col}'. Asegúrate de subir una lista de CVA.")

        usd_rate = 1.0
        if exchange_service:
            if log_func: log_func(20, "Obteniendo tipo de cambio USD/MXN...")
            usd_rate = await exchange_service.get_usd_to_mxn(db)
            
        if log_func: log_func(30, "Asegurando bodegas de CVA...")
        # Bodega 1: Disp
        result = await db.execute(select(Warehouse).where(Warehouse.internal_code == "CVA_DISP"))
        cva_disp = result.scalars().first()
        if not cva_disp:
            cva_disp = Warehouse(
                name="CVA Sucursal Principal", 
                provider_name="CVA", 
                internal_code="CVA_DISP",
                city="Guadalajara",
                state="Jalisco"
            )
            db.add(cva_disp)

        # Bodega 2: Disp CD
        result = await db.execute(select(Warehouse).where(Warehouse.internal_code == "CVA_DISP_CD"))
        cva_disp_cd = result.scalars().first()
        if not cva_disp_cd:
            cva_disp_cd = Warehouse(
                name="CVA CEDIS", 
                provider_name="CVA", 
                internal_code="CVA_DISP_CD",
                city="Guadalajara",
                state="Jalisco"
            )
            db.add(cva_disp_cd)

        await db.commit()
        await db.refresh(cva_disp)
        await db.refresh(cva_disp_cd)

        total_rows = len(df)
        if log_func: log_func(40, f"Procesando {total_rows} filas de CVA...")

        # --- MOTOR DE MAPEO DE CATEGORÍAS ---
        from app.services.taxonomy_engine import TaxonomyEngine
        map_dict = await TaxonomyEngine.get_provider_map(db, "CVA")
        all_internal_categories = await TaxonomyEngine.get_all_categories_with_keywords(db)
        
        has_grupo = 'GRUPO' in df.columns
        has_clase = 'CLASE' in df.columns
        # -------------------------------------

        processed = 0
        updated = 0

        for index, row in df.iterrows():
            processed += 1
            if processed % 100 == 0 and log_func:
                log_func(40 + int((processed / total_rows) * 50), f"Procesando {processed}/{total_rows}...")

            sku = str(row["CODIGO DE FABRICANTE"]).strip()
            precio_bruto = row["PRECIO"]
            moneda = str(row["MONEDA"]).strip().upper()
            disp = row["DISP"]
            disp_cd = row["DISP CD"]
            marca = str(row.get("MARCA", "")).strip().upper()
            
            # El UPC puede venir como float si pandas lo parsea así, le quitamos decimales.
            upc_raw = row.get("UPC", "")
            upc = str(int(upc_raw)) if isinstance(upc_raw, float) and not pd.isna(upc_raw) else str(upc_raw).strip()
            if upc == "nan": upc = ""
            
            # Limpiar nulos
            if pd.isna(sku) or pd.isna(precio_bruto):
                continue
                
            try:
                precio_bruto = float(precio_bruto)
                disp = int(disp) if not pd.isna(disp) else 0
                disp_cd = int(disp_cd) if not pd.isna(disp_cd) else 0
            except ValueError:
                continue

            total_stock = disp + disp_cd
            if total_stock <= 0:
                continue # Omitir toda la fila si no hay inventario, para no crear basura

            # Cálculo correcto de costos y precios
            # 1. Moneda (Dolares = TC, Pesos = 1)
            precio_mxn = precio_bruto * usd_rate if moneda in ["DOLARES", "USD"] else precio_bruto
            # 2. Sumamos IVA (16%)
            costo_proveedor = precio_mxn * 1.16
            
            # Buscar el producto
            result = await db.execute(select(Product).where(Product.sku == sku))
            product = result.scalars().first()
            
            if not product:
                # AUTO-CREACIÓN DE PRODUCTO (CVA)
                from slugify import slugify
                from app.models.product import Brand
                
                # Obteniendo la Descripción (Título)
                desc_val = row.get('DESCRIPCION DEL ARTICULO', row.get('DESCRIPCION', ''))
                product_name = str(desc_val).strip()
                if not product_name or product_name.lower() == 'nan':
                    product_name = f"Producto CVA {sku}"
                    
                slug = slugify(f"{sku}-{product_name}")[:100]
                
                brand_obj = None
                if marca:
                    brand_slug = slugify(marca)
                    b_res = await db.execute(
                        select(Brand).where(
                            (Brand.slug == brand_slug) | (Brand.name.ilike(marca))
                        )
                    )
                    brand_obj = b_res.scalars().first()
                    if not brand_obj:
                        brand_obj = Brand(name=marca, slug=brand_slug)
                        db.add(brand_obj)
                        await db.flush()
                        
                cat_path = ""
                parts = []
                if has_grupo and not pd.isna(row.get('GRUPO')): parts.append(str(row['GRUPO']).strip().upper())
                if has_clase and not pd.isna(row.get('CLASE')): parts.append(str(row['CLASE']).strip().upper())
                if parts:
                    cat_path = " > ".join([p for p in parts if p.lower() != 'nan'])

                cat_id = await TaxonomyEngine.categorize_product(db, "CVA", cat_path, product_name, all_internal_categories, map_dict)

                # 3. Calculamos la base para el público (Costo + 30% utilidad)
                precio_publico = costo_proveedor * 1.30

                product = Product(
                    sku=sku,
                    upc=upc if upc else None,
                    name=product_name,
                    slug=slug,
                    short_description=product_name,
                    base_price=round(precio_publico, 2),
                    brand_id=brand_obj.id if brand_obj else None,
                    category_id=cat_id,
                    status="PUBLISHED"
                )
                db.add(product)
                await db.flush()

            if product:
                # Si el producto no tiene categoría y podemos inferirla
                if not product.category_id:
                    cat_path = ""
                    parts = []
                    if has_grupo and not pd.isna(row.get('GRUPO')): parts.append(str(row['GRUPO']).strip().upper())
                    if has_clase and not pd.isna(row.get('CLASE')): parts.append(str(row['CLASE']).strip().upper())
                    if parts:
                        cat_path = " > ".join([p for p in parts if p.lower() != 'nan'])
                        
                    cat_id = await TaxonomyEngine.categorize_product(db, "CVA", cat_path, product.name, all_internal_categories, map_dict)
                    if cat_id:
                        product.category_id = cat_id

                if marca and (not product.brand or product.brand == ""):
                    product.brand = marca
                    
                if upc and not product.upc:
                    product.upc = upc

                # Actualizar stock CVA DISP
                if disp >= 0:
                    stock_result = await db.execute(
                        select(InventoryStock).where(
                            (InventoryStock.product_id == product.id) &
                            (InventoryStock.warehouse_id == cva_disp.id)
                        )
                    )
                    stock1 = stock_result.scalars().first()
                    if stock1:
                        stock1.quantity = disp
                        stock1.supplier_cost = costo_proveedor
                    else:
                        new_stock1 = InventoryStock(product_id=product.id, warehouse_id=cva_disp.id, quantity=disp, supplier_cost=costo_proveedor)
                        db.add(new_stock1)

                # Actualizar stock CVA DISP CD
                if disp_cd >= 0:
                    stock_result2 = await db.execute(
                        select(InventoryStock).where(
                            (InventoryStock.product_id == product.id) &
                            (InventoryStock.warehouse_id == cva_disp_cd.id)
                        )
                    )
                    stock2 = stock_result2.scalars().first()
                    if stock2:
                        stock2.quantity = disp_cd
                        stock2.supplier_cost = costo_proveedor
                    else:
                        new_stock2 = InventoryStock(product_id=product.id, warehouse_id=cva_disp_cd.id, quantity=disp_cd, supplier_cost=costo_proveedor)
                        db.add(new_stock2)
                
                updated += 1
                if updated % 200 == 0:
                    await db.commit()

        await db.commit()
        if log_func: log_func(100, f"¡Sincronización de CVA completada! {updated} productos cruzados.")
        return updated
