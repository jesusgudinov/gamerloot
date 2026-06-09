import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine('postgresql+asyncpg://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    async with engine.connect() as conn:
        res = await conn.execute(text('SELECT name, is_connector, connected_categories FROM product_attributes WHERE is_connector = true'))
        for r in res:
            print(r)

asyncio.run(run())
