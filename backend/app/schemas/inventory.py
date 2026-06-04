from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Clase Base General (Pública) - NO INCLUYE provider_name
class WarehouseBase(BaseModel):
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    internal_code: Optional[str] = None

# Esquema público: Esto es lo que ve el cliente en el frontend
class WarehousePublicResponse(WarehouseBase):
    id: int
    class Config:
        from_attributes = True

# Esquema de Admin: Incluye el proveedor
class WarehouseAdminResponse(WarehouseBase):
    id: int
    provider_name: str # PCH, CT, Quantum (Solo visible para Admin)
    class Config:
        from_attributes = True

class InventoryStockBase(BaseModel):
    quantity: int

# Stock Público: Solo cantidad y ubicación (sin proveedor)
class InventoryStockPublicResponse(InventoryStockBase):
    id: int
    warehouse: WarehousePublicResponse # <--- Oculta el proveedor mágicamente
    last_synced_at: datetime
    class Config:
        from_attributes = True

# Stock Admin: Cantidad, ubicación, costo exacto y PROVEEDOR
class InventoryStockAdminResponse(InventoryStockBase):
    id: int
    supplier_cost: float # <--- El admin puede ver cuánto le cuesta a él
    warehouse: WarehouseAdminResponse # <--- Muestra el proveedor al admin
    last_synced_at: datetime
    class Config:
        from_attributes = True
