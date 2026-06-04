from pydantic import BaseModel
from typing import Optional, List

# --- Valores de Atributos ---
class AttributeValueBase(BaseModel):
    value: str
    slug: str
    color_hex: Optional[str] = None

class AttributeValueCreate(AttributeValueBase):
    pass

class AttributeValueUpdate(BaseModel):
    value: Optional[str] = None
    slug: Optional[str] = None
    color_hex: Optional[str] = None

class AttributeValueResponse(AttributeValueBase):
    id: int
    attribute_id: int

    class Config:
        from_attributes = True

# --- Atributos ---
class AttributeBase(BaseModel):
    name: str
    slug: str
    type: str = "text"
    is_filterable: bool = True
    is_for_configurator: bool = False

class AttributeCreate(AttributeBase):
    pass

class AttributeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    type: Optional[str] = None
    is_filterable: Optional[bool] = None
    is_for_configurator: Optional[bool] = None

class AttributeResponse(AttributeBase):
    id: int

    class Config:
        from_attributes = True

class AttributeWithValuesResponse(AttributeResponse):
    values: List[AttributeValueResponse] = []

    class Config:
        from_attributes = True
