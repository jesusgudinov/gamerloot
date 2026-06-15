import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

async def migrate():
    print("Iniciando migración de Category (show_in_menu)...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE categories ADD COLUMN show_in_menu BOOLEAN DEFAULT TRUE;"))
            print("Columna show_in_menu añadida exitosamente.")
        except Exception as e:
            if "already exists" in str(e):
                print("La columna ya existe. Ignorando.")
            else:
                print(f"Error al añadir la columna: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
