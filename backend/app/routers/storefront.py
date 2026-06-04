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
