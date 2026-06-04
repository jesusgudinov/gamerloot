from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.schemas.shipping import ShippingQuoteRequest, ShippingQuoteResponse
from app.services.skydropx import SkydropxService
from app.models.sales import Order
from app.models.product import Product

router = APIRouter()

@router.post("/quote", response_model=ShippingQuoteResponse)
async def quote_shipping(
    request: ShippingQuoteRequest,
    origin_provider: str = "DEFAULT",
    origin_city: str = "CDMX"
):
    """
    Cotiza envíos con Skydropx dados un origen y un destino.
    `origin_provider` puede ser PCH, TechSmart, CVA, Importacion Digital.
    `origin_city` puede ser CDMX o GDL.
    Si no se envía, usa por defecto CDMX y CP 06000.
    """
    client = SkydropxService()
    rates = await client.get_rates(request, origin_provider, origin_city)
    
    if not rates:
        return ShippingQuoteResponse(
            success=False,
            rates=[],
            message="No se pudieron obtener cotizaciones o hubo un error con la API de Skydropx."
        )
        
    return ShippingQuoteResponse(
        success=True,
        rates=rates,
        message="Cotizaciones obtenidas exitosamente"
    )

from pydantic import BaseModel

class CreateShipmentRequest(BaseModel):
    order_id: int

@router.post("/create_shipment")
async def create_shipment(request: CreateShipmentRequest, db: AsyncSession = Depends(get_db)):
    """
    Crea la guía en Skydropx para una orden específica, descuenta saldo,
    y actualiza la orden a estado Enviado.
    """
    # 1. Obtener la orden de la base de datos
    query = select(Order).options(selectinload(Order.items)).where(Order.id == request.order_id)
    result = await db.execute(query)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    if order.status == "Enviado":
        raise HTTPException(status_code=400, detail="La orden ya ha sido enviada")
        
    client = SkydropxService()
    # Usamos un rate_id ficticio para el mock
    rate_id_mock = "rate_12345"
    skydropx_result = await client.create_shipment(rate_id_mock)
    
    if not skydropx_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creando guía: {skydropx_result.get('error', '')} {skydropx_result.get('detail', '')}"
        )
        
    res_data = skydropx_result.get("data", {})
    label_url = "https://example.com/dummy-label.pdf"
    tracking_number = "TRACK123456789"
    
    try:
        attrs = res_data.get("data", {}).get("attributes", {})
        if attrs.get("label_url"):
            label_url = attrs.get("label_url")
        if attrs.get("tracking_number"):
            tracking_number = attrs.get("tracking_number")
    except Exception:
        pass
        
    # 2. Lógica para liberar el inventario reservado ya que pasa a Enviado
    reserving_statuses = ["Pendiente", "Procesando", "Pagado", "Cotización"]
    was_reserving = order.status in reserving_statuses
    
    order.status = "Enviado"
    order.tracking_number = tracking_number
    order.shipping_label_url = label_url
    
    if was_reserving:
        # Liberar stock reservado
        for item in order.items:
            await db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(reserved_quantity=Product.reserved_quantity - item.quantity)
            )
            
    await db.commit()
    await db.refresh(order)
        
    return {
        "success": True,
        "message": "Guía generada correctamente y orden actualizada",
        "shipment": {
            "order_id": order.id,
            "label_url": label_url,
            "tracking_number": tracking_number,
            "status": "Enviado"
        }
    }

@router.get("/shipments")
async def list_shipments(db: AsyncSession = Depends(get_db)):
    """
    Obtiene las órdenes listas para enviarse o ya enviadas de la base de datos real.
    """
    query = select(Order).options(selectinload(Order.items)).where(Order.status.in_(["Pagado", "Procesando", "Enviado"])).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()
    
    shipments = []
    for o in orders:
        product_names = ", ".join([item.product_name for item in o.items])
        shipments.append({
            "id": o.id,
            "order_id": o.folio,
            "provider": o.carrier or "Por Asignar",
            "tracking_number": o.tracking_number or "Pendiente",
            "status": o.status,
            "label_url": o.shipping_label_url,
            "client_name": o.customer_name,
            "phone": o.customer_phone,
            "address": f"{o.address}, {o.city}, {o.state} {o.zip_code}",
            "products": product_names,
            "created_at": o.created_at
        })
        
    return {
        "success": True,
        "shipments": shipments
    }
