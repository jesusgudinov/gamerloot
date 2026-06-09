import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    cat = await conn.fetchrow("SELECT id FROM categories WHERE slug = 'tarjetas-de-video'")
    if not cat:
        print("Category not found")
        return
        
    attr = await conn.fetchrow("SELECT id FROM product_attributes WHERE name = 'TDP'")
    if not attr:
        print("Attribute TDP not found")
        return
        
    existing = await conn.fetchrow(
        "SELECT id FROM category_attributes WHERE category_id = $1 AND attribute_id = $2",
        cat['id'], attr['id']
    )
    if existing:
        print("TDP is already assigned to tarjetas-de-video")
    else:
        await conn.execute(
            "INSERT INTO category_attributes (category_id, attribute_id, is_critical) VALUES ($1, $2, $3)",
            cat['id'], attr['id'], False
        )
        print("Successfully added TDP to tarjetas-de-video")

    await conn.close()

asyncio.run(run())
