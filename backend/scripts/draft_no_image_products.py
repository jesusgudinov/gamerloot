import asyncio
import os
import sys
from sqlalchemy import select, update, or_
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Adjust path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.product import Product
from app.models.marketing import Campaign
from app.models.inventory import InventoryStock

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def draft_no_image_products():
    print("Iniciando revisión de productos sin imagen...")
    async with AsyncSessionLocal() as session:
        # Consultar productos sin imagen que NO estén ya en borrador
        query = select(Product).where(
            or_(Product.main_image_url == None, Product.main_image_url == ""),
            Product.status != "DRAFT"
        )
        
        result = await session.execute(query)
        products_to_update = result.scalars().all()
        
        if not products_to_update:
            print("No se encontraron productos sin imagen que necesiten ser actualizados.")
            return

        print(f"Se encontraron {len(products_to_update)} productos sin imagen. Actualizando a estado DRAFT...")
        
        # Ejecutar update
        update_stmt = update(Product).where(
            or_(Product.main_image_url == None, Product.main_image_url == ""),
            Product.status != "DRAFT"
        ).values(status="DRAFT")
        
        await session.execute(update_stmt)
        await session.commit()
        
        print(f"✅ ¡Se han cambiado {len(products_to_update)} productos a estado Borrador (DRAFT) exitosamente!")

if __name__ == "__main__":
    asyncio.run(draft_no_image_products())
