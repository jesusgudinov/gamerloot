import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import engine

async def migrate():
    print("Running migration for attribute connectors...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE product_attributes ADD COLUMN is_connector BOOLEAN DEFAULT FALSE;"))
            print("Added is_connector to product_attributes")
        except Exception as e:
            print(f"Error product_attributes is_connector (might already exist): {e}")

        try:
            await conn.execute(text("ALTER TABLE product_attributes ADD COLUMN connected_categories JSON;"))
            print("Added connected_categories to product_attributes")
        except Exception as e:
            print(f"Error product_attributes connected_categories (might already exist): {e}")

    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
