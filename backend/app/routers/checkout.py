from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.services.skydropx import SkydropxService
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.sales import Order, OrderItem
from app.models.product import Product
from app.models.marketing import Coupon
from app.models.inventory import InventoryStock, Warehouse
from sqlalchemy import select, update
import random
from datetime import datetime, timezone

router = APIRouter()

class QuoteShippingRequest(BaseModel):
    destination_zip: str
    items: List[Dict[str, Any]] # { "product_id": 1, "quantity": 2, "weight": 1.5 }

@router.post("/quote-shipping")
async def quote_shipping(req: QuoteShippingRequest, db: AsyncSession = Depends(get_db)):
    if not req.destination_zip or len(req.destination_zip) != 5:
        raise HTTPException(status_code=400, detail="Código postal inválido")
        
    origin_groups = {} # zip_code -> items
    
    for item in req.items:
        # Check stock location
        query = select(Warehouse).join(InventoryStock).where(
            InventoryStock.product_id == item.get("product_id"),
            InventoryStock.quantity >= item.get("quantity", 1)
        ).limit(1)
        res = await db.execute(query)
        warehouse = res.scalar_one_or_none()
        
        origin_zip = warehouse.zip_code if warehouse and warehouse.zip_code else "06700"
        
        if origin_zip not in origin_groups:
            origin_groups[origin_zip] = []
        origin_groups[origin_zip].append(item)
        
    skydropx = SkydropxService()
    from app.core.packaging import calculate_virtual_parcel
    import asyncio
    
    tasks = []
    origins_used = list(origin_groups.keys())
    
    for origin_zip, items in origin_groups.items():
        parcel = calculate_virtual_parcel(items)
        tasks.append(skydropx.get_rates_v2(origin_zip, req.destination_zip, parcel))
        
    results = await asyncio.gather(*tasks)
    
    total_cost_std = 0.0
    unified_breakdown_std = []
    
    total_cost_exp = 0.0
    unified_breakdown_exp = []
    
    for origin_zip, rates in zip(origins_used, results):
        if not rates:
            continue
        
        # Standard: Cheapest
        best_std = min(rates, key=lambda x: x["amount_local"])
        total_cost_std += best_std["amount_local"]
        unified_breakdown_std.append({
            "origin_zip": origin_zip,
            "provider": best_std["provider"],
            "days": best_std["days"],
            "cost": best_std["amount_local"],
            "items": [i.get("product_id") for i in origin_groups[origin_zip]]
        })
        
        # Express: Fastest (if tied, cheapest of fastest)
        best_exp = min(rates, key=lambda x: (x["days"], x["amount_local"]))
        total_cost_exp += best_exp["amount_local"]
        unified_breakdown_exp.append({
            "origin_zip": origin_zip,
            "provider": best_exp["provider"],
            "days": best_exp["days"],
            "cost": best_exp["amount_local"],
            "items": [i.get("product_id") for i in origin_groups[origin_zip]]
        })
        
    if not unified_breakdown_std:
        raise HTTPException(status_code=400, detail="No se pudieron cotizar envíos para los productos")

    max_days_std = max([b["days"] for b in unified_breakdown_std])
    combined_rate_std = {
        "provider": "Loot Unificado",
        "service_level_name": "Estándar",
        "service_level_code": "GL_STD",
        "amount_local": round(total_cost_std, 2),
        "currency": "MXN",
        "days": max_days_std,
        "breakdown": unified_breakdown_std
    }
    
    final_rates = [combined_rate_std]
    
    max_days_exp = max([b["days"] for b in unified_breakdown_exp])
    # Only offer Express if it's faster or at least different in service/cost
    if total_cost_exp > total_cost_std and max_days_exp < max_days_std:
        combined_rate_exp = {
            "provider": "Loot Unificado",
            "service_level_name": "Express",
            "service_level_code": "GL_EXP",
            "amount_local": round(total_cost_exp, 2),
            "currency": "MXN",
            "days": max_days_exp,
            "breakdown": unified_breakdown_exp
        }
        final_rates.append(combined_rate_exp)
    
    return {"rates": final_rates}

class ValidateCouponRequest(BaseModel):
    code: str
    subtotal: float

