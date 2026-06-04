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
from sqlalchemy import select, update
import random
from datetime import datetime, timezone

router = APIRouter()

class QuoteShippingRequest(BaseModel):
    destination_zip: str
    items: List[Dict[str, Any]] # { "product_id": 1, "quantity": 2, "weight": 1.5 }

@router.post("/quote-shipping")
async def quote_shipping(req: QuoteShippingRequest):
    if not req.destination_zip or len(req.destination_zip) != 5:
        raise HTTPException(status_code=400, detail="Código postal inválido")
        
    skydropx = SkydropxService()
    rates = await skydropx.quote_shipping(req.destination_zip, req.items)
    
    return {"rates": rates}

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
