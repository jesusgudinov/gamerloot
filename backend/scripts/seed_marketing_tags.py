import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.db.session import engine, AsyncSessionLocal
from app.models.product import MarketingTag, Product
from app.models.inventory import InventoryStock
from sqlalchemy import select

async def seed_tags():
    async with AsyncSessionLocal() as session:
        tags = [
            {"name": "Lo Más Nuevo", "slug": "lo-mas-nuevo", "color_hex": "#10B981"},
            {"name": "Más Vendido", "slug": "mas-vendido", "color_hex": "#F59E0B"},
            {"name": "Gamer Loot Recomienda", "slug": "gamer-loot-recomienda", "color_hex": "#8B5CF6"},
            {"name": "Edición Limitada", "slug": "edicion-limitada", "color_hex": "#EF4444"},
        ]
        
        for t in tags:
            check = await session.execute(select(MarketingTag).where(MarketingTag.slug == t["slug"]))
            if not check.scalars().first():
                session.add(MarketingTag(**t))
                
        await session.commit()
        print("Etiquetas de marketing inyectadas con éxito.")

if __name__ == "__main__":
    asyncio.run(seed_tags())
