from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.models.user import Base

class Ticket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    folio = Column(String, unique=True, index=True, nullable=False) # e.g. TKT-ABC12345
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=True) # Opcional si es sobre un pedido
    
    subject = Column(String, nullable=False)
    category = Column(String, nullable=False) # Técnico, Comercial, Facturación, Otro
    priority = Column(String, default="Normal") # Baja, Normal, Alta
    status = Column(String, default="Abierto", index=True) # Abierto, En Progreso, Resuelto, Cerrado
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User")
    order = relationship("Order")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")

class TicketMessage(Base):
    __tablename__ = "support_ticket_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Quién escribió el mensaje
    
    message = Column(Text, nullable=False)
    attachments = Column(JSONB, default=list, server_default='[]')
    
    is_from_admin = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    ticket = relationship("Ticket", back_populates="messages")
    user = relationship("User")
