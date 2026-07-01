import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, func, update
from app.db.session import engine, AsyncSessionLocal
from app.models.sales import Order, OrderItem
from app.models.product import Product
from app.models.marketing import Campaign, Coupon, Affiliate
from app.models.inventory import InventoryStock

async def migrate():
    print("Iniciando backfill de costos en sales_order_items...")
    try:
        async with AsyncSessionLocal() as db:
            # Obtener todos los items sin costo
            stmt = select(OrderItem).where(OrderItem.total_cost == 0.0)
            res = await db.execute(stmt)
            items = res.scalars().all()
            
            print(f"Se encontraron {len(items)} items para actualizar.")
            
            for item in items:
                # Obtener costo del proveedor
                cost_stmt = select(func.min(InventoryStock.supplier_cost)).where(
                    InventoryStock.product_id == item.product_id,
                    InventoryStock.supplier_cost > 0
                )
                cost_res = await db.execute(cost_stmt)
                min_cost = cost_res.scalar() or 0.0
                
                item.unit_cost = min_cost
                item.total_cost = min_cost * item.quantity
                
                db.add(item)
                
            await db.commit()
            
        print("✅ Backfill completado exitosamente.")
    except Exception as e:
        print(f"❌ Error durante el backfill: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
