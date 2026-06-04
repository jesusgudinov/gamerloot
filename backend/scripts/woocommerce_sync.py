import asyncio
import httpx
import base64
import sys
import os

# Agregamos el directorio raíz del backend al sys.path para poder importar 'app'
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from sqlalchemy import select

# Importar todos los modelos para registrarlos en el mapeador de SQLAlchemy
from app.models.role import Role
from app.models.user import User, UserAddress
from app.models.product import Product, Brand, Category, ProductAttribute, ProductAttributeValue, MarketingTag
from app.models.inventory import Warehouse, InventoryStock, ExchangeRate
from app.models.sales import Order, OrderItem
from app.models.marketing import Campaign, Coupon

import re

def clean_html(raw_html):
    if not raw_html:
        return ""
    # Remove HTML tags using regex
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', str(raw_html)).strip()

def update_global_status(progress: int, message: str, status: str = "running"):
    try:
        httpx.post("http://127.0.0.1:8000/api/v1/sync/status/update", json={
            "task": "woocommerce",
            "status": status,
            "progress": progress,
            "message": message
        })
    except:
        pass

async def fetch_woocommerce_products():
    if not settings.WC_URL or not settings.WC_CONSUMER_KEY or not settings.WC_CONSUMER_SECRET:
        update_global_status(0, "Error: Credenciales faltantes", "error")
        return []

    update_global_status(5, "Conectando a WooCommerce...", "running")
    
    auth_string = f"{settings.WC_CONSUMER_KEY}:{settings.WC_CONSUMER_SECRET}"
    base64_auth = base64.b64encode(auth_string.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {base64_auth}",
        "Content-Type": "application/json"
    }

    products = []
    page = 1
    
    async with httpx.AsyncClient() as client:
        while True:
            # Reportamos progreso simulado (subiendo 1% por página)
            prog = min(10 + page * 2, 50)
            update_global_status(prog, f"Descargando página {page} de WooCommerce...", "running")
            
            url = f"{settings.WC_URL}/wp-json/wc/v3/products?per_page=100&page={page}"
            response = await client.get(url, headers=headers, timeout=30.0)
            
            if response.status_code != 200:
                update_global_status(prog, f"Error en API WC: {response.status_code}", "error")
                break
                
            data = response.json()
            if not data:
                break
                
            products.extend(data)
            page += 1
            
    update_global_status(50, f"Descarga completa. {len(products)} productos. Preparando BD...", "running")
    return products

