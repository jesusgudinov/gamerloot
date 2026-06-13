from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from sqlalchemy.orm import selectinload
import uuid

from app.db.session import get_db
from app.api.deps import require_permissions, get_current_active_user
from app.models.user import User
from app.models.sales import Order, OrderItem, RMARequest, RMAItem
from app.models.inventory import InventoryStock, Warehouse
from app.schemas.sales import RMACreate, RMAResponse, RMAUpdate

router = APIRouter()

@router.get("/", response_model=List[RMAResponse], dependencies=[Depends(require_permissions(["manage_sales"]))])
async def list_rmas(status: Optional[str] = None, rma_type: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(RMARequest).options(selectinload(RMARequest.items))
    if status:
        query = query.where(RMARequest.status == status)
    if rma_type:
        query = query.where(RMARequest.rma_type == rma_type)
        
    query = query.order_by(RMARequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/me", response_model=List[RMAResponse])
async def list_my_rmas(status: Optional[str] = None, rma_type: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    query = select(RMARequest).options(selectinload(RMARequest.items)).where(RMARequest.user_id == current_user.id)
    if status:
        query = query.where(RMARequest.status == status)
    if rma_type:
        query = query.where(RMARequest.rma_type == rma_type)
        
    query = query.order_by(RMARequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=RMAResponse)
async def create_rma(req: RMACreate, db: AsyncSession = Depends(get_db)):
    # Validate order
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == req.order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order_items_map = {item.id: item for item in order.items}
    
    # Calculate how many of each item are already in an RMA to prevent double RMA
    existing_rma_result = await db.execute(select(RMAItem).join(RMARequest).where(RMARequest.order_id == req.order_id))
    existing_rma_items = existing_rma_result.scalars().all()
    rma_qty_map = {}
    for r_item in existing_rma_items:
        rma_qty_map[r_item.order_item_id] = rma_qty_map.get(r_item.order_item_id, 0) + r_item.quantity

    # Validate quantities
    for item in req.items:
        if item.order_item_id not in order_items_map:
            raise HTTPException(status_code=400, detail=f"Item {item.order_item_id} no pertenece al pedido.")
            
        purchased_qty = order_items_map[item.order_item_id].quantity
        already_rma_qty = rma_qty_map.get(item.order_item_id, 0)
        
        if (already_rma_qty + item.quantity) > purchased_qty:
            raise HTTPException(status_code=400, detail=f"Cantidad de devolución excede la comprada para el item {item.order_item_id}")

    folio = f"RMA-{str(uuid.uuid4())[:8].upper()}"
    new_rma = RMARequest(
        folio=folio,
        order_id=req.order_id,
        user_id=req.user_id,
        rma_type=req.rma_type,
        customer_reason=req.customer_reason,
        status="Pendiente"
    )
    db.add(new_rma)
    await db.flush() # Para obtener ID
    
    for item in req.items:
        rma_item = RMAItem(
            rma_id=new_rma.id,
            order_item_id=item.order_item_id,
            quantity=item.quantity,
            condition=item.condition
        )
        db.add(rma_item)
        
    await db.commit()
    
    # Reload with items
    res = await db.execute(select(RMARequest).options(selectinload(RMARequest.items)).where(RMARequest.id == new_rma.id))
    return res.scalars().first()

@router.put("/{rma_id}", response_model=RMAResponse, dependencies=[Depends(require_permissions(["manage_sales"]))])
async def update_rma(rma_id: int, update: RMAUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RMARequest).options(selectinload(RMARequest.items)).where(RMARequest.id == rma_id))
    rma = result.scalars().first()
    if not rma:
        raise HTTPException(status_code=404, detail="RMA no encontrado")
        
    # Check if we need to restock
    will_restock = False
    if update.status in ["Recibido", "Reembolsado"] and rma.status not in ["Recibido", "Reembolsado"]:
        if update.restock_to_inventory and rma.rma_type == "Devolución":
            will_restock = True

    if update.status:
        rma.status = update.status
    if update.admin_notes:
        rma.admin_notes = update.admin_notes
        
    if will_restock:
        # Recuperar los product_id
        for r_item in rma.items:
            oi_res = await db.execute(select(OrderItem).where(OrderItem.id == r_item.order_item_id))
            order_item = oi_res.scalars().first()
            if order_item:
                # Tratar de meter el inventario devuelto en la bodega principal de GAMER LOOT (LOCAL)
                # Si no existe, buscamos cualquiera
                warehouse_res = await db.execute(select(Warehouse).where(Warehouse.internal_code == "LOCAL"))
                local_wh = warehouse_res.scalars().first()
                wh_id = local_wh.id if local_wh else None
                
                if wh_id:
                    stock_res = await db.execute(select(InventoryStock).where(InventoryStock.product_id == order_item.product_id, InventoryStock.warehouse_id == wh_id))
                    stock = stock_res.scalars().first()
                else:
                    stock_res = await db.execute(select(InventoryStock).where(InventoryStock.product_id == order_item.product_id).limit(1))
                    stock = stock_res.scalars().first()
                    
                if stock:
                    stock.quantity += r_item.quantity

    await db.commit()
    return rma
