import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def upgrade_db():
    async with AsyncSessionLocal() as db:
        await db.execute(text("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS zip_code VARCHAR;"))
        await db.execute(text("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS address VARCHAR;"))
        await db.execute(text("ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS phone VARCHAR;"))
        
        # Populate basic zip codes
        await db.execute(text("UPDATE warehouses SET zip_code='06700' WHERE internal_code LIKE '%CDMX%';"))
        await db.execute(text("UPDATE warehouses SET zip_code='44100' WHERE internal_code LIKE '%GDL%';"))
        await db.execute(text("UPDATE warehouses SET zip_code='64000' WHERE internal_code LIKE '%MTY%';"))
        
        await db.commit()
        print("Database updated successfully!")

if __name__ == "__main__":
    asyncio.run(upgrade_db())
