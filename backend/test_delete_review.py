import asyncio
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.interaction import Review
from app.routers.products import create_product, delete_product
from app.schemas.product import ProductCreate

async def main():
    async with AsyncSessionLocal() as db:
        try:
            prod_in = ProductCreate(
                sku="TEST-REV-DEL",
                name="Test Review Delete",
                slug="test-rev-del",
                base_price=10.0,
            )
            created = await create_product(prod_in, db)
            print(f"Created product {created.id}")
            
            # Create a review
            review = Review(product_id=created.id, user_id=1, rating=5, comment="Nice")
            db.add(review)
            await db.commit()
            
            await delete_product(created.id, db)
            print("Successfully deleted product with review")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
