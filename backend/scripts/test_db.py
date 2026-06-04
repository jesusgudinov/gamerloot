import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from sqlalchemy import select, func
from app.models.product import Product

async def main():
    async with AsyncSessionLocal() as db:
        res1 = await db.execute(select(func.count(Product.id)).where(Product.main_image_url.isnot(None)))
        print(f"Products with image: {res1.scalar()}")
        res2 = await db.execute(select(func.count(Product.id)).where(Product.category_id.isnot(None)))
        print(f"Products with category: {res2.scalar()}")

asyncio.run(main())
