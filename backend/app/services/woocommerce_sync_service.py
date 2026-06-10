import asyncio
import httpx
import base64
import re
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.product import Product, Brand, Category, ProductAttribute, ProductAttributeValue

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', str(raw_html)).strip()

class WooCommerceSyncService:
    def __init__(self):
        pass

    async def run_sync(self, db: AsyncSession, log_func: Callable[[int, str], None]):
        products = await self.fetch_woocommerce_products(log_func)
        if products:
            await self.sync_products_to_db(db, products, log_func)

    async def fetch_woocommerce_products(self, log_func: Callable[[int, str], None]):
        if not settings.WC_URL or not settings.WC_CONSUMER_KEY or not settings.WC_CONSUMER_SECRET:
            log_func(0, "Error: Credenciales faltantes")
            return []

        log_func(5, "Conectando a WooCommerce...")
        
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
                prog = min(10 + page * 2, 50)
                log_func(prog, f"Descargando página {page} de WooCommerce...")
                
                url = f"{settings.WC_URL}/wp-json/wc/v3/products?per_page=100&page={page}"
                response = await client.get(url, headers=headers, timeout=30.0)
                
                if response.status_code != 200:
                    log_func(prog, f"Error en API WC: {response.status_code}")
                    break
                    
                data = response.json()
                if not data:
                    break
                    
                products.extend(data)
                page += 1
                
        log_func(50, f"Descarga completa. {len(products)} productos. Preparando BD...")
        return products

    async def sync_products_to_db(self, db: AsyncSession, wc_products: list, log_func: Callable[[int, str], None]):
        cats_result = await db.execute(select(Category))
        categories_map = {c.slug: c.id for c in cats_result.scalars().all()}
        
        attrs_result = await db.execute(select(ProductAttributeValue))
        attrs_map = {f"{a.attribute_id}_{a.value}": a for a in attrs_result.scalars().all()}

        seen_upcs = set()

        new_count = 0
        updated_count = 0
        total_products = len(wc_products)
        
        for i, p in enumerate(wc_products):
            if i % 50 == 0:
                prog = 50 + int((i/total_products)*50)
                log_func(prog, f"Inyectando producto {i} de {total_products} a la BD...")
                
            base_price = float(p.get("regular_price") or p.get("price") or 0.0)
            
            images = [img.get("src") for img in p.get("images", [])]
            main_image_url = images[0] if images else None
            
            upc = p.get("global_unique_id") or ""
            if not upc:
                for meta in p.get("meta_data", []):
                    if meta.get("key") == "_upc":
                        upc = meta.get("value", "")
                        break
            upc = upc.strip() if upc and upc.strip() else None
            
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

            category_id = None
            if p.get("categories"):
                cat_slug = p["categories"][0].get("slug")
                category_id = categories_map.get(cat_slug)
            
            sku = p.get("sku")
            if not sku:
                sku = f"WC-{p.get('id')}"
                
            if upc:
                if upc in seen_upcs:
                    upc = None
                else:
                    check_query = select(Product.id).where(Product.upc == upc, Product.sku != sku)
                    check_result = await db.execute(check_query)
                    if check_result.scalars().first():
                        upc = None
                    else:
                        seen_upcs.add(upc)
                
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

            if hasattr(target_product, "attribute_values"):
                target_product.attribute_values = []
                
            wc_attributes = p.get("attributes", [])
            for attr in wc_attributes:
                attr_slug = attr.get("slug")
                if not attr_slug: continue
                
                attr_result = await db.execute(select(ProductAttribute).where(ProductAttribute.slug == attr_slug))
                db_attr = attr_result.scalars().first()
                
                if db_attr:
                    for option in attr.get("options", []):
                        val_key = f"{db_attr.id}_{option}"
                        db_val = attrs_map.get(val_key)
                        if not db_val:
                            val_result = await db.execute(select(ProductAttributeValue).where(
                                ProductAttributeValue.attribute_id == db_attr.id,
                                ProductAttributeValue.value == option
                            ))
                            db_val = val_result.scalars().first()
                        
                        if db_val and db_val not in target_product.attribute_values:
                            target_product.attribute_values.append(db_val)
                            
            if i % 100 == 0:
                await db.commit()
                
        await db.commit()
        log_func(100, f"Sincronización finalizada. Nuevos: {new_count} | Actualizados: {updated_count}")
