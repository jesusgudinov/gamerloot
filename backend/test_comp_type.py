import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.product import Product

async def run():
    db = AsyncSessionLocal()
    try:
        pass
    finally:
        await db.close()

asyncio.run(run())
