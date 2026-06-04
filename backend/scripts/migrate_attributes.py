import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from sqlalchemy import text
from app.db.session import engine

async def run_migration():
    print("Running migration for attributes and configurator...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE categories ADD COLUMN is_for_configurator BOOLEAN DEFAULT FALSE;"))
            print("Added is_for_configurator to categories")
        except Exception as e:
            print(f"Error categories is_for_configurator: {e}")

        try:
            await conn.execute(text("ALTER TABLE product_attributes ADD COLUMN type VARCHAR DEFAULT 'text';"))
            print("Added type to product_attributes")
        except Exception as e:
            print(f"Error product_attributes type: {e}")

        try:
            await conn.execute(text("ALTER TABLE product_attributes ADD COLUMN is_filterable BOOLEAN DEFAULT TRUE;"))
            print("Added is_filterable to product_attributes")
        except Exception as e:
            print(f"Error product_attributes is_filterable: {e}")

        try:
            await conn.execute(text("ALTER TABLE product_attributes ADD COLUMN is_for_configurator BOOLEAN DEFAULT FALSE;"))
            print("Added is_for_configurator to product_attributes")
        except Exception as e:
            print(f"Error product_attributes is_for_configurator: {e}")

        try:
            await conn.execute(text("ALTER TABLE product_attribute_values ADD COLUMN color_hex VARCHAR;"))
            print("Added color_hex to product_attribute_values")
        except Exception as e:
            print(f"Error product_attribute_values color_hex: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(run_migration())
