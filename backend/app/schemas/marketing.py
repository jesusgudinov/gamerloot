from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

# ---- BANNERS ----
class BannerBase(BaseModel):
    title: str
    image_url: str
    target_url: Optional[str] = None
    position: str = "homepage_carousel"
    display_order: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    target_url: Optional[str] = None
    position: Optional[str] = None
    display_order: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class BannerResponse(BannerBase):
    id: int
    class Config:
        from_attributes = True

# ---- CAMPAÑAS ----
class CampaignBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class CampaignResponse(CampaignBase):
    id: int
    class Config:
        from_attributes = True

class CampaignDiscountApply(BaseModel):
    target_type: str # "category", "brand", "all", "product"
    target_id: Optional[int] = None
    target_ids: Optional[List[int]] = []
    discount_percentage: float

# ---- CUPONES ----
class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_purchase_amount: float = 0
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: int
    times_used: int
    class Config:
        from_attributes = True

# ---- OFERTAS RELÁMPAGO ----
class FlashSaleBase(BaseModel):
    product_id: int
    discount_price: float
    stock_limit: Optional[int] = None
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class FlashSaleCreate(FlashSaleBase):
    pass

class FlashSaleUpdate(BaseModel):
    product_id: Optional[int] = None
    discount_price: Optional[float] = None
    stock_limit: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class FlashSaleResponse(FlashSaleBase):
    id: int
    class Config:
        from_attributes = True

# ---- AFILIADOS ----
class AffiliateBase(BaseModel):
    name: str
    coupon_id: int
    commission_percentage: float = 5.0
    is_active: bool = True

class AffiliateCreate(AffiliateBase):
    pass

class AffiliateUpdate(BaseModel):
    name: Optional[str] = None
    coupon_id: Optional[int] = None
    commission_percentage: Optional[float] = None
    is_active: Optional[bool] = None

class AffiliateResponse(AffiliateBase):
    id: int
    total_sales_generated: float
    total_commission_earned: float
    class Config:
        from_attributes = True

# ---- DASHBOARD SUMMARY ----
class MarketingDashboardSummary(BaseModel):
    active_campaigns: int
    active_flash_sales: int
    total_coupons_used: int
    total_affiliate_commission: float
