import asyncio
import asyncpg
import json

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    cat = await conn.fetchrow("SELECT id, slug, attribute_schema FROM categories WHERE slug = 'tarjetas-de-video'")
    print(f"Slug: {cat['slug']}")
    print(f"Schema: {cat['attribute_schema']}")

    await conn.close()

asyncio.run(run())
