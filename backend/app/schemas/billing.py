from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BillingProfileBase(BaseModel):
    rfc: str
    business_name: str
    tax_regime: str
    cfdi_use: str
    zip_code: str
    constancia_pdf_url: Optional[str] = None

class BillingProfileCreate(BillingProfileBase):
    pass

class BillingProfileResponse(BillingProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvoiceRequestSchema(BaseModel):
    order_id: int

class InvoiceResponse(BaseModel):
    id: int
    order_id: int
    user_id: int
    rfc: str
    business_name: str
    tax_regime: str
    cfdi_use: str
    zip_code: str
    status: str
    xml_url: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
