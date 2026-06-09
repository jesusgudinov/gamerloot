import asyncio
import asyncpg
import json

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    mobos = await conn.fetch("""
        SELECT p.id, p.name 
        FROM products p 
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = 'tarjetas-madre'
    """)
    for m in mobos:
        print(f"Mobo: {m['name']}")
        rels = await conn.fetch("SELECT attribute_value_id FROM product_attribute_associations WHERE product_id = $1", m['id'])
        for r in rels:
            val = await conn.fetchrow("SELECT attribute_id, value FROM product_attribute_values WHERE id = $1", r['attribute_value_id'])
            attr = await conn.fetchrow("SELECT name FROM product_attributes WHERE id = $1", val['attribute_id'])
            if 'socket' in attr['name'].lower():
                print(f"  {attr['name']}: {val['value']}")

    await conn.close()

asyncio.run(run())
