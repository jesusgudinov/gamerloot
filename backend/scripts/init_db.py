import asyncio
from app.db.session import engine
from app.models.user import Base

# Es importante importar todos los modelos para que SQLAlchemy los reconozca y cree las tablas
from app.models.user import User
from app.models.product import Category, Product
from app.models.inventory import Warehouse, InventoryStock
from app.models.role import Role, Permission, RolePermission
from app.models.mapping import SupplierCategoryMap, UnmappedCategoryLog

async def init_models():
    print("🔧 Conectando a Supabase para crear la estructura de tablas...")
    async with engine.begin() as conn:
        # Crea todas las tablas si no existen
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tablas creadas con éxito.")

if __name__ == "__main__":
    asyncio.run(init_models())
