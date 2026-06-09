import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine('postgresql+asyncpg://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    async with engine.connect() as conn:
        # Find cooler
        res = await conn.execute(text("SELECT id, name FROM products WHERE sku = 'RR-S4NA-17PA-R1' OR name ILIKE '%Hyper 212 Spectrum V3%'"))
        cooler = res.fetchone()
        if cooler:
            print("Cooler:", cooler)
            cooler_id = cooler[0]
            # Get attributes
            res = await conn.execute(text("""
                SELECT a.name, v.value 
                FROM product_attribute_values v 
                JOIN product_attributes a ON v.attribute_id = a.id 
                WHERE v.product_id = :id AND v.value IS NOT NULL AND v.value != ''
            """), {"id": cooler_id})
            attrs = res.fetchall()
            print("Cooler Attrs:")
            for a in attrs:
                print(f"  {a[0]}: {a[1]}")
        else:
            print("Cooler not found")

asyncio.run(run())
