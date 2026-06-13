import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product
from app.models.inventory import Warehouse, InventoryStock
from app.core.pricing import marketing_round

class IDExcelParser:
    def __init__(self, file_path: str):
        self.file_path = file_path

    async def parse_and_sync(self, db: AsyncSession, exchange_service=None, log_func=None):
        if log_func: log_func(10, "Leyendo archivo Excel de Importación Digital...")
        
        def normalize_name(name) -> str:
            import unicodedata
            normalized = unicodedata.normalize('NFKD', str(name).strip())
            return "".join(c for c in normalized if not unicodedata.combining(c)).upper()

        try:
            # Leer sin cabeceras primero para buscar dónde empiezan
            df_raw = pd.read_excel(self.file_path, header=None)
            header_idx = 0
            
            for i in range(min(30, len(df_raw))):
                row_vals = [normalize_name(val) for val in df_raw.iloc[i].values if pd.notna(val)]
                matches = sum(1 for req in ["SKU", "MARCA", "UPC", "DESCRIPCION", "VOLUMEN", "INVENTARIO"] if req in row_vals)
                if matches >= 3:
                    header_idx = i
                    break
                    
            if log_func: log_func(15, f"Encabezados detectados en la fila {header_idx + 1}")
            
            # Releer usando esa fila como cabecera
            df = pd.read_excel(self.file_path, header=header_idx)
            # Limpiar columnas a mayúsculas y quitar acentos
            df.columns = [normalize_name(c) for c in df.columns]
        except Exception as e:
            raise ValueError(f"No se pudo leer el Excel: {str(e)}")

        required_columns = ["SKU", "CONDICION", "VOLUMEN", "INVENTARIO"]
        for col in required_columns:
            if col not in df.columns:
                print(f"Columnas detectadas en ID: {list(df.columns)}")
                raise ValueError(f"El archivo no contiene la columna '{col}'. Asegúrate de subir una lista de Importación Digital.")

        # Obtener tipo de cambio si es necesario. En ID dice "USD MAS IVA" pero no hay columna de Moneda clara. 
        # Si todo es USD, usamos el exchange_service.
        # En la imagen, la columna "USD MAS IVA" sugiere que el precio VOLUMEN está en dólares.
        usd_rate = 1.0
        if exchange_service:
            if log_func: log_func(20, "Obteniendo tipo de cambio para USD...")
            usd_rate = await exchange_service.get_usd_to_mxn(db)
            
        if log_func: log_func(30, "Asegurando bodega de ID (IDCDMX)...")
        result = await db.execute(select(Warehouse).where(Warehouse.internal_code == "IDCDMX"))
        id_warehouse = result.scalars().first()
        if not id_warehouse:
            id_warehouse = Warehouse(
                name="Importación Digital - CDMX", 
                provider_name="Importación Digital", 
                internal_code="IDCDMX",
                city="CDMX",
                state="CDMX"
            )
            db.add(id_warehouse)
            await db.commit()
            await db.refresh(id_warehouse)

        total_rows = len(df)
        if log_func: log_func(40, f"Procesando {total_rows} filas de Importación Digital...")

        # --- MOTOR DE MAPEO DE CATEGORÍAS ---
        from app.services.taxonomy_engine import TaxonomyEngine
        map_dict = await TaxonomyEngine.get_provider_map(db, "Importación Digital")
        all_internal_categories = await TaxonomyEngine.get_all_categories_with_keywords(db)
        
        has_categoria = 'CATEGORIA' in df.columns
        # -------------------------------------

        processed = 0
        updated = 0

        for index, row in df.iterrows():
            processed += 1
            if processed % 100 == 0 and log_func:
                log_func(40 + int((processed / total_rows) * 50), f"Procesando {processed}/{total_rows}...")

            raw_cond = row.get("CONDICION")
            condicion = "Nuevo"
            if pd.notna(raw_cond):
                c_upper = str(raw_cond).strip().upper()
                if c_upper in ["NUEVO", "NUEVA", "NEW"]:
                    condicion = "Nuevo"
                elif c_upper in ["REACONDICIONADO", "REFURBISHED", "REMANUFACTURADO"]:
                    condicion = "Reacondicionado"
                elif c_upper in ["OPEN BOX"]:
                    condicion = "Open Box"
                else:
                    condicion = str(raw_cond).strip()

            sku = str(row["SKU"]).strip()
            precio_volumen = row["VOLUMEN"]
            inventario = row["INVENTARIO"]
            marca = str(row.get("MARCA", "")).strip().upper()
            upc = str(row.get("UPC", "")).strip()
            if upc == "nan" or not upc:
                upc = None
            
            # Limpiar nulos
            if pd.isna(sku) or pd.isna(precio_volumen) or pd.isna(inventario):
                continue
                
            try:
                if isinstance(precio_volumen, str):
                    precio_volumen = float(precio_volumen.replace('$', '').replace(',', '').replace('USD', '').strip())
                else:
                    precio_volumen = float(precio_volumen)
                    
                if isinstance(inventario, str):
                    inventario = int(float(inventario.replace(',', '').strip()))
                else:
                    inventario = int(inventario)
            except ValueError:
                continue

            precio_mxn = precio_volumen * usd_rate
            final_base_price = marketing_round(precio_mxn * 1.3)
            
            final_discount_price = None
            if pd.notna(row.get("OFERTA")):
                try:
                    p_oferta = row.get("OFERTA")
                    if isinstance(p_oferta, str):
                        precio_oferta = float(p_oferta.replace('$', '').replace(',', '').replace('USD', '').strip())
                    else:
                        precio_oferta = float(p_oferta)
                        
                    if precio_oferta > 0 and precio_oferta < precio_volumen:
                        oferta_mxn = precio_oferta * usd_rate
                        final_discount_price = marketing_round(oferta_mxn * 1.3)
                except ValueError:
                    pass
            
            # Buscar el producto
            result = await db.execute(select(Product).where(Product.sku == sku))
            product = result.scalars().first()
            
            if upc:
                upc_check = await db.execute(select(Product.id).where(Product.upc == upc))
                existing_upc_product_id = upc_check.scalars().first()
                if existing_upc_product_id:
                    if not product or existing_upc_product_id != product.id:
                        upc = None # Ignore duplicate UPC to prevent IntegrityError
            
            if not product:
                # AUTO-CREACIÓN DE PRODUCTO (Importación Digital)
                from slugify import slugify
                from app.models.product import Brand
                
                product_name = str(row.get('DESCRIPCION', f"Producto Importación Digital {sku}")).strip()
                if not product_name or product_name.lower() == 'nan':
                    product_name = f"Producto Importación Digital {sku}"
                    
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
                if has_categoria and not pd.isna(row.get('CATEGORIA')):
                    cat_path = str(row['CATEGORIA']).strip().upper()
                    
                cat_id = await TaxonomyEngine.categorize_product(db, "Importación Digital", cat_path, product_name, all_internal_categories, map_dict)

                product = Product(
                    sku=sku,
                    upc=upc,
                    name=product_name,
                    slug=slug,
                    short_description=product_name,
                    base_price=final_base_price,
                    discount_price=final_discount_price,
                    brand_id=brand_obj.id if brand_obj else None,
                    brand=marca if not brand_obj else None,
                    category_id=cat_id,
                    condition=condicion,
                    status="PUBLISHED"
                )
                db.add(product)
                await db.flush()

            if product:
                # Actualizar información del producto existente
                product.base_price = final_base_price
                product.discount_price = final_discount_price
                product.condition = condicion
                if upc and not product.upc:
                    product.upc = upc
                    
                # Si el producto no tiene categoría y podemos inferirla
                if not product.category_id:
                    cat_path = ""
                    if has_categoria and not pd.isna(row.get('CATEGORIA')):
                        cat_path = str(row['CATEGORIA']).strip().upper()
                    cat_id = await TaxonomyEngine.categorize_product(db, "Importación Digital", cat_path, product.name, all_internal_categories, map_dict)
                    if cat_id:
                        product.category_id = cat_id

                # Si el producto no tiene marca o viene una nueva del Excel, actualizarla
                if marca and (not product.brand or product.brand == "") and not product.brand_id:
                    product.brand = marca
                    
                # Actualizar stock
                stock_result = await db.execute(
                    select(InventoryStock).where(
                        (InventoryStock.product_id == product.id) &
                        (InventoryStock.warehouse_id == id_warehouse.id)
                    )
                )
                stock = stock_result.scalars().first()
                if stock:
                    stock.quantity = inventario
                    stock.supplier_cost = precio_mxn
                else:
                    new_stock = InventoryStock(
                        product_id=product.id,
                        warehouse_id=id_warehouse.id,
                        quantity=inventario,
                        supplier_cost=precio_mxn
                    )
                    db.add(new_stock)
                
                updated += 1
                if updated % 200 == 0:
                    await db.commit()

        await db.commit()
        if log_func: log_func(100, f"¡Sincronización de Importación Digital completada! {updated} productos cruzados.")
        return updated
