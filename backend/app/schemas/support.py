from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class TicketMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)
    attachments: Optional[List[Any]] = []

class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    message: str
    attachments: List[Any]
    is_from_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=5, max_length=100)
    category: str = Field(...)
    priority: str = Field(default="Normal")
    order_id: Optional[int] = None
    message: str = Field(..., min_length=10) # El primer mensaje del ticket

class TicketResponse(BaseModel):
    id: int
    folio: str
    user_id: int
    order_id: Optional[int]
    subject: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    messages: List[TicketMessageResponse] = []
    
    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
