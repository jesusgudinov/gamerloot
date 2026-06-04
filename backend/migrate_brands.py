import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE brands ADD COLUMN has_storefront BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE brands ADD COLUMN store_config JSON;"))
            print("Columns added successfully")
        except Exception as e:
            print("Error:", e)
    await engine.dispose()

asyncio.run(main())
