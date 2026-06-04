from pydantic import BaseModel
from typing import Optional

class BrandBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    website_url: Optional[str] = None
    is_featured: bool = False
    has_storefront: bool = False
    store_config: Optional[dict] = None

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    website_url: Optional[str] = None
    is_featured: Optional[bool] = None
    has_storefront: Optional[bool] = None
    store_config: Optional[dict] = None

class BrandResponse(BrandBase):
    id: int

    class Config:
        from_attributes = True
