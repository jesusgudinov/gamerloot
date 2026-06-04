import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.db.session import engine
from app.db.session import engine
from app.models.user import Base
import app.models.product
import app.models.sales

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Sales tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_db())
