import asyncio
import logging
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.models.user import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def drop_and_create_users():
    async with engine.begin() as conn:
        try:
            logger.info("Dropping users and user_addresses tables...")
            from sqlalchemy import text
            # Cascade drop users and addresses
            await conn.execute(text("DROP TABLE IF EXISTS user_addresses CASCADE"))
            await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            
            logger.info("Creating new users schema...")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Users schema created successfully.")
        except Exception as e:
            logger.error(f"Error updating schema: {e}")
            raise e

if __name__ == "__main__":
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    asyncio.run(drop_and_create_users())
