import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.inventory import Warehouse
from app.models.product import Product
from app.models.marketing import Campaign
from sqlalchemy import select, update

async def update_pch_warehouses():
    async with AsyncSessionLocal() as db:
        query = select(Warehouse).where(Warehouse.provider_name == "PCH")
        result = await db.execute(query)
        warehouses = result.scalars().all()
        
        count = 0
        for w in warehouses:
            if w.city != "CDMX" or w.state != "CDMX":
                w.city = "CDMX"
                w.state = "CDMX"
                if not w.name.startswith("Bodega PCH"):
                    w.name = w.name.replace("PCH CEDIS", "Bodega PCH - CEDIS")
                db.add(w)
                count += 1
                
        await db.commit()
        print(f"Updated {count} PCH warehouses to CDMX.")

if __name__ == "__main__":
    asyncio.run(update_pch_warehouses())
