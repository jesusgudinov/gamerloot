from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.user import Base

class SupplierCategoryMap(Base):
    """
    Guarda las reglas del 'Diccionario de Términos'
    Mapea una ruta extraña de proveedor a una categoría interna limpia.
    """
    __tablename__ = "supplier_category_maps"

    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String, index=True, nullable=False) # "PCH", "SYSCOM", etc.
    provider_category_path = Column(String, index=True, nullable=False) # "ALMACENAMIENTO > USB"
    
    internal_category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    internal_category = relationship("Category")


class UnmappedCategoryLog(Base):
    """
    Registra las categorías de proveedores que el sistema no sabe cómo mapear.
    Detiene la importación hasta que el administrador resuelva esto en la UI.
    """
    __tablename__ = "unmapped_category_logs"

    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String, index=True, nullable=False)
    provider_category_path = Column(String, index=True, nullable=False)
    
    # Contexto para ayudar al humano a tomar la decisión
    sample_product_name = Column(String, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
