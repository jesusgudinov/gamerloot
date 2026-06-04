import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings
from app.models.user import Base as UserBase
from app.models.interaction import Base as InteractionBase
# Need to import all models to ensure metadata is populated
from app.models.user import User
from app.models.product import Product

async def migrate():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        # 1. Add columns to users table
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;"))
            print("Columns xp and level added to users table.")
        except Exception as e:
            print("Columns might already exist:", e)
            
        # 2. Create new tables for interactions (Review, Question)
        await conn.run_sync(InteractionBase.metadata.create_all)
        print("Interactions tables created/verified.")

if __name__ == "__main__":
    asyncio.run(migrate())
