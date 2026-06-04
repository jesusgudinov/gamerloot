import asyncio
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.product import Category
from app.routers.catalog import create_category, delete_category
from app.schemas.category import CategoryCreate

async def main():
    async with AsyncSessionLocal() as db:
        try:
            parent_in = CategoryCreate(name="Parent", slug="parent")
            parent = await create_category(parent_in, db)
            print(f"Parent {parent.id}")
            
            sub_in = CategoryCreate(name="Sub", slug="sub", parent_id=parent.id)
            sub = await create_category(sub_in, db)
            print(f"Sub {sub.id}")
            
            await delete_category(parent.id, db)
            print("Successfully deleted parent")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
