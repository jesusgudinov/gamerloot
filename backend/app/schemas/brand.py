from pydantic import BaseModel, Field
from typing import Optional, List

class StoreConfig(BaseModel):
    banner_url: Optional[str] = None
    theme_color: Optional[str] = Field(None, pattern=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    featured_categories: Optional[List[int]] = None

class BrandBase(BaseModel):
    name: str
    slug: str = Field(..., pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    description: Optional[str] = None
    image_url: Optional[str] = None
    website_url: Optional[str] = None
    is_featured: bool = False
    has_storefront: bool = False
    store_config: Optional[StoreConfig] = None

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = Field(None, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    description: Optional[str] = None
    image_url: Optional[str] = None
    website_url: Optional[str] = None
    is_featured: Optional[bool] = None
    has_storefront: Optional[bool] = None
    store_config: Optional[StoreConfig] = None

class BrandResponse(BrandBase):
    id: int

    class Config:
        from_attributes = True
