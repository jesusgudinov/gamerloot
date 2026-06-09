import asyncio
import sys
sys.path.append('.')
from sqlalchemy import select, func
from app.models.user import User
from app.models.sales import Order
import app.models.role # Import to avoid mapper errors
import app.models.product # Import to avoid mapper errors
import app.models.marketing
import app.models.inventory
from app.db.session import AsyncSessionLocal

async def update_ltvs():
    async with AsyncSessionLocal() as session:
        users = await session.execute(select(User))
        for user in users.scalars().all():
            ltv_stmt = select(func.sum(Order.total)).where(
                Order.user_id == user.id,
                Order.status.notin_(["Cancelado", "Cotización"])
            )
            total = (await session.execute(ltv_stmt)).scalar() or 0.0
            user.total_spent = total
            user.xp = int(total)
            user.level = 1 + (user.xp // 10000)
            
        await session.commit()
        print("LTVs y XP actualizados!")

if __name__ == "__main__":
    asyncio.run(update_ltvs())
