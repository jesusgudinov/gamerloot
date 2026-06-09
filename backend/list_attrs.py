import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine('postgresql+asyncpg://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    async with engine.connect() as conn:
        res = await conn.execute(text('SELECT name, is_connector FROM product_attributes ORDER BY id DESC LIMIT 20'))
        print("Recent attributes:")
        for r in res:
            print(f"- {r[0]} (Connector: {r[1]})")

asyncio.run(run())
