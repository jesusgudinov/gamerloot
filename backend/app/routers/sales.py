from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.deps import get_current_active_user, require_permissions
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, desc
from typing import List, Optional
import random

from app.db.session import get_db
from app.models.user import User
from app.models.sales import Order, OrderItem
from app.schemas.sales import OrderCreate, OrderResponse, OrderUpdate

from collections import defaultdict
from datetime import datetime
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

router = APIRouter()

def generate_folio():
    return f"LOOT-{random.randint(100000, 999999)}"

from sqlalchemy import func

@router.get("/stats", dependencies=[Depends(require_permissions(["manage_sales"]))])
async def get_sales_stats(db: AsyncSession = Depends(get_db)):
    # Total revenue (excluding Cancelado, Pendiente, Cotización)
    revenue_q = select(func.sum(Order.total)).where(Order.status.notin_(["Cancelado", "Pendiente", "Cotización"]))
    total_revenue = (await db.execute(revenue_q)).scalar() or 0.0

    # Total Profit (Utilidad Bruta)
    profit_q = select(
        func.sum(OrderItem.total_price).label("total_revenue_items"),
        func.sum(OrderItem.total_cost).label("total_cogs")
    ).select_from(Order).join(OrderItem).where(Order.status.notin_(["Cancelado", "Pendiente", "Cotización"]))
    
    profit_res = await db.execute(profit_q)
    profit_row = profit_res.one_or_none()
    gross_profit = (profit_row.total_revenue_items or 0.0) - (profit_row.total_cogs or 0.0) if profit_row else 0.0

    # Stripe Fees (3.6% + $3.00 MXN)
    stripe_fee_q = select(
        func.sum(Order.total * 0.036 + 3.00)
    ).where(Order.status.notin_(["Cancelado", "Pendiente", "Cotización"]), Order.payment_method == "Stripe")
    
    stripe_res = await db.execute(stripe_fee_q)
    stripe_fees = stripe_res.scalar() or 0.0
    
    # Utilidad Neta
    total_profit = gross_profit - stripe_fees

    # Total orders count
    total_orders_q = select(func.count(Order.id))
    total_orders = (await db.execute(total_orders_q)).scalar() or 0

    # Pending orders count
    pending_q = select(func.count(Order.id)).where(Order.status == "Pendiente")
    pending_orders = (await db.execute(pending_q)).scalar() or 0

    # Shipped orders count
    shipped_q = select(func.count(Order.id)).where(Order.status == "Enviado")
    shipped_orders = (await db.execute(shipped_q)).scalar() or 0

    # Daily sales chart (excluding Cancelado)
    # Using cast to Date for DB-agnostic date extraction
    from sqlalchemy import cast, Date
    chart_q = (
        select(
            cast(Order.created_at, Date).label("day"),
            func.sum(Order.total).label("daily_total")
        )
        .where(Order.status.notin_(["Cancelado", "Pendiente", "Cotización"]))
        .where(Order.created_at.is_not(None))
        .group_by(cast(Order.created_at, Date))
        .order_by(cast(Order.created_at, Date))
    )
    chart_res = await db.execute(chart_q)
    
    chart_data = []
    for row in chart_res.all():
        chart_data.append({"date": str(row.day), "total": float(row.daily_total or 0)})
        
    if not chart_data:
        # Dummy data for empty state
        today = datetime.now().strftime("%Y-%m-%d")
        chart_data = [{"date": today, "total": 0}]

    return {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "shipped_orders": shipped_orders,
        "chart_data": chart_data
    }

@router.get("/orders", response_model=List[OrderResponse], dependencies=[Depends(require_permissions(["manage_sales"]))])
async def list_orders(
    q: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).order_by(desc(Order.created_at))
    
    if status:
        query = query.where(Order.status == status)
        
    if q:
        search = f"%{q}%"
        query = query.where(
            or_(
                Order.folio.ilike(search),
                Order.customer_name.ilike(search),
                Order.tracking_number.ilike(search)
            )
        )
        
    result = await db.execute(query)
    return result.scalars().all()



@router.get("/my-orders", response_model=List[OrderResponse])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Devuelve los pedidos del usuario autenticado"""
    query = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.user_id == current_user.id).order_by(desc(Order.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/my-orders/{folio}", response_model=OrderResponse)
async def get_my_order_by_folio(
    folio: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Devuelve un pedido específico del usuario autenticado por folio"""
    query = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.invoice)).where(
        Order.folio == folio,
        Order.user_id == current_user.id
    )
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order

