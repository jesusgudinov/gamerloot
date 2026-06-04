from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AddressSchema(BaseModel):
    country_code: str = Field("MX", description="ISO 3166-1 alpha-2")
    postal_code: str
    area_level1: str = Field(..., description="State/Province")
    area_level2: str = Field(..., description="City/Municipality")
    area_level3: str = Field(..., description="Neighborhood/Colonia")
    street1: str
    company: str = "Gamer Loot"
    name: str = "Gamer Loot"
    phone: str = "0000000000"
    email: str = "contacto@gamerloot.com"
    reference: Optional[str] = ""

class ParcelSchema(BaseModel):
    weight: float = Field(..., description="Weight in KG")
    length: int = Field(..., description="Length in CM")
    width: int = Field(..., description="Width in CM")
    height: int = Field(..., description="Height in CM")
    
class ShippingQuoteRequest(BaseModel):
    # En el futuro puede venir el cart_id, por ahora recibimos dest + items
    address_to: AddressSchema
    parcels: List[ParcelSchema]
    requested_carriers: Optional[List[str]] = None

class CarrierRate(BaseModel):
    provider: str
    service_level_name: str
    service_level_code: str
    days: int
    amount_local: float
    currency: str

class ShippingQuoteResponse(BaseModel):
    success: bool
    rates: List[CarrierRate]
    message: Optional[str] = None
