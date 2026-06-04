from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from app.db.session import get_db
from app.models.interaction import Review, Question
from app.models.user import User
from app.models.product import Product
from app.schemas.interaction import (
    ReviewCreate, ReviewUpdateStatus, ReviewResponse,
    QuestionCreate, QuestionAnswer, QuestionReject, QuestionResponse
)
# auth dependencies are typically available
# for admin we might not have them fully strict right now so we'll just mock auth or use existing
# from app.core.security import get_current_user

router = APIRouter()

# Lista básica de palabras altisonantes para el filtro
SWEAR_WORDS = ["puto", "puta", "pendejo", "pendeja", "cabron", "cabrón", "mierda", "verga", "chinga", "chingar", "pinche", "pito", "culo", "putos"]

def contains_profanity(text: str) -> bool:
    if not text:
        return False
    text_lower = text.lower()
    for word in SWEAR_WORDS:
        if word in text_lower:
            return True
    return False

# --- REVIEWS ---

@router.post("/reviews/", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, db: AsyncSession = Depends(get_db)):
    # Use the first available user in the database to avoid foreign key errors
    user_query = await db.execute(select(User).limit(1))
    mock_user = user_query.scalars().first()
    user_id = mock_user.id if mock_user else 1
    
    # Filtro de groserías
    status = "REJECTED" if contains_profanity(review.comment) else "PENDING"
    
    db_review = Review(
        product_id=review.product_id,
        user_id=user_id,
        rating=review.rating,
        comment=review.comment,
        status=status
    )
    db.add(db_review)
    await db.commit()
    
    query = select(Review).options(selectinload(Review.user)).where(Review.id == db_review.id)
    result = await db.execute(query)
    return result.scalars().first()

@router.get("/reviews/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Review).options(selectinload(Review.user)).where(
        Review.product_id == product_id,
        Review.status == "APPROVED"
    ).order_by(desc(Review.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/reviews/admin", response_model=List[ReviewResponse])
async def get_all_reviews(status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Review).order_by(desc(Review.created_at))
    if status:
        query = query.where(Review.status == status)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/reviews/{review_id}/status")
async def update_review_status(review_id: int, status_update: ReviewUpdateStatus, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    review.status = status_update.status
    await db.commit()
    
    # Recalcular el rating del producto siempre que cambie el estado (ej: de APPROVED a REJECTED)
    prod_res = await db.execute(select(Review).where(Review.product_id == review.product_id, Review.status == "APPROVED"))
    approved_reviews = prod_res.scalars().all()
    count = len(approved_reviews)
    avg_rating = sum(r.rating for r in approved_reviews) / count if count > 0 else 0.0
    await db.execute(update(Product).where(Product.id == review.product_id).values(rating=avg_rating, reviews_count=count))
    await db.commit()
            
    return {"success": True, "status": review.status}


# --- QUESTIONS ---

@router.post("/questions/", response_model=QuestionResponse)
async def create_question(question: QuestionCreate, db: AsyncSession = Depends(get_db)):
    # Use the first available user to avoid foreign key errors
    user_query = await db.execute(select(User).limit(1))
    mock_user = user_query.scalars().first()
    user_id = mock_user.id if mock_user else 1
    
    status = "REJECTED" if contains_profanity(question.question_text) else "PENDING"
    
    db_question = Question(
        product_id=question.product_id,
        user_id=user_id,
        question_text=question.question_text,
        status=status
    )
    db.add(db_question)
    await db.commit()
    
    query = select(Question).options(selectinload(Question.user)).where(Question.id == db_question.id)
    result = await db.execute(query)
    return result.scalars().first()

@router.get("/questions/product/{product_id}", response_model=List[QuestionResponse])
async def get_product_questions(product_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Question).options(selectinload(Question.user)).where(
        Question.product_id == product_id,
        Question.status == "ANSWERED"
    ).order_by(desc(Question.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/questions/admin", response_model=List[QuestionResponse])
async def get_all_questions(status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Question).order_by(desc(Question.created_at))
    if status:
        query = query.where(Question.status == status)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/questions/{question_id}/answer")
async def answer_question(question_id: int, answer: QuestionAnswer, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.answer_text = answer.answer_text
    question.status = "ANSWERED"
    from datetime import timezone, datetime
    question.answered_at = datetime.now(timezone.utc)
    await db.commit()
    return {"success": True}

@router.patch("/questions/{question_id}/reject")
async def reject_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.status = "REJECTED"
    await db.commit()
    return {"success": True}
