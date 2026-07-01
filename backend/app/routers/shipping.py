from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.schemas.shipping import ShippingQuoteRequest, ShippingQuoteResponse
from app.services.skydropx_service import SkydropxService
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
    Cotiza envíos con Mienvio dados un origen y un destino.
    `origin_provider` puede ser PCH, TechSmart, CVA, Importacion Digital.
    `origin_city` puede ser CDMX o GDL.
    Si no se envía, usa por defecto CDMX y CP 06000.
    """
    client = SkydropxService()
    parcel = {"length": 10, "width": 10, "height": 10, "weight": 1}
    origin_zip = "06000" if origin_city == "CDMX" else "45403"
    rates = await client.get_rates(origin_zip, "44100", parcel)
    
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

class ShippingEstimateRequest(BaseModel):
    product_id: int
    destination_zip: str

@router.get("/estimate")
async def estimate_shipping(
    product_id: int,
    destination_zip: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Estima el tiempo de entrega de un producto simulando la logística 
    basado en el CP origen de la bodega con stock y el CP destino.
    """
    from datetime import datetime, timedelta
    from app.models.inventory import InventoryStock, Warehouse
    import locale
    
    # 1. Obtener bodega origen con stock
    query = (
        select(Warehouse)
        .join(InventoryStock, InventoryStock.warehouse_id == Warehouse.id)
        .where(InventoryStock.product_id == product_id)
        .where(InventoryStock.quantity > 0)
        .limit(1)
    )
    result = await db.execute(query)
    warehouse = result.scalar_one_or_none()
    
    if not warehouse:
        return {
            "success": False,
            "message": "Producto agotado, no se puede calcular el envío."
        }
        
    origin_zip = warehouse.zip_code or "06000" # Default CDMX si no hay
    
    # Lógica Simulada de Tiempos
    origin_prefix = origin_zip[:2]
    dest_prefix = destination_zip[:2]
    
    # Misma región/estado: 1 a 2 días
    if origin_prefix == dest_prefix:
        min_days = 1
        max_days = 2
    # CDMX a GDL/MTY o viceversa (rutas principales): 2 a 3 días
    elif origin_prefix in ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"] and dest_prefix in ["64", "44", "45", "66"]:
        min_days = 2
        max_days = 3
    # Zonas extendidas o lejanas (ej. Baja California, Yucatán): 3 a 5 días
    elif dest_prefix in ["21", "22", "23", "97", "98", "99", "77"]:
        min_days = 3
        max_days = 5
    # Resto de la república: 2 a 4 días
    else:
        min_days = 2
        max_days = 4
        
    # Calcular fechas
    now = datetime.now()
    # Evitar fines de semana en la cuenta básica
    def add_business_days(start_date, days):
        current_date = start_date
        added = 0
        while added < days:
            current_date += timedelta(days=1)
            if current_date.weekday() < 5: # 0-4 son Lunes-Viernes
                added += 1
        return current_date
        
    min_date = add_business_days(now, min_days)
    max_date = add_business_days(now, max_days)
    
    # Formateo amigable
    meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    
    min_str = f"{dias[min_date.weekday()]} {min_date.day} de {meses[min_date.month - 1]}"
    max_str = f"{dias[max_date.weekday()]} {max_date.day} de {meses[max_date.month - 1]}"
    
    # Si son el mismo día
    if min_date.date() == max_date.date():
        estimated_date_str = min_str
    else:
        estimated_date_str = f"{min_str} al {max_str}"

    return {
        "success": True,
        "min_days": min_days,
        "max_days": max_days,
        "estimated_date": estimated_date_str,
        "origin_warehouse": warehouse.name
    }


class CreateShipmentRequest(BaseModel):
    order_id: int

@router.post("/create_shipment")
async def create_shipment(request: CreateShipmentRequest, db: AsyncSession = Depends(get_db)):
    """
    Crea la guía en Mienvio para una orden específica, descuenta saldo,
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
    # Mocking address and parcel for direct shipment creation if needed, 
    # but normally fulfillment handles this. We keep the mock for this test endpoint.
    rate_id_mock = "191158"
    skydropx_result = await client.create_shipment(str(order.id), {}, {}, [{"weight": 1, "length": 10, "width": 10, "height": 10}], rate_id_mock)
    
    if not skydropx_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creando guía: {skydropx_result.get('detail', '')}"
        )
        
    res_data = skydropx_result.get("data", {})
    label_url = "https://example.com/dummy-label.pdf"
    tracking_number = "TRACK123456789"
    
    try:
        if res_data.get("attributes"):
            attrs = res_data.get("attributes", {})
            if attrs.get("label_url"):
                label_url = attrs.get("label_url")
            if attrs.get("tracking_number"):
                tracking_number = attrs.get("tracking_number")
        else:
            # Skydropx V2 structure might vary, sometimes it returns data[0] or data directly
            if res_data.get("label_url"):
                label_url = res_data.get("label_url")
            if res_data.get("tracking_number"):
                tracking_number = res_data.get("tracking_number")
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
