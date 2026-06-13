from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.models.user import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False) # 1 a 5
    comment = Column(Text, nullable=True)
    
    images = Column(JSONB, default=list, nullable=False, server_default='[]')
    votes = Column(JSONB, default=dict, nullable=False, server_default='{}')
    
    # Estados: PENDING, APPROVED, REJECTED
    status = Column(String, default="PENDING")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    product = relationship("Product", backref=__import__("sqlalchemy.orm").orm.backref("reviews", cascade="all, delete-orphan"))
    user = relationship("User", backref="reviews")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    
    # Estados: PENDING, ANSWERED, REJECTED
    status = Column(String, default="PENDING")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    answered_at = Column(DateTime(timezone=True), nullable=True)

    product = relationship("Product", backref=__import__("sqlalchemy.orm").orm.backref("questions", cascade="all, delete-orphan"))
    user = relationship("User", backref="questions")
