import asyncio
import sys
import os

# Añadir el backend al path para poder importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Intentar obtener la URL de BD del archivo .env, si no, usar localhost
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))
except ImportError:
    pass

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/gamerloot")

async def migrate_categories():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("1. Adding 'icon' column...")
            await session.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR;"))
            
            print("2. Adding 'promo_image_url' column...")
            await session.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS promo_image_url VARCHAR;"))
            
            print("3. Adding 'is_featured' column...")
            await session.execute(text("ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;"))
            
            print("4. Migrating icons from 'image_url' to 'icon'...")
            # Si image_url no empieza con http o / asuminos que es un ícono de Lucide (ej. Cpu, Laptop, Mouse)
            # Primero copiamos
            await session.execute(text("""
                UPDATE categories 
                SET icon = image_url 
                WHERE image_url IS NOT NULL 
                AND image_url NOT LIKE 'http%' 
                AND image_url NOT LIKE '/%';
            """))
            
            print("5. Clearing migrated 'image_url' values...")
            # Luego limpiamos image_url para dejar el espacio libre para fotos reales
            await session.execute(text("""
                UPDATE categories 
                SET image_url = NULL 
                WHERE image_url IS NOT NULL 
                AND image_url NOT LIKE 'http%' 
                AND image_url NOT LIKE '/%';
            """))
            
            await session.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            await session.rollback()
            print(f"Migration failed: {e}")
            raise e
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_categories())
