import asyncio
from app.db.session import async_session
from app.models.product import ProductAttribute, Category
from sqlalchemy.future import select

async def run():
    async with async_session() as db:
        cats = await db.execute(select(Category))
        cat_map = {c.id: c.slug for c in cats.scalars().all()}
        
        res = await db.execute(select(ProductAttribute).where(ProductAttribute.is_connector == True))
        for attr in res.scalars().all():
            if attr.connected_categories:
                connected = [cat_map.get(cid) for cid in attr.connected_categories]
                print(f'Attribute: {attr.name}, Connected to: {connected}')

asyncio.run(run())
