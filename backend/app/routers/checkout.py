from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.services.skydropx_service import SkydropxService
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.sales import Order, OrderItem
from app.models.product import Product
from app.models.marketing import Coupon
from app.models.inventory import InventoryStock, Warehouse
from sqlalchemy import select, update, func
import random
from datetime import datetime, timezone

router = APIRouter()

class QuoteShippingRequest(BaseModel):
    destination_zip: str
    destination_city: Optional[str] = None
    destination_state: Optional[str] = None
    items: List[Dict[str, Any]] # { "product_id": 1, "quantity": 2, "weight": 1.5 }

@router.post("/quote-shipping")
async def quote_shipping(req: QuoteShippingRequest, db: AsyncSession = Depends(get_db)):
    if not req.destination_zip or len(req.destination_zip) != 5:
        raise HTTPException(status_code=400, detail="Código postal inválido")
        
    origin_zips = set()
    
    for item in req.items:
        # Check stock location
        query = select(Warehouse).join(InventoryStock).where(
            InventoryStock.product_id == item.get("product_id"),
            InventoryStock.quantity >= item.get("quantity", 1)
        ).limit(1)
        res = await db.execute(query)
        warehouse = res.scalar_one_or_none()
        
        origin_zip = warehouse.zip_code if warehouse and warehouse.zip_code else "06700"
        origin_zips.add(origin_zip)
        
    # Lógica de Origen Unificado
    # Si todos los productos salen de una misma bodega, usamos ese CP.
    # Si salen de múltiples bodegas, usamos la bodega Gamerloot GDL (45403).
    if len(origin_zips) == 1:
        final_origin_zip = list(origin_zips)[0]
    else:
        final_origin_zip = "45403"
            
    skydropx = SkydropxService()
    from app.core.packaging import calculate_virtual_parcel
    
    # Calcular 1 sola caja virtual con todos los ítems
    parcel = calculate_virtual_parcel(req.items)
    
    # Cotizar 1 sola vez
    rates = await skydropx.get_rates(final_origin_zip, req.destination_zip, parcel)
    
    if not rates:
        raise HTTPException(status_code=400, detail="No se pudieron cotizar envíos para esta ruta.")
        
    # 1. ESTÁNDAR: La más barata
    best_std = min(rates, key=lambda x: x["amount_local"])
    std_breakdown = [{
        "origin_zip": final_origin_zip,
        "provider": best_std["provider"],
        "days": best_std["days"],
        "cost": best_std["amount_local"],
        "items": [i.get("product_id") for i in req.items],
        "rate_id": best_std.get("rate_id", "")
    }]
    
    # 2. EXPRESS: La más rápida (si hay empate, la más barata de las rápidas)
    min_days = min(rates, key=lambda x: x["days"])["days"]
    fastest_rates = [r for r in rates if r["days"] == min_days]
    best_exp = min(fastest_rates, key=lambda x: x["amount_local"])
    
    exp_breakdown = [{
        "origin_zip": final_origin_zip,
        "provider": best_exp["provider"],
        "days": best_exp["days"],
        "cost": best_exp["amount_local"],
        "items": [i.get("product_id") for i in req.items],
        "rate_id": best_exp.get("rate_id", "")
    }]

    final_rates = []
    
    # Agregar Estándar
    final_rates.append({
        "provider": best_std["provider"],
        "service_level_name": "Estándar",
        "service_level_code": f"{best_std['provider'][:3].upper()}_STD",
        "amount_local": round(best_std["amount_local"], 2),
        "currency": "MXN",
        "days": best_std["days"],
        "breakdown": std_breakdown
    })
    
    # Agregar Express si difiere en costo o tiempo
    if best_exp["amount_local"] != best_std["amount_local"] or best_exp["days"] != best_std["days"]:
        final_rates.append({
            "provider": best_exp["provider"],
            "service_level_name": "Express",
            "service_level_code": f"{best_exp['provider'][:3].upper()}_EXP",
            "amount_local": round(best_exp["amount_local"], 2),
            "currency": "MXN",
            "days": best_exp["days"],
            "breakdown": exp_breakdown
        })
        
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
    shipping_neighborhood: str
    shipping_zip: str
    shipping_city: str
    shipping_state: str
    items: List[Dict[str, Any]]
    shipping_cost: float
    shipping_provider: str
    shipping_breakdown: Optional[List[Dict[str, Any]]] = None
    coupon_code: Optional[str] = None
    coupon_discount: Optional[float] = None
    payment_method: str = "SPEI"
    save_payment_method: bool = False

@router.post("/place-order")
async def place_order(req: PlaceOrderRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    # 1. Generar Folio
    folio = f"LOOT-{random.randint(100000, 999999)}"
    
    # Asegurar que el folio sea único
    existing = await db.execute(select(Order).where(Order.folio == folio))
    if existing.scalar_one_or_none():
        folio = f"LOOT-{random.randint(100000, 999999)}"

    # 2. Calcular totales reales basados en el backend (por seguridad, ignoramos totales del frontend pero para MVP lo mapeamos)
    # Asumimos que los items traen price y quantity del frontend
    subtotal = sum(float(item.get("price", 0)) * int(item.get("quantity", 1)) for item in req.items)
    
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
        address_references=req.shipping_neighborhood,
        zip_code=req.shipping_zip,
        status="Pendiente",
        payment_method=req.payment_method,
        carrier=req.shipping_provider,
        subtotal=subtotal,
        tax=tax,
        total=total,
        applied_coupon_id=applied_coupon_id,
        shipments_data=req.shipping_breakdown
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    # 4. Insertar Order Items y Reservar Inventario
    for item in req.items:
        # Obtener costo del proveedor actual (el más bajo disponible)
        cost_stmt = select(func.min(InventoryStock.supplier_cost)).where(
            InventoryStock.product_id == item.get("product_id"),
            InventoryStock.supplier_cost > 0
        )
        cost_res = await db.execute(cost_stmt)
        min_cost = cost_res.scalar() or 0.0
        
        unit_cost = min_cost
        total_cost = unit_cost * item.get("quantity", 1)

        quantity = int(item.get("quantity", 1))
        unit_price = float(item.get("price", 0))

        new_item = OrderItem(
            order_id=new_order.id,
            product_id=item.get("product_id"),
            sku=item.get("sku", "UNKNOWN"),
            product_name=item.get("name", item.get("product_name", "Unknown Product")),
            quantity=quantity,
            unit_price=unit_price,
            total_price=unit_price * quantity,
            unit_cost=unit_cost,
            total_cost=total_cost
        )
        db.add(new_item)
        
        # Reservar inventario
        await db.execute(
            update(Product)
            .where(Product.id == item.get("product_id"))
            .values(reserved_quantity=Product.reserved_quantity + item.get("quantity", 1))
        )
        
    await db.commit()
    
    response_data = {
        "success": True,
        "message": "Pedido creado exitosamente",
        "order_id": new_order.id,
        "folio": folio,
    }

    if req.payment_method == "Stripe":
        from app.services.stripe_service import StripeService
        intent = StripeService.create_payment_intent(
            amount=total, 
            order_id=new_order.id, 
            user_email=req.customer_email,
            customer_name=req.customer_name,
            save_card=req.save_payment_method
        )
        if "client_secret" in intent:
            response_data["client_secret"] = intent["client_secret"]
        else:
            raise HTTPException(status_code=500, detail="Error al procesar el pago con Stripe")
    else:
        response_data["payment_instructions"] = "Por favor realiza tu transferencia SPEI con el folio del pedido como concepto."
    
    return response_data
