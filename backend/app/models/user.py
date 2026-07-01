from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True) # Nickname Gamer
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True) # Changed to nullable since Google Auth users might not have a password
    google_id = Column(String, unique=True, index=True, nullable=True)
    mfa_secret = Column(String, nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    full_name = Column(String, nullable=True) # Mantenido por compatibilidad
    
    phone_number = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)
    rfc = Column(String, nullable=True)
    
    total_spent = Column(Float, default=0.0) # LTV
    xp = Column(Integer, default=0) # Puntos de experiencia (1 MXN = 1 XP)
    level = Column(Integer, default=1) # Nivel del usuario basado en su XP
    
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True) # Para el control de accesos RBAC
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    addresses = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")
    role = relationship("Role", back_populates="users")
    billing_profile = relationship("BillingProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    alias = Column(String, nullable=True) # Ej: "Casa", "Oficina"
    icon_name = Column(String, default="Home") # Icono de lucide-react
    street = Column(String, nullable=False)
    exterior_number = Column(String, nullable=False)
    interior_number = Column(String, nullable=True)
    neighborhood = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    references = Column(Text, nullable=True)
    
    is_default = Column(Boolean, default=False)

    user = relationship("User", back_populates="addresses")

class BillingProfile(Base):
    __tablename__ = "user_billing_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    rfc = Column(String, nullable=False)
    business_name = Column(String, nullable=False) # Razón Social
    tax_regime = Column(String, nullable=False) # Régimen Fiscal
    cfdi_use = Column(String, nullable=False) # Uso CFDI
    zip_code = Column(String, nullable=False) # Código Postal Fiscal
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="billing_profile")

import app.models.role
