import asyncio
import asyncpg
import json

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    cats = await conn.fetch("SELECT slug, name FROM categories")
    for c in cats:
        print(f"{c['slug']} - {c['name']}")

    await conn.close()

asyncio.run(run())
