import asyncio
from app.db.session import AsyncSessionLocal
from app.models.product import Product
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        try:
            q = select(Product).where(Product.tags.any('oferta'))
            await db.execute(q)
            print("SUCCESS")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
