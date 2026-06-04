import asyncio
from sqlalchemy import text
from app.db.session import engine

async def alter():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE categories ADD COLUMN keywords JSON;"))
            print("Columna añadida con éxito.")
        except Exception as e:
            print("Error o ya existe:", e)

if __name__ == "__main__":
    asyncio.run(alter())
