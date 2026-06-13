from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class AddressBase(BaseModel):
    alias: Optional[str] = None
    icon_name: Optional[str] = "Home"
    street: str
    exterior_number: str
    interior_number: Optional[str] = None
    neighborhood: str
    city: str
    state: str
    zip_code: str
    references: Optional[str] = None
    is_default: Optional[bool] = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    alias: Optional[str] = None
    icon_name: Optional[str] = None
    street: Optional[str] = None
    exterior_number: Optional[str] = None
    interior_number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    references: Optional[str] = None
    is_default: Optional[bool] = None

class AddressResponse(AddressBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    rfc: Optional[str] = None
    is_active: Optional[bool] = True

class ClientCreate(ClientBase):
    password: str
    # Opcionalmente se puede enviar una dirección inicial al crear
    address: Optional[AddressCreate] = None

class ClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture_url: Optional[str] = None
    rfc: Optional[str] = None
    is_active: Optional[bool] = None

class ClientResponse(ClientBase):
    id: int
    total_spent: float
    created_at: datetime
    addresses: List[AddressResponse] = []

    class Config:
        from_attributes = True
