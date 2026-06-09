import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine
from app.models.sales import Base

async def migrate_rma():
    async with engine.begin() as conn:
        # Esto creará todas las tablas que no existan, en este caso sales_rmas y sales_rma_items
        await conn.run_sync(Base.metadata.create_all)
        print("Migración de RMA completada con éxito.")

if __name__ == "__main__":
    asyncio.run(migrate_rma())
