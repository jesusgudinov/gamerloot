from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, JSON, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.user import Base

# ---- BANNERS ----
class Banner(Base):
    __tablename__ = "marketing_banners"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    target_url = Column(String, nullable=True)
    position = Column(String, default="homepage_carousel") # Ej: homepage_carousel, topbar, sidebar
    display_order = Column(Integer, default=0)
    
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)


# ---- CAMPAÑAS Y OFERTAS RELÁMPAGO ----
class Campaign(Base):
    __tablename__ = "marketing_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    
    is_active = Column(Boolean, default=True)

class FlashSale(Base):
    __tablename__ = "marketing_flash_sales"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    discount_price = Column(Float, nullable=False)
    stock_limit = Column(Integer, nullable=True) # Si es null, no hay límite de piezas para la oferta
    
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)


# ---- CUPONES Y AFILIADOS ----
class Coupon(Base):
    __tablename__ = "marketing_coupons"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # Ej: GAMERLOOT10 o X4F9L1
    discount_type = Column(String, default="percentage") # "percentage", "fixed", "free_shipping"
    discount_value = Column(Float, nullable=False)
    
    min_purchase_amount = Column(Float, default=0)
    max_discount_amount = Column(Float, nullable=True)
    
    usage_limit = Column(Integer, nullable=True) # Cuántas veces se puede usar en total en la tienda
    times_used = Column(Integer, default=0)
    
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

class Affiliate(Base):
    __tablename__ = "marketing_affiliates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Nombre del Streamer/Youtuber
    coupon_id = Column(Integer, ForeignKey("marketing_coupons.id"), nullable=False)
    commission_percentage = Column(Float, default=5.0)
    
    # Métricas
    total_sales_generated = Column(Float, default=0.0)
    total_commission_earned = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)


# ---- BUNDLES Y RECUPERACIÓN DE CARRITO ----
class DynamicBundle(Base):
    __tablename__ = "marketing_dynamic_bundles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # Ej: "Arma tu setup Asus"
    trigger_product_id = Column(Integer, ForeignKey("products.id"), nullable=False) # Si compras ESTE...
    target_product_id = Column(Integer, ForeignKey("products.id"), nullable=False) # ...te ofrezco ESTE
    
    discount_percentage = Column(Float, nullable=False) # ...con este % de descuento
    is_active = Column(Boolean, default=True)

class AbandonedCartRule(Base):
    __tablename__ = "marketing_abandoned_cart_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    wait_time_hours = Column(Integer, default=24) # Tiempo de espera para enviar correo
    discount_percentage = Column(Float, default=10.0) # Cupón autogenerado que se le ofrecerá
    email_subject = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
