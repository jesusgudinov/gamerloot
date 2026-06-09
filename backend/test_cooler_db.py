import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    # Buscamos el disipador
    cooler = await conn.fetchrow("""
        SELECT p.id, p.name, p.status, p.is_in_configurator, c.slug as cat_slug 
        FROM products p 
        JOIN categories c ON p.category_id = c.id
        WHERE p.name ILIKE '%Hyper 212 Spectrum V3%' AND c.slug = 'disipadores'
    """)
    if cooler:
        print("Cooler:", dict(cooler))
        # fetch relation
        rels = await conn.fetch("""
            SELECT * FROM product_attribute_associations WHERE product_id = $1
        """, cooler['id'])
        
        attrs = []
        for r in rels:
            val = await conn.fetchrow("SELECT attribute_id, value FROM product_attribute_values WHERE id = $1", r['attribute_value_id'])
            attr = await conn.fetchrow("SELECT name FROM product_attributes WHERE id = $1", val['attribute_id'])
            print(f"  {attr['name']}: {val['value']}")
    else:
        print("Cooler not found in category disipadores")

    # Buscamos el procesador 12900
    proc = await conn.fetchrow("""
        SELECT p.id, p.name 
        FROM products p 
        JOIN categories c ON p.category_id = c.id
        WHERE c.slug = 'procesadores' AND p.name ILIKE '%12900%'
        LIMIT 1
    """)
    if proc:
        print("\nProc:", dict(proc))
        rels = await conn.fetch("""
            SELECT * FROM product_attribute_associations WHERE product_id = $1
        """, proc['id'])
        for r in rels:
            val = await conn.fetchrow("SELECT attribute_id, value FROM product_attribute_values WHERE id = $1", r['attribute_value_id'])
            attr = await conn.fetchrow("SELECT name FROM product_attributes WHERE id = $1", val['attribute_id'])
            if 'socket' in attr['name'].lower():
                print(f"  {attr['name']}: {val['value']}")

    await conn.close()

asyncio.run(run())
