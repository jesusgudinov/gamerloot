import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

async def migrate():
    print("Iniciando migración de sales_order_items...")
    try:
        async with engine.begin() as conn:
            # Agregamos las columnas si no existen
            await conn.execute(text("ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS unit_cost FLOAT DEFAULT 0.0;"))
            await conn.execute(text("ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS total_cost FLOAT DEFAULT 0.0;"))
            
        print("✅ Migración completada exitosamente.")
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
