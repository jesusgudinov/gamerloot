from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.user import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    internal_code = Column(String, index=True, nullable=True, unique=True) # Ej: "TSGDL", "PCHCDMX"
    name = Column(String, index=True, nullable=False) # Ej: "Bodega PCH - Monterrey"
    provider_name = Column(String, index=True, nullable=False) # Ej: "PCH", "CT", "Quantum", "Interno"
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    
    # Relación con el stock
    stocks = relationship("InventoryStock", back_populates="warehouse")

class InventoryStock(Base):
    __tablename__ = "inventory_stocks"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    
    # El costo exacto que nos da este proveedor en específico
    supplier_cost = Column(Float, nullable=False, default=0.0) 
    
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    product = relationship("Product", back_populates="inventory_stocks")
    warehouse = relationship("Warehouse", back_populates="stocks")

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency_from = Column(String, index=True, default="USD")
    currency_to = Column(String, index=True, default="MXN")
    rate = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
