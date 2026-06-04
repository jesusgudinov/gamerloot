import asyncio
import os
import sys

# Añadir el backend al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select, update, delete
from app.db.session import engine, AsyncSessionLocal
from app.models.product import Brand, Product
from app.models.inventory import InventoryStock

async def clean_brands():
    print("Iniciando limpieza de marcas duplicadas...")
    async with AsyncSessionLocal() as db:
        # Obtener todas las marcas
        result = await db.execute(select(Brand).order_by(Brand.id))
        brands = result.scalars().all()
        
        # Diccionario para agrupar nombres limpios
        cleaned_map = {}
        
        for brand in brands:
            # Limpieza: quitar espacios, puntos y pasarlo a mayúsculas para comparar
            clean_name = brand.name.strip().strip('.').strip().upper()
            
            if clean_name not in cleaned_map:
                cleaned_map[clean_name] = brand
            else:
                canonical_brand = cleaned_map[clean_name]
                print(f"Duplicado encontrado: '{brand.name}' (ID: {brand.id}) se fusionará en '{canonical_brand.name}' (ID: {canonical_brand.id})")
                
                # 1. Actualizar los productos que apunten a la marca duplicada
                await db.execute(
                    update(Product)
                    .where(Product.brand_id == brand.id)
                    .values(brand_id=canonical_brand.id)
                )
                
                # 2. Eliminar la marca duplicada
                await db.execute(
                    delete(Brand).where(Brand.id == brand.id)
                )
        
        await db.commit()
        print("¡Limpieza completada con éxito!")

if __name__ == "__main__":
    asyncio.run(clean_brands())
