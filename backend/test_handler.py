import asyncio
from app.db.session import AsyncSessionLocal
from app.routers.marketing import get_campaigns

async def main():
    async with AsyncSessionLocal() as db:
        camps = await get_campaigns(db)
        for c in camps:
            print(f"Campaign: id={c.id}, name={c.name}")

if __name__ == "__main__":
    asyncio.run(main())
