from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemBase(BaseModel):
    product_id: int
    sku: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    user_id: int
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    company_name: Optional[str] = None
    contact_method: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    address_references: Optional[str] = None
    zip_code: Optional[str] = None
    status: Optional[str] = "Pendiente"
    is_assembled: Optional[bool] = False
    payment_method: Optional[str] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    customer_notes: Optional[str] = None
    subtotal: float
    tax: float
    total: float
    valid_until: Optional[datetime] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    is_assembled: Optional[bool] = None
    payment_method: Optional[str] = None
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    customer_notes: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    company_name: Optional[str] = None
    contact_method: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    address_references: Optional[str] = None
    zip_code: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    folio: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class RMAItemCreate(BaseModel):
    order_item_id: int
    quantity: int
    condition: Optional[str] = None

class RMAItemResponse(BaseModel):
    id: int
    rma_id: int
    order_item_id: int
    quantity: int
    condition: Optional[str] = None
    
    class Config:
        from_attributes = True

class RMACreate(BaseModel):
    order_id: int
    user_id: int
    rma_type: str
    customer_reason: str
    items: List[RMAItemCreate]

class RMAUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    restock_to_inventory: Optional[bool] = False

class RMAResponse(BaseModel):
    id: int
    folio: str
    order_id: int
    user_id: int
    status: str
    rma_type: str
    customer_reason: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[RMAItemResponse]

    class Config:
        from_attributes = True
