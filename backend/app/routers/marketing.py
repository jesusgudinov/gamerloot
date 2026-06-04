from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.db.session import get_db
from app.models.marketing import Banner, Campaign, Coupon, FlashSale, Affiliate
from app.models.product import Product
from app.schemas.marketing import (
    BannerCreate, BannerUpdate, BannerResponse,
    CampaignCreate, CampaignUpdate, CampaignResponse, CampaignDiscountApply,
    CouponCreate, CouponUpdate, CouponResponse,
    FlashSaleCreate, FlashSaleUpdate, FlashSaleResponse,
    AffiliateCreate, AffiliateUpdate, AffiliateResponse,
    MarketingDashboardSummary
)

router = APIRouter()

# --- DASHBOARD ---
@router.get("/dashboard", response_model=MarketingDashboardSummary)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    active_campaigns = await db.scalar(select(func.count(Campaign.id)).where(Campaign.is_active == True))
    active_flash_sales = await db.scalar(select(func.count(FlashSale.id)).where(FlashSale.is_active == True))
    total_coupons = await db.scalar(select(func.sum(Coupon.times_used))) or 0
    total_commissions = await db.scalar(select(func.sum(Affiliate.total_commission_earned))) or 0.0

    return MarketingDashboardSummary(
        active_campaigns=active_campaigns,
        active_flash_sales=active_flash_sales,
        total_coupons_used=total_coupons,
        total_affiliate_commission=total_commissions
    )

# --- BANNERS ---
@router.get("/banners", response_model=List[BannerResponse])
async def get_banners(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Banner).order_by(Banner.display_order))
    return result.scalars().all()

@router.post("/banners", response_model=BannerResponse)
async def create_banner(banner_in: BannerCreate, db: AsyncSession = Depends(get_db)):
    banner = Banner(**banner_in.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner

@router.put("/banners/{id}", response_model=BannerResponse)
async def update_banner(id: int, banner_in: BannerUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Banner).where(Banner.id == id))
    banner = result.scalars().first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner no encontrado")
    
    update_data = banner_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(banner, k, v)
        
    await db.commit()
    await db.refresh(banner)
    return banner

@router.delete("/banners/{id}")
async def delete_banner(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Banner).where(Banner.id == id))
    banner = result.scalars().first()
    if banner:
        await db.delete(banner)
        await db.commit()
    return {"message": "Banner eliminado"}

# --- CAMPAÑAS ---
@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).order_by(Campaign.id.desc()))
    return result.scalars().all()

@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(campaign_in: CampaignCreate, db: AsyncSession = Depends(get_db)):
    check = await db.execute(select(Campaign).where(Campaign.slug == campaign_in.slug))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="El slug de la campaña ya existe")
        
    campaign = Campaign(**campaign_in.model_dump())
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign

@router.put("/campaigns/{id}", response_model=CampaignResponse)
async def update_campaign(id: int, campaign_in: CampaignUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
        
    update_data = campaign_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(campaign, k, v)
        
    await db.commit()
    await db.refresh(campaign)
    return campaign

@router.delete("/campaigns/{id}")
async def delete_campaign(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == id))
    campaign = result.scalars().first()
    if campaign:
        # Remover descuentos de todos los productos vinculados
        res_prod = await db.execute(select(Product).where(Product.active_campaign_id == id))
        products = res_prod.scalars().all()
        for p in products:
            p.active_campaign_id = None
            p.discount_price = None
            p.discount_start_date = None
            p.discount_end_date = None
            
        await db.delete(campaign)
        await db.commit()
    return {"message": "Campaña eliminada"}

@router.get("/campaigns/{id}", response_model=CampaignResponse)
async def get_campaign(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Campaign).where(Campaign.id == id))
    campaign = result.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    return campaign

@router.get("/campaigns/{id}/products")
async def get_campaign_products(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.active_campaign_id == id))
    products = result.scalars().all()
    return [{"id": p.id, "name": p.name, "base_price": p.base_price, "discount_price": p.discount_price} for p in products]

