import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    for t in tables:
        print(t['table_name'])
    await conn.close()

asyncio.run(run())
