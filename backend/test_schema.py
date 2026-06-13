import asyncio
from app.db.session import SessionLocal
from app.models.sales import Order
from app.schemas.sales import OrderResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test():
    async with SessionLocal() as db:
        query = select(Order).options(selectinload(Order.items)).where(Order.id == 1)
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        if order:
            try:
                res = OrderResponse.model_validate(order)
                print("SUCCESS:", res.folio)
            except Exception as e:
                print("VALIDATION ERROR:", e)

asyncio.run(test())
