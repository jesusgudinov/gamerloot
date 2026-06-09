from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

# Reutilizamos la base central de la BD
from app.models.user import Base

class Order(Base):
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    folio = Column(String, unique=True, index=True, nullable=False)
    
    # Relación con Usuario registrado obligatoria
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Datos de contacto y envío de la orden (capturados al momento de la venta)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    contact_method = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    address_references = Column(Text, nullable=True)
    zip_code = Column(String, nullable=True)
    
    # Estatus y Logística
    # Posibles estados: Pendiente, Pagado, En Ensamble, Enviado, Entregado, Cancelado
    status = Column(String, default="Pendiente", index=True) 
    is_assembled = Column(Boolean, default=False)
    payment_method = Column(String, nullable=True)
    carrier = Column(String, nullable=True)
    tracking_number = Column(String, nullable=True)
    shipping_label_url = Column(String, nullable=True)
    customer_notes = Column(Text, nullable=True)
    
    # Finanzas
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0) # Representa el 16% del IVA
    total = Column(Float, default=0.0)
    
    # Marketing
    applied_coupon_id = Column(Integer, ForeignKey("marketing_coupons.id"), nullable=True)
    
    # Fechas
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    valid_until = Column(DateTime(timezone=True), nullable=True) # Útil para cotizaciones
    
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Se guarda una "foto" de los datos del producto al momento de comprar
    sku = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class RMARequest(Base):
    __tablename__ = "sales_rmas"
    id = Column(Integer, primary_key=True, index=True)
    folio = Column(String, unique=True, index=True, nullable=False) # Ej. RMA-98765
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Pendiente, Aprobado, Rechazado, Recibido, Reembolsado, Reemplazado
    status = Column(String, default="Pendiente", index=True) 
    rma_type = Column(String, nullable=False) # "Devolución" o "Garantía"
    
    customer_reason = Column(Text, nullable=False)
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    order = relationship("Order")
    items = relationship("RMAItem", back_populates="rma", cascade="all, delete-orphan")

class RMAItem(Base):
    __tablename__ = "sales_rma_items"
    id = Column(Integer, primary_key=True, index=True)
    rma_id = Column(Integer, ForeignKey("sales_rmas.id"), nullable=False)
    order_item_id = Column(Integer, ForeignKey("sales_order_items.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    condition = Column(String, nullable=True) # Intacto, Abierto, Dañado, Defectuoso
    
    rma = relationship("RMARequest", back_populates="items")
    order_item = relationship("OrderItem")
