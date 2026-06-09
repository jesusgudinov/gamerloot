from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from .inventory import InventoryStockPublicResponse, InventoryStockAdminResponse
from .brand import BrandResponse
from .attribute import AttributeValueResponse

class MarketingTagBase(BaseModel):
    name: str
    slug: str
    color_hex: Optional[str] = "#EF4444"
    is_active: bool = True

class MarketingTagResponse(MarketingTagBase):
    id: int

    class Config:
        from_attributes = True

class MarketingTagCreate(MarketingTagBase):
    pass

class MarketingTagUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    color_hex: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryBasicResponse(BaseModel):
    id: int
    name: str
    slug: str

    class Config:
        from_attributes = True

class CampaignBasicResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    sku: str = Field(..., max_length=50)
    upc: Optional[str] = None
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    brand_id: Optional[int] = None
    brand_relation: Optional[BrandResponse] = None
    
    base_price: float
    discount_price: Optional[float] = None
    discount_start_date: Optional[datetime] = None
    discount_end_date: Optional[datetime] = None
    active_campaign_id: Optional[int] = None
    
    # Media
    main_image_url: Optional[str] = None
    image_gallery: Optional[List[str]] = []
    
    # Ventas y SEO
    condition: str = "Nuevo"
    warranty_months: int = 12
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = []
    
    # Logística
    weight_kg: Optional[float] = None
    length_cm: Optional[float] = None
    width_cm: Optional[float] = None
    height_cm: Optional[float] = None
    reserved_quantity: int = 0
    
    technical_attributes: Optional[Dict[str, Any]] = None
    
    is_in_configurator: bool = False
    component_type: Optional[str] = None
    
    status: str = "DRAFT"
    is_featured: bool = False
    rating: float = 0.0
    reviews_count: int = 0
    category_id: Optional[int] = None
    category: Optional[CategoryBasicResponse] = None

class ProductCreate(ProductBase):
    attribute_value_ids: Optional[List[int]] = []
    marketing_tag_ids: Optional[List[int]] = []

class ProductUpdate(ProductCreate):
    sku: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    base_price: Optional[float] = None

# Esto es lo que se envía al Frontend Público (Oculta datos de proveedores)
class ProductPublicResponse(ProductBase):
    id: int
    inventory_stocks: List[InventoryStockPublicResponse] = []
    marketing_tags_relation: List[MarketingTagResponse] = []
    attribute_values: List[AttributeValueResponse] = []
    active_campaign: Optional[CampaignBasicResponse] = None

    class Config:
        from_attributes = True

# Esto es lo que recibe el Panel Administrativo (Muestra todo)
class ProductAdminResponse(ProductBase):
    id: int
    inventory_stocks: List[InventoryStockAdminResponse] = []
    marketing_tags_relation: List[MarketingTagResponse] = []
    attribute_values: List[AttributeValueResponse] = []
    active_campaign: Optional[CampaignBasicResponse] = None

    class Config:
        from_attributes = True

class PaginatedProductResponse(BaseModel):
    items: List[ProductPublicResponse]
    total: int
    page: int
    size: int
    pages: int

class QuickEditRequest(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    base_price: Optional[float] = None
    discount_price: Optional[float] = None

class BulkEditRequest(BaseModel):
    product_ids: List[int]
    action: str
    payload: Dict[str, Any]
