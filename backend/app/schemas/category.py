from pydantic import BaseModel
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    promo_image_url: Optional[str] = None
    promo_link: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    is_for_configurator: bool = False
    show_in_menu: bool = True
    attribute_schema: Optional[list] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    promo_image_url: Optional[str] = None
    promo_link: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_for_configurator: Optional[bool] = None
    show_in_menu: Optional[bool] = None

class CategoryResponse(CategoryBase):
    id: int
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True
