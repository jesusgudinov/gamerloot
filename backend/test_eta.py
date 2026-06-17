import asyncio
from app.db.session import async_session
from app.models.product import Product
from app.models.inventory import InventoryStock
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    async with async_session() as db:
        query = select(Product).options(
            selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse)
        ).limit(5)
        result = await db.execute(query)
        products = result.scalars().all()
        for p in products:
            print(p.id, len(p.inventory_stocks))

asyncio.run(main())
