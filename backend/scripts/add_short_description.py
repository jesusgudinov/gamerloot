import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.db.session import engine
from sqlalchemy import text

async def add_column():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE products ADD COLUMN short_description TEXT;"))
            print("Column added successfully.")
        except Exception as e:
            print("Error adding column:", e)

if __name__ == "__main__":
    asyncio.run(add_column())
