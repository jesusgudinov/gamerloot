import asyncio
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.product import Product
from app.routers.products import create_product, delete_product
from app.schemas.product import ProductCreate

async def main():
    async with AsyncSessionLocal() as db:
        try:
            prod_in = ProductCreate(
                sku="TEST-DELETE-2",
                name="Test Delete 2",
                slug="test-delete-2",
                base_price=10.0,
            )
            created = await create_product(prod_in, db)
            print(f"Created product {created.id}")
            
            await delete_product(created.id, db)
            print("Successfully deleted product")
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
