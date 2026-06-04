import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from sqlalchemy import text, select
from app.db.session import engine, AsyncSessionLocal
from app.models.product import Brand, Product
from app.models.inventory import InventoryStock

async def run_migration():
    print("Running migration for Brands...")
    
    # 1. Crear tabla y columna
    async with engine.begin() as conn:
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS brands (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    slug VARCHAR NOT NULL,
                    description TEXT,
                    image_url VARCHAR,
                    website_url VARCHAR,
                    is_featured BOOLEAN DEFAULT FALSE
                )
            """))
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_brands_name ON brands (name)"))
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_brands_slug ON brands (slug)"))
            print("Created table 'brands' and indexes")
            
            await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id);"))
            print("Added brand_id to products")
        except Exception as e:
            print(f"Error executing schema changes: {e}")

    # 2. Migrar datos
    async with AsyncSessionLocal() as db:
        print("Migrating brand strings to brands table...")
        
        # Obtener todas las marcas (strings únicos)
        result = await db.execute(
            select(Product.brand)
            .where(Product.brand.isnot(None))
            .where(Product.brand != "")
            .distinct()
        )
        unique_brands = result.scalars().all()
        
        print(f"Found {len(unique_brands)} unique brand strings.")
        
        for brand_name in unique_brands:
            brand_name = brand_name.strip()
            if not brand_name: continue
            
            slug = brand_name.lower().replace(" ", "-")
            
            # Revisar si ya existe
            check = await db.execute(select(Brand).where(Brand.slug == slug))
            existing_brand = check.scalars().first()
            
            if not existing_brand:
                existing_brand = Brand(name=brand_name, slug=slug)
                db.add(existing_brand)
                await db.flush() # Para obtener su ID
                
            # Actualizar todos los productos con este string viejo a este ID nuevo
            # Nota: ilike para asegurar mayusculas/minusculas
            await db.execute(
                text("UPDATE products SET brand_id = :b_id WHERE brand ILIKE :b_name")
                .bindparams(b_id=existing_brand.id, b_name=brand_name)
            )
            
        await db.commit()
        print("Brand migration complete!")

if __name__ == "__main__":
    asyncio.run(run_migration())
