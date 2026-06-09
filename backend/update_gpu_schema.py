import asyncio
import asyncpg
import json

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    cat = await conn.fetchrow("SELECT id, slug, attribute_schema FROM categories WHERE slug = 'tarjetas-de-video'")
    
    if cat and cat['attribute_schema']:
        schema = json.loads(cat['attribute_schema'])
        if "TDP" not in schema:
            schema.append("TDP")
            await conn.execute(
                "UPDATE categories SET attribute_schema = $1 WHERE id = $2",
                json.dumps(schema), cat['id']
            )
            print("Successfully added TDP to attribute_schema")
        else:
            print("TDP already in attribute_schema")
    else:
        print("Category not found or empty schema")

    await conn.close()

asyncio.run(run())
