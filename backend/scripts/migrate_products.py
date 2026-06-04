import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db.session import AsyncSessionLocal

async def run_migration():
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;"))
            await db.execute(text("ALTER TABLE products ADD COLUMN rating FLOAT DEFAULT 0.0;"))
            await db.execute(text("ALTER TABLE products ADD COLUMN reviews_count INTEGER DEFAULT 0;"))
            await db.commit()
            print("Migration successful")
        except Exception as e:
            print(f"Migration error: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
