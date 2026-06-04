import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.core.config import settings

async def main():
    print("Running migration for categories...")
    async with AsyncSessionLocal() as db:
        # Add parent_id
        try:
            await db.execute(text('ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id);'))
            print("Added parent_id")
        except Exception as e:
            print("parent_id might exist:", str(e))
            
        # Add image_url
        try:
            await db.execute(text('ALTER TABLE categories ADD COLUMN image_url VARCHAR;'))
            print("Added image_url")
        except Exception as e:
            print("image_url might exist:", str(e))
            
        # Add is_active
        try:
            await db.execute(text('ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE;'))
            print("Added is_active")
        except Exception as e:
            print("is_active might exist:", str(e))
            
        await db.commit()
    print("Migration complete.")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
    asyncio.run(main())