async def sync_products_to_db(wc_products):
    print("🚀 Iniciando volcado de datos a Supabase PostgreSQL...")
    from app.models.product import Category, ProductAttributeValue
    from sqlalchemy.orm import selectinload

    async with AsyncSessionLocal() as db:
        # Pre-cargar categorías para mapeo rápido
        cats_result = await db.execute(select(Category))
        categories_map = {c.slug: c.id for c in cats_result.scalars().all()}
        
        # Pre-cargar valores de atributos
        attrs_result = await db.execute(select(ProductAttributeValue))
        attrs_map = {f"{a.attribute_id}_{a.value}": a for a in attrs_result.scalars().all()}

        # Rastreador de UPCs procesados en esta corrida (para evitar colisiones en batch updates antes del commit)
        seen_upcs = set()

        new_count = 0
        updated_count = 0
        total_products = len(wc_products)
        
        for i, p in enumerate(wc_products):
            if i % 50 == 0:
                prog = 50 + int((i/total_products)*50)
                update_global_status(prog, f"Inyectando producto {i} de {total_products} a Supabase...", "running")
                
            base_price = float(p.get("regular_price") or p.get("price") or 0.0)
            
            # Imágenes
            images = [img.get("src") for img in p.get("images", [])]
            main_image_url = images[0] if images else None
            
            # UPC
            upc = p.get("global_unique_id") or ""
            if not upc:
                for meta in p.get("meta_data", []):
                    if meta.get("key") == "_upc":
                        upc = meta.get("value", "")
                        break
            upc = upc.strip() if upc and upc.strip() else None
            
            # Marca
            brand = ""
            if p.get("brands"):
                brand = p["brands"][0].get("name", "")
            if not brand:
                for meta in p.get("meta_data", []):
                    if meta.get("key") in ["_brand", "product_brand", "marca"]:
                        brand = meta.get("value", "")
                        break
            if not brand:
                for attr in p.get("attributes", []):
                    if attr.get("name", "").lower() in ["marca", "brand", "marcas", "brands"]:
                        options = attr.get("options", [])
                        if options:
                            brand = options[0]
                        break

            brand_id = None
            if brand:
                from slugify import slugify
                from app.models.product import Brand
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
                brand_id = brand_obj.id

            # Categoría
            category_id = None
            if p.get("categories"):
                cat_slug = p["categories"][0].get("slug")
                category_id = categories_map.get(cat_slug)
            
            # Buscar si ya existe por SKU
            sku = p.get("sku")
            if not sku:
                sku = f"WC-{p.get('id')}"
                
            if upc:
                if upc in seen_upcs:
                    print(f"⚠️ UPC duplicado en misma tanda: {upc} para SKU {sku}. Ignorando UPC.")
                    upc = None
                else:
                    # Evitar UniqueViolationError revisando si el UPC ya pertenece a OTRO sku en DB
                    check_query = select(Product.id).where(Product.upc == upc, Product.sku != sku)
                    check_result = await db.execute(check_query)
                    if check_result.scalars().first():
                        print(f"⚠️ UPC duplicado detectado en WC DB: {upc} para SKU {sku}. Ignorando UPC para no romper DB.")
                        upc = None
                    else:
                        seen_upcs.add(upc)
                
            # Buscar con sus atributos cargados para evitar Lazy Load
            query = select(Product).where(Product.sku == sku).options(selectinload(Product.attribute_values))
            result = await db.execute(query)
            existing_product = result.scalars().first()
            
            if existing_product:
                existing_product.name = p.get("name")
                existing_product.description = p.get("description")
                existing_product.main_image_url = main_image_url
                existing_product.image_gallery = images
                existing_product.upc = upc
                existing_product.brand = brand
                existing_product.brand_id = brand_id
                existing_product.category_id = category_id
                target_product = existing_product
                updated_count += 1
            else:
                raw_slug = p.get("slug")
                safe_slug = raw_slug if raw_slug else f"wc-{sku}-{p.get('id')}".lower().replace(" ", "-")

                new_product = Product(
                    sku=sku,
                    name=p.get("name"),
                    meta_title=p.get("name"),
                    meta_description=clean_html(p.get("short_description", "")),
                    status="PUBLISHED" if (p.get("status") == "publish" and main_image_url) else "DRAFT",
                    is_featured=p.get("featured", False),
                    rating=float(p.get("average_rating", 0.0)),
                    slug=safe_slug,
                    description=p.get("description"),
                    base_price=base_price,
                    main_image_url=main_image_url,
                    image_gallery=images,
                    weight_kg=float(p.get("weight") or 0.0),
                    length_cm=float(p.get("dimensions", {}).get("length") or 0.0),
                    width_cm=float(p.get("dimensions", {}).get("width") or 0.0),
                    height_cm=float(p.get("dimensions", {}).get("height") or 0.0),
                    upc=upc,
                    brand=brand,
                    brand_id=brand_id,
                    category_id=category_id
                )
                db.add(new_product)
                target_product = new_product
                new_count += 1

            # Asignar Atributos (Requiere que taxonomías ya estén sincronizadas)
            # Primero vaciamos los actuales (si existen)
            if hasattr(target_product, "attribute_values"):
                target_product.attribute_values = []
                
            wc_attributes = p.get("attributes", [])
            for attr in wc_attributes:
                # Buscamos el ID del atributo usando la base de datos de WooCommerce
                # En WC el atributo tiene un ID, y su slug `pa_...`
                # Lo más seguro es buscar el `ProductAttribute` por slug en DB, pero como es pesado
                # lo buscaremos directamente consultando o pre-cargando si es necesario.
                attr_slug = attr.get("slug")
                if not attr_slug: continue
                
                # Para evitar N queries, buscamos el ProductAttribute por slug
                from app.models.product import ProductAttribute
                attr_result = await db.execute(select(ProductAttribute).where(ProductAttribute.slug == attr_slug))
                db_attr = attr_result.scalars().first()
                
                if db_attr:
                    for option in attr.get("options", []):
                        # Buscar el valor
                        val_key = f"{db_attr.id}_{option}"
                        db_val = attrs_map.get(val_key)
                        if not db_val:
                            # Si no está cacheado, lo buscamos directo en base (por si se creó apenas)
                            val_result = await db.execute(select(ProductAttributeValue).where(
                                ProductAttributeValue.attribute_id == db_attr.id,
                                ProductAttributeValue.value == option
                            ))
                            db_val = val_result.scalars().first()
                        
                        if db_val and db_val not in target_product.attribute_values:
                            target_product.attribute_values.append(db_val)
                            
            # Guardamos cada 50 para liberar memoria o lo dejamos al final
            if i % 100 == 0:
                await db.commit()
                
        await db.commit()
        update_global_status(100, f"Sincronización finalizada. Nuevos: {new_count} | Actualizados: {updated_count}", "done")
        print(f"🎉 Sincronización finalizada. Nuevos: {new_count} | Actualizados: {updated_count}")

async def main():
    print("--- ⚡ Gamer Loot: Motor de Migración WooCommerce ⚡ ---")
    products = await fetch_woocommerce_products()
    if products:
        await sync_products_to_db(products)

if __name__ == "__main__":
    asyncio.run(main())