@router.post("/campaigns/{id}/apply-discounts")
async def apply_campaign_discounts(id: int, payload: CampaignDiscountApply, db: AsyncSession = Depends(get_db)):
    # Fetch campaign
    res_camp = await db.execute(select(Campaign).where(Campaign.id == id))
    campaign = res_camp.scalars().first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    # Base query
    stmt = select(Product).where(Product.is_active == True)
    
    if payload.target_type == "category" and payload.target_id:
        stmt = stmt.where(Product.category_id == payload.target_id)
    elif payload.target_type == "brand" and payload.target_id:
        stmt = stmt.where(Product.brand_id == payload.target_id)
    elif payload.target_type == "product":
        if payload.target_ids and len(payload.target_ids) > 0:
            stmt = stmt.where(Product.id.in_(payload.target_ids))
        elif payload.target_id:
            stmt = stmt.where(Product.id == payload.target_id)
        
    res_prod = await db.execute(stmt)
    products = res_prod.scalars().all()
    
    affected_count = 0
    for p in products:
        # Calculate new discount price
        discount_amount = p.base_price * (payload.discount_percentage / 100.0)
        new_price = p.base_price - discount_amount
        
        p.discount_price = new_price
        p.discount_start_date = campaign.start_date
        p.discount_end_date = campaign.end_date
        p.active_campaign_id = campaign.id
        affected_count += 1
        
    await db.commit()
    return {"message": f"Descuentos aplicados a {affected_count} productos"}

@router.delete("/campaigns/{id}/products/{product_id}")
async def remove_campaign_product(id: int, product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id, Product.active_campaign_id == id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado o no pertenece a esta campaña")
    
    product.active_campaign_id = None
    product.discount_price = None
    product.discount_start_date = None
    product.discount_end_date = None
    
    await db.commit()
    return {"message": "Producto removido de la campaña exitosamente"}

# --- CUPONES ---
@router.get("/coupons", response_model=List[CouponResponse])
async def get_coupons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).order_by(Coupon.id.desc()))
    return result.scalars().all()

@router.post("/coupons", response_model=CouponResponse)
async def create_coupon(coupon_in: CouponCreate, db: AsyncSession = Depends(get_db)):
    check = await db.execute(select(Coupon).where(Coupon.code == coupon_in.code))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="El código de cupón ya existe")
        
    coupon = Coupon(**coupon_in.model_dump())
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return coupon

@router.put("/coupons/{id}", response_model=CouponResponse)
async def update_coupon(id: int, coupon_in: CouponUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.id == id))
    coupon = result.scalars().first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
        
    update_data = coupon_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(coupon, k, v)
        
    await db.commit()
    await db.refresh(coupon)
    return coupon

@router.delete("/coupons/{id}")
async def delete_coupon(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.id == id))
    coupon = result.scalars().first()
    if coupon:
        await db.delete(coupon)
        await db.commit()
    return {"message": "Cupón eliminado"}

# --- FLASH SALES ---
@router.get("/flash-sales", response_model=List[FlashSaleResponse])
async def get_flash_sales(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FlashSale).order_by(FlashSale.id.desc()))
    return result.scalars().all()

@router.post("/flash-sales", response_model=FlashSaleResponse)
async def create_flash_sale(fs_in: FlashSaleCreate, db: AsyncSession = Depends(get_db)):
    fs = FlashSale(**fs_in.model_dump())
    db.add(fs)
    await db.commit()
    await db.refresh(fs)
    return fs

@router.put("/flash-sales/{id}", response_model=FlashSaleResponse)
async def update_flash_sale(id: int, fs_in: FlashSaleUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FlashSale).where(FlashSale.id == id))
    fs = result.scalars().first()
    if not fs:
        raise HTTPException(status_code=404, detail="Oferta relámpago no encontrada")
        
    update_data = fs_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(fs, k, v)
        
    await db.commit()
    await db.refresh(fs)
    return fs

@router.delete("/flash-sales/{id}")
async def delete_flash_sale(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FlashSale).where(FlashSale.id == id))
    fs = result.scalars().first()
    if fs:
        await db.delete(fs)
        await db.commit()
    return {"message": "Oferta relámpago eliminada"}

# --- AFILIADOS ---
@router.get("/affiliates", response_model=List[AffiliateResponse])
async def get_affiliates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Affiliate).order_by(Affiliate.id.desc()))
    return result.scalars().all()

@router.post("/affiliates", response_model=AffiliateResponse)
async def create_affiliate(affiliate_in: AffiliateCreate, db: AsyncSession = Depends(get_db)):
    affiliate = Affiliate(**affiliate_in.model_dump())
    db.add(affiliate)
    await db.commit()
    await db.refresh(affiliate)
    return affiliate

@router.put("/affiliates/{id}", response_model=AffiliateResponse)
async def update_affiliate(id: int, affiliate_in: AffiliateUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Affiliate).where(Affiliate.id == id))
    affiliate = result.scalars().first()
    if not affiliate:
        raise HTTPException(status_code=404, detail="Afiliado no encontrado")
        
    update_data = affiliate_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(affiliate, k, v)
        
    await db.commit()
    await db.refresh(affiliate)
    return affiliate

@router.delete("/affiliates/{id}")
async def delete_affiliate(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Affiliate).where(Affiliate.id == id))
    affiliate = result.scalars().first()
    if affiliate:
        await db.delete(affiliate)
        await db.commit()
    return {"message": "Afiliado eliminado"}
