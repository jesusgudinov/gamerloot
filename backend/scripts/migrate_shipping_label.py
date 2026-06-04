import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

async def migrate():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE sales_orders ADD COLUMN shipping_label_url VARCHAR NULL;"))
            print("Column shipping_label_url added to sales_orders table.")
        except Exception as e:
            print("Column might already exist:", e)

if __name__ == "__main__":
    asyncio.run(migrate())
