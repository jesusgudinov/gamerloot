import os

file_path = "/Users/rampage/Documents/Gamer Loot Desarrollo/backend/app/services/cva_excel_parser.py"

with open(file_path, "r") as f:
    content = f.read()

# Reemplazo del Bucle
old_loop = """        for index, row in df.iterrows():
            processed += 1
            if processed % 100 == 0 and log_func:
                log_func(40 + int((processed / total_rows) * 50), f"Procesando {processed}/{total_rows}...")

            sku = str(row["CODIGO DE FABRICANTE"]).strip()
            precio_bruto = row["PRECIO"]
            moneda = str(row["MONEDA"]).strip().upper()
            disp = row["DISP"]
            disp_cd = row["DISP CD"]
            marca = str(row.get("MARCA", "")).strip().upper()
            
            # Limpiar nulos
            if pd.isna(sku) or pd.isna(precio_bruto):
                continue
                
            try:
                precio_bruto = float(precio_bruto)
                disp = int(disp) if not pd.isna(disp) else 0
                disp_cd = int(disp_cd) if not pd.isna(disp_cd) else 0
            except ValueError:
                continue

            precio_mxn = precio_bruto * usd_rate if moneda == "DOLARES" or moneda == "USD" else precio_bruto"""

new_loop = """        for index, row in df.iterrows():
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
            costo_proveedor = precio_mxn * 1.16"""

content = content.replace(old_loop, new_loop)

# Reemplazo Título
old_title = """                # CVA a veces tiene "DESCRIPCION" o a veces se sube sin ella según el formato que elijan exportar.
                # Intentaremos buscarla, si no, usaremos un nombre genérico.
                product_name = str(row.get('DESCRIPCION', row.get('TITULO', f"Producto CVA {sku}"))).strip()
                if not product_name or product_name.lower() == 'nan':
                    product_name = f"Producto CVA {sku}" """

new_title = """                # Obteniendo la Descripción (Título)
                desc_val = row.get('DESCRIPCION DEL ARTICULO', row.get('DESCRIPCION', ''))
                product_name = str(desc_val).strip()
                if not product_name or product_name.lower() == 'nan':
                    product_name = f"Producto CVA {sku}" """

content = content.replace(old_title, new_title)

# Reemplazo Creador de Producto
old_prod = """                product = Product(
                    sku=sku,
                    name=product_name,
                    slug=slug,
                    short_description=product_name,
                    base_price=round_to_marketing_price(precio_mxn * 1.3), # 30% margen inicial
                    brand_id=brand_obj.id if brand_obj else None,
                    category_id=cat_id,
                    status="PUBLISHED"
                )"""

new_prod = """                # 3. Calculamos la base para el público (Costo + 30% utilidad)
                precio_publico = costo_proveedor * 1.30

                product = Product(
                    sku=sku,
                    upc=upc if upc else None,
                    name=product_name,
                    slug=slug,
                    short_description=product_name,
                    base_price=round_to_marketing_price(precio_publico),
                    brand_id=brand_obj.id if brand_obj else None,
                    category_id=cat_id,
                    status="PUBLISHED"
                )"""

content = content.replace(old_prod, new_prod)

# Reemplazo Update
old_update = """                if marca and (not product.brand or product.brand == ""):
                    product.brand = marca

                # Actualizar stock CVA DISP
                if disp >= 0:"""

new_update = """                if marca and (not product.brand or product.brand == ""):
                    product.brand = marca
                    
                if upc and not product.upc:
                    product.upc = upc

                # Actualizar stock CVA DISP
                if disp >= 0:"""
content = content.replace(old_update, new_update)

# Reemplazar precio_mxn en supplier_cost por costo_proveedor
content = content.replace("supplier_cost=precio_mxn", "supplier_cost=costo_proveedor")
content = content.replace("stock1.supplier_cost = precio_mxn", "stock1.supplier_cost = costo_proveedor")
content = content.replace("stock2.supplier_cost = precio_mxn", "stock2.supplier_cost = costo_proveedor")

with open(file_path, "w") as f:
    f.write(content)

print("CVA Parser actualized successfully.")
