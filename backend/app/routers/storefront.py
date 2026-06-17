from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from typing import List

from app.db.session import get_db
from app.models.marketing import Banner, Campaign, Coupon
from app.models.product import Product
from app.schemas.marketing import BannerResponse, CampaignResponse

router = APIRouter()

@router.get("/banners", response_model=List[BannerResponse])
async def get_active_banners(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Banner).where(Banner.is_active == True).order_by(Banner.display_order))
    return result.scalars().all()

@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_active_campaigns(db: AsyncSession = Depends(get_db)):
    # Podríamos verificar las fechas de startDate y endDate también
    result = await db.execute(select(Campaign).where(Campaign.is_active == True).order_by(Campaign.id.desc()))
    return result.scalars().all()

@router.post("/validate-coupon")
async def validate_coupon(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.code == code, Coupon.is_active == True))
    coupon = result.scalars().first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no válido o inactivo")
        
    if coupon.usage_limit and coupon.times_used >= coupon.usage_limit:
        raise HTTPException(status_code=400, detail="Este cupón ha alcanzado su límite de usos")
        
    return {
        "id": coupon.id,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "min_purchase_amount": coupon.min_purchase_amount
    }

from pydantic import BaseModel
class BulkEtaRequest(BaseModel):
    destination_zip: str
    product_ids: List[int]

@router.post("/bulk-eta")
async def get_bulk_etas(request: BulkEtaRequest, db: AsyncSession = Depends(get_db)):
    from app.models.product import Product
    from app.models.inventory import InventoryStock, Warehouse
    from app.services.skydropx import SkydropxService
    from datetime import datetime, timedelta
    from sqlalchemy.orm import selectinload
    
    query = select(Product).options(
        selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse)
    ).where(Product.id.in_(request.product_ids))
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    skydropx = SkydropxService()
    etas = {}
    
    for p in products:
        extra_days = 1 
        is_pc = False
        if p.category_id == 128 or (p.name and "PC Gamer" in p.name):
            is_pc = True
            
        if is_pc:
            extra_days += 2 
            
        best_days = 999
        best_eta_string = None
        
        for stock in p.inventory_stocks:
            if not stock.warehouse or not stock.warehouse.zip_code or stock.quantity <= 0:
                continue
                
            eta_data = await skydropx.get_transit_time_cached(stock.warehouse.zip_code, request.destination_zip, extra_days=extra_days)
            days = eta_data.get("days", 3)
            
            if days < best_days:
                best_days = days
                
                eta_date = datetime.now()
                added_days = 0
                while added_days < days:
                    eta_date += timedelta(days=1)
                    if eta_date.weekday() < 5:
                        added_days += 1
                        
                months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
                days_names = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
                
                day_str = days_names[eta_date.weekday()]
                month_str = months[eta_date.month - 1]
                
                best_eta_string = f"Llega el {day_str} {eta_date.day} de {month_str}"
                
        if best_eta_string:
            etas[p.id] = best_eta_string
        
    return {
        "success": True,
        "etas": etas
    }
