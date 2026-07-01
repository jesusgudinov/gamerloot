import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from app.db.session import engine
from app.models.user import BillingProfile
from app.models.sales import Invoice

async def create_tables():
    async with engine.begin() as conn:
        print("Creating BillingProfile and Invoice tables if they don't exist...")
        await conn.run_sync(BillingProfile.__table__.create, checkfirst=True)
        await conn.run_sync(Invoice.__table__.create, checkfirst=True)
        print("Done.")

if __name__ == "__main__":
    asyncio.run(create_tables())