@router.post("/validate-coupon")
async def validate_coupon(req: ValidateCouponRequest, db: AsyncSession = Depends(get_db)):
    code = req.code.strip().upper()
    query = select(Coupon).where(Coupon.code == code, Coupon.is_active == True)
    result = await db.execute(query)
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón inválido o inactivo")

    # Validar fechas
    now = datetime.now(timezone.utc)
    if coupon.start_date and now < coupon.start_date:
        raise HTTPException(status_code=400, detail="Este cupón aún no es válido")
    if coupon.end_date and now > coupon.end_date:
        raise HTTPException(status_code=400, detail="Este cupón ha expirado")

    # Validar límite de usos
    if coupon.usage_limit is not None and coupon.times_used >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Este cupón ha alcanzado su límite de usos")

    # Validar monto mínimo
    if req.subtotal < coupon.min_purchase_amount:
        raise HTTPException(status_code=400, detail=f"Monto mínimo de compra para este cupón es {coupon.min_purchase_amount}")

    # Calcular descuento
    discount = 0.0
    if coupon.discount_type == "percentage":
        discount = req.subtotal * (coupon.discount_value / 100.0)
    elif coupon.discount_type == "fixed":
        discount = coupon.discount_value
    
    # Aplicar límite máximo de descuento si aplica
    if coupon.max_discount_amount and discount > coupon.max_discount_amount:
        discount = coupon.max_discount_amount
        
    # Asegurar que el descuento no exceda el subtotal
    if discount > req.subtotal:
        discount = req.subtotal

    return {
        "success": True,
        "discount_amount": discount,
        "coupon_id": coupon.id,
        "message": "Cupón aplicado correctamente"
    }

class PlaceOrderRequest(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_zip: str
    shipping_city: str
    shipping_state: str
    items: List[Dict[str, Any]]
    shipping_cost: float
    shipping_provider: str
    coupon_code: str = None

@router.post("/place-order")
async def place_order(req: PlaceOrderRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 1. Generar Folio
    folio = f"LOOT-{random.randint(100000, 999999)}"
    
    # Asegurar que el folio sea único
    existing = await db.execute(select(Order).where(Order.folio == folio))
    if existing.scalar_one_or_none():
        folio = f"LOOT-{random.randint(100000, 999999)}"

    # 2. Calcular totales reales basados en el backend (por seguridad, ignoramos totales del frontend pero para MVP lo mapeamos)
    # Asumimos que los items tienen total_price calculado en frontend
    subtotal = sum(item.get("total_price", 0) for item in req.items)
    
    applied_coupon_id = None
    real_discount = 0.0
    
    # 2.5 Validar cupón de forma real en BD si se envió
    if req.coupon_code:
        code = req.coupon_code.strip().upper()
        query = select(Coupon).where(Coupon.code == code, Coupon.is_active == True)
        res = await db.execute(query)
        coupon = res.scalar_one_or_none()
        
        if coupon:
            now = datetime.now(timezone.utc)
            is_valid = True
            if coupon.start_date and now < coupon.start_date: is_valid = False
            if coupon.end_date and now > coupon.end_date: is_valid = False
            if coupon.usage_limit is not None and coupon.times_used >= coupon.usage_limit: is_valid = False
            if subtotal < coupon.min_purchase_amount: is_valid = False
            
            if is_valid:
                applied_coupon_id = coupon.id
                if coupon.discount_type == "percentage":
                    real_discount = subtotal * (coupon.discount_value / 100.0)
                elif coupon.discount_type == "fixed":
                    real_discount = coupon.discount_value
                if coupon.max_discount_amount and real_discount > coupon.max_discount_amount:
                    real_discount = coupon.max_discount_amount
                if real_discount > subtotal:
                    real_discount = subtotal
    
    tax = subtotal * 0.16
    total = subtotal + tax + req.shipping_cost - real_discount

    # 3. Insertar Order
    new_order = Order(
        folio=folio,
        user_id=current_user.id,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        customer_email=req.customer_email,
        company_name=None,
        contact_method="Email",
        state=req.shipping_state,
        city=req.shipping_city,
        address=req.shipping_address,
        address_references=None,
        zip_code=req.shipping_zip,
        status="Pendiente",
        payment_method="SPEI",
        carrier=req.shipping_provider,
        subtotal=subtotal,
        tax=tax,
        total=total,
        applied_coupon_id=applied_coupon_id
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    # 4. Insertar Order Items y Reservar Inventario
    for item in req.items:
        new_item = OrderItem(
            order_id=new_order.id,
            product_id=item.get("product_id"),
            sku=item.get("sku", "UNKNOWN"),
            product_name=item.get("product_name", "Unknown Product"),
            quantity=item.get("quantity", 1),
            unit_price=item.get("unit_price", 0),
            total_price=item.get("total_price", 0)
        )
        db.add(new_item)
        
        # Reservar inventario
        await db.execute(
            update(Product)
            .where(Product.id == item.get("product_id"))
            .values(reserved_quantity=Product.reserved_quantity + item.get("quantity", 1))
        )
        
    await db.commit()
    
    return {
        "success": True,
        "message": "Pedido creado exitosamente",
        "order_id": new_order.id,
        "folio": folio,
        "payment_instructions": "Por favor realiza tu transferencia SPEI con el folio del pedido como concepto."
    }