@router.post("/orders", response_model=OrderResponse, dependencies=[Depends(require_permissions(["manage_sales"]))])
async def create_order(order_in: OrderCreate, db: AsyncSession = Depends(get_db)):
    folio = generate_folio()
    
    existing = await db.execute(select(Order).where(Order.folio == folio))
    if existing.scalar_one_or_none():
        folio = generate_folio()
        
    # Validar que el usuario especificado exista
    user_stmt = select(User).where(User.id == order_in.user_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado. El ID de usuario proporcionado es inválido.")
        
    new_order = Order(
        folio=folio,
        user_id=user.id,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        customer_email=order_in.customer_email,
        company_name=order_in.company_name,
        contact_method=order_in.contact_method,
        state=order_in.state,
        city=order_in.city,
        address=order_in.address,
        address_references=order_in.address_references,
        zip_code=order_in.zip_code,
        status=order_in.status,
        is_assembled=order_in.is_assembled,
        payment_method=order_in.payment_method,
        carrier=order_in.carrier,
        tracking_number=order_in.tracking_number,
        customer_notes=order_in.customer_notes,
        subtotal=order_in.subtotal,
        tax=order_in.tax,
        total=order_in.total,
        valid_until=order_in.valid_until
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    for item in order_in.items:
        # Obtener costo del proveedor actual (el más bajo disponible)
        from app.models.inventory import InventoryStock
        cost_stmt = select(func.min(InventoryStock.supplier_cost)).where(
            InventoryStock.product_id == item.product_id,
            InventoryStock.supplier_cost > 0
        )
        cost_res = await db.execute(cost_stmt)
        min_cost = cost_res.scalar() or 0.0
        
        unit_cost = min_cost
        total_cost = unit_cost * item.quantity

        new_item = OrderItem(
            order_id=new_order.id,
            product_id=item.product_id,
            sku=item.sku,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
            unit_cost=unit_cost,
            total_cost=total_cost
        )
        db.add(new_item)
        
        # Reservar stock si el pedido entra en un estado que congela inventario (Cotización NO congela)
        if new_order.status in ["Pendiente", "Procesando", "Pagado"]:
            from app.models.product import Product
            from sqlalchemy import update
            await db.execute(update(Product).where(Product.id == item.product_id).values(reserved_quantity=Product.reserved_quantity + item.quantity))
        
    await db.commit()
    
    # Recalcular LTV del usuario
    from sqlalchemy import func
    ltv_stmt = select(func.sum(Order.total)).where(
        Order.user_id == new_order.user_id,
        Order.status.notin_(["Cancelado", "Cotización"])
    )
    new_ltv = (await db.execute(ltv_stmt)).scalar() or 0.0
    user_to_update = await db.get(User, new_order.user_id)
    if user_to_update:
        user_to_update.total_spent = new_ltv
        # 1 USD/MXN = 1 XP
        user_to_update.xp = int(new_ltv)
        # 1,000 XP per level (scale for Gamer Loot)
        new_level = 1 + (user_to_update.xp // 1000)
        user_to_update.level = new_level
        db.add(user_to_update)
        await db.commit()
        
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.id == new_order.id)
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/orders/{id}", response_model=OrderResponse, dependencies=[Depends(require_permissions(["manage_sales"]))])
async def get_order(id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.id == id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{id}", response_model=OrderResponse, dependencies=[Depends(require_permissions(["manage_sales"]))])
async def update_order(id: int, order_update: OrderUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.id == id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Statuses that hold reservations (Cotizaciones NO deberían congelar inventario)
    reserving_statuses = ["Pendiente", "Procesando", "Pagado"]
    was_reserving = order.status in reserving_statuses
    was_pagado = order.status == "Pagado"
    
    update_data = order_update.dict(exclude_unset=True)
    
    is_reserving = update_data.get("status", order.status) in reserving_statuses
    
    for key, value in update_data.items():
        setattr(order, key, value)
        
    # Lógica de Reserva de Stock
    if was_reserving and not is_reserving:
        # El pedido pasó de un estado que reserva a uno que NO reserva (ej: Enviado, Cancelado)
        # Liberamos el stock reservado
        from app.models.product import Product
        from sqlalchemy import update
        for item in order.items:
            await db.execute(update(Product).where(Product.id == item.product_id).values(reserved_quantity=Product.reserved_quantity - item.quantity))
    elif not was_reserving and is_reserving:
        # El pedido pasó de un estado que NO reserva a uno que SÍ reserva (raro pero posible)
        from app.models.product import Product
        from sqlalchemy import update
        for item in order.items:
            await db.execute(update(Product).where(Product.id == item.product_id).values(reserved_quantity=Product.reserved_quantity + item.quantity))

    # Lógica de Cupones y Afiliados al cambiar a Pagado
    is_pagado = order.status == "Pagado"
    if not was_pagado and is_pagado and order.applied_coupon_id:
        from app.models.marketing import Coupon, Affiliate
        from sqlalchemy import update
        
        # Incrementar times_used del cupón
        await db.execute(
            update(Coupon)
            .where(Coupon.id == order.applied_coupon_id)
            .values(times_used=Coupon.times_used + 1)
        )
        
        # Buscar si el cupón pertenece a un afiliado
        aff_query = select(Affiliate).where(Affiliate.coupon_id == order.applied_coupon_id, Affiliate.is_active == True)
        aff_res = await db.execute(aff_query)
        affiliate = aff_res.scalar_one_or_none()
        
        if affiliate:
            comision = order.total * (affiliate.commission_percentage / 100.0)
            await db.execute(
                update(Affiliate)
                .where(Affiliate.id == affiliate.id)
                .values(
                    total_sales_generated=Affiliate.total_sales_generated + order.total,
                    total_commission_earned=Affiliate.total_commission_earned + comision
                )
            )

    await db.commit()
    
    # Recalcular LTV del usuario
    from sqlalchemy import func
    ltv_stmt = select(func.sum(Order.total)).where(
        Order.user_id == order.user_id,
        Order.status.notin_(["Cancelado", "Cotización"])
    )
    new_ltv = (await db.execute(ltv_stmt)).scalar() or 0.0
    user_to_update = await db.get(User, order.user_id)
    if user_to_update:
        user_to_update.total_spent = new_ltv
        # 1 USD/MXN = 1 XP
        user_to_update.xp = int(new_ltv)
        # 1,000 XP per level
        new_level = 1 + (user_to_update.xp // 1000)
        user_to_update.level = new_level
        db.add(user_to_update)
        await db.commit()

    await db.refresh(order)
    return order

@router.get("/reports/dashboard", dependencies=[Depends(require_permissions(["manage_sales"]))])
async def get_sales_reports_dashboard(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order)
    if start_date:
        query = query.where(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.where(Order.created_at <= datetime.fromisoformat(end_date))
        
    orders_res = await db.execute(query.options(selectinload(Order.items).selectinload(OrderItem.product)))
    orders = orders_res.scalars().all()
    
    valid_orders = [o for o in orders if o.status not in ["Cancelado", "Cotización"]]
    total_revenue = sum(o.total for o in valid_orders)
    total_orders_count = len(valid_orders)
    aov = total_revenue / total_orders_count if total_orders_count > 0 else 0
    
    daily_sales = defaultdict(lambda: {"revenue": 0, "orders": 0})
    status_counts = defaultdict(int)
    
    for o in orders:
        status_counts[o.status] += 1
        if o.status not in ["Cancelado", "Cotización"]:
            day_str = o.created_at.strftime("%Y-%m-%d") if o.created_at else "Unknown"
            daily_sales[day_str]["revenue"] += o.total
            daily_sales[day_str]["orders"] += 1
            
    sales_over_time = [{"date": k, "revenue": v["revenue"], "orders": v["orders"]} for k, v in sorted(daily_sales.items())]
    sales_by_status = [{"status": k, "count": v} for k, v in status_counts.items()]
    
    product_sales = defaultdict(lambda: {"qty": 0, "revenue": 0, "name": ""})
    for o in valid_orders:
        for item in o.items:
            product_sales[item.product_id]["qty"] += item.quantity
            product_sales[item.product_id]["revenue"] += item.total_price
            product_sales[item.product_id]["name"] = item.product_name
            
    top_products = [{"product_id": k, "name": v["name"], "qty": v["qty"], "revenue": v["revenue"]} for k, v in product_sales.items()]
    top_products = sorted(top_products, key=lambda x: x["revenue"], reverse=True)[:10]
    
    return {
        "kpis": {
            "total_revenue": total_revenue,
            "total_orders": total_orders_count,
            "aov": aov
        },
        "sales_over_time": sales_over_time,
        "sales_by_status": sales_by_status,
        "top_products": top_products
    }

@router.get("/reports/export", dependencies=[Depends(require_permissions(["manage_sales"]))])
async def export_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).order_by(desc(Order.created_at))
    if start_date:
        query = query.where(Order.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.where(Order.created_at <= datetime.fromisoformat(end_date))
        
    res = await db.execute(query)
    orders = res.scalars().all()
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Folio", "Fecha", "Cliente", "Estado", "Articulos", "Subtotal", "Impuestos", "Total", "Status"])
    
    for o in orders:
        items_str = " | ".join([f"{i.quantity}x {i.product_name}" for i in o.items])
        writer.writerow([
            o.folio,
            o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
            o.customer_name,
            o.state or "",
            items_str,
            o.subtotal,
            o.tax,
            o.total,
            o.status
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_report.csv"}
    )
