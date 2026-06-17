from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, JSON, Table, DateTime
from sqlalchemy.orm import relationship
from app.models.user import Base

# Tabla de asociación muchos a muchos (Producto <-> Valor de Atributo)
product_attribute_association = Table(
    'product_attribute_associations',
    Base.metadata,
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True),
    Column('attribute_value_id', Integer, ForeignKey('product_attribute_values.id'), primary_key=True)
)

# Tabla de asociación muchos a muchos (Producto <-> Marketing Tag)
product_marketing_tag_association = Table(
    'product_marketing_tag_associations',
    Base.metadata,
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True),
    Column('marketing_tag_id', Integer, ForeignKey('marketing_tags.id'), primary_key=True)
)

class MarketingTag(Base):
    __tablename__ = "marketing_tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # Ej: "Hot Sale"
    slug = Column(String, unique=True, index=True, nullable=False) # Ej: "hot-sale"
    color_hex = Column(String, default="#EF4444")
    is_active = Column(Boolean, default=True)
    
    products = relationship("Product", secondary=product_marketing_tag_association, back_populates="marketing_tags_relation")

class ProductAttribute(Base):
    __tablename__ = "product_attributes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # Ej: "Socket"
    slug = Column(String, unique=True, index=True, nullable=False) # Ej: "pa_socket"
    
    # Nuevos campos
    type = Column(String, default="text") # "text", "select", "color"
    is_filterable = Column(Boolean, default=True)
    is_for_configurator = Column(Boolean, default=False)
    
    values = relationship("ProductAttributeValue", back_populates="attribute", cascade="all, delete-orphan")

class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_values"
    id = Column(Integer, primary_key=True, index=True)
    attribute_id = Column(Integer, ForeignKey('product_attributes.id'), nullable=False)
    value = Column(String, nullable=False) # Ej: "LGA 1700"
    slug = Column(String, unique=True, index=True, nullable=False)
    
    color_hex = Column(String, nullable=True) # Ej: "#FF0000"
    
    attribute = relationship("ProductAttribute", back_populates="values")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text)
    
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    icon = Column(String, nullable=True) # Ícono vectorial de Lucide
    image_url = Column(String, nullable=True) # Imagen para carrusel
    promo_image_url = Column(String, nullable=True) # Imagen promocional para Mega Menú
    promo_link = Column(String, nullable=True) # Enlace para la imagen promocional
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_for_configurator = Column(Boolean, default=False)
    show_in_menu = Column(Boolean, default=True)
    
    # Nuevo campo: Plantilla de atributos para la categoría
    attribute_schema = Column(JSON, nullable=True)
    
    # Palabras clave para auto-asignación por título (Motor Inferencia)
    keywords = Column(JSON, nullable=True)
    
    parent = relationship("Category", remote_side=[id], back_populates="subcategories")
    subcategories = relationship("Category", back_populates="parent")
    
    products = relationship("Product", back_populates="category")

class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    is_featured = Column(Boolean, default=False)
    
    # Storefront Micro-sites
    has_storefront = Column(Boolean, default=False)
    store_config = Column(JSON, nullable=True) # { "banner_url": "...", "theme_color": "...", "featured_categories": [...] }

    products = relationship("Product", back_populates="brand_relation")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    upc = Column(String, unique=True, index=True)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    short_description = Column(Text)
    description = Column(Text)
    brand = Column(String, index=True) # Old text field
    
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    brand_relation = relationship("Brand", back_populates="products")
    active_campaign_id = Column(Integer, ForeignKey("marketing_campaigns.id"), nullable=True)
    active_campaign = relationship("Campaign", foreign_keys=[active_campaign_id])
    
    # Precios
    base_price = Column(Float, nullable=False)
    discount_price = Column(Float)
    discount_start_date = Column(DateTime(timezone=True), nullable=True)
    discount_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Media y Contenido Visual
    main_image_url = Column(String) # Imagen principal
    image_gallery = Column(JSON) # Arreglo de URLs para la galería
    
    # Detalles de Venta y Garantía
    condition = Column(String, default="Nuevo") # Nuevo, Reacondicionado, Open Box
    warranty_months = Column(Integer, default=12) # Meses de garantía
    
    # SEO
    meta_title = Column(String)
    meta_description = Column(String)
    
    # Marketing (Para Etiquetas del Panel: Buen Fin, Hot Sale)
    tags = Column(JSON) # Arreglo de strings antiguo (por compatibilidad)
    marketing_tags_relation = relationship("MarketingTag", secondary=product_marketing_tag_association, back_populates="products")
    
    # Logística e Inventario
    weight_kg = Column(Float)
    length_cm = Column(Float)
    width_cm = Column(Float)
    height_cm = Column(Float)
    reserved_quantity = Column(Integer, default=0)
    
    # Atributos técnicos para filtrado
    technical_attributes = Column(JSON)
    
    # Motor del Cotizador de PCs
    is_in_configurator = Column(Boolean, default=False)
    component_type = Column(String) # Ej: "CPU", "GPU", "RAM", "Motherboard"
    
    # Estado y Destacado
    status = Column(String, default="DRAFT") # PUBLISHED, DRAFT, ARCHIVED
    is_featured = Column(Boolean, default=False)
    
    # Reseñas (Reviews) y Ventas
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    sales_count = Column(Integer, default=0)
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")
    
    # Relación con inventario multi-almacén
    inventory_stocks = relationship("InventoryStock", back_populates="product", cascade="all, delete-orphan")
    
    # Atributos Relacionales
    attribute_values = relationship("ProductAttributeValue", secondary=product_attribute_association)
