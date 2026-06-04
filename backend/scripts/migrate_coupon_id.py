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
            await conn.execute(text("ALTER TABLE sales_orders ADD COLUMN applied_coupon_id INTEGER NULL REFERENCES marketing_coupons(id);"))
            print("Column applied_coupon_id added to sales_orders table.")
        except Exception as e:
            print("Column might already exist or error occurred:", e)

if __name__ == "__main__":
    asyncio.run(migrate())
