from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
from typing import List
from datetime import datetime
import os
import uuid

from app.db.session import get_db
from app.models.interaction import Review, Question
from app.models.user import User
from app.models.product import Product
from app.schemas.interaction import (
    ReviewCreate, ReviewUpdateStatus, ReviewUpdate, ReviewResponse, ReviewMeResponse,
    QuestionCreate, QuestionUpdate, QuestionAnswer, QuestionReject, QuestionResponse, QuestionMeResponse
)
from app.api.deps import get_current_active_user, require_permissions

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

@router.get("/reviews/product/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Review).options(selectinload(Review.user)).where(
        Review.product_id == product_id,
        Review.status == "APPROVED"
    ).order_by(desc(Review.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/reviews/", response_model=ReviewResponse)
async def create_review(
    review: ReviewCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_id = current_user.id
    
    # Filtro de groserías
    status = "REJECTED" if contains_profanity(review.comment) else "PENDING"
    
    db_review = Review(
        product_id=review.product_id,
        user_id=user_id,
        rating=review.rating,
        comment=review.comment,
        images=review.images,
        status=status
    )
    db.add(db_review)
    await db.commit()
    
    query = select(Review).options(selectinload(Review.user)).where(Review.id == db_review.id)
    result = await db.execute(query)
    return result.scalars().first()

@router.get("/reviews/me", response_model=List[ReviewMeResponse])
async def get_my_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Review).options(selectinload(Review.product), selectinload(Review.user)).where(Review.user_id == current_user.id).order_by(desc(Review.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/reviews/admin", response_model=List[ReviewResponse], dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def get_all_reviews(status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Review).options(selectinload(Review.user)).order_by(desc(Review.created_at))
    if status:
        query = query.where(Review.status == status)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/reviews/{review_id}", response_model=ReviewResponse)
async def update_my_review(
    review_id: int,
    review_update: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Review).where(Review.id == review_id, Review.user_id == current_user.id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    if review_update.rating is not None:
        review.rating = review_update.rating
    if review_update.comment is not None:
        review.comment = review_update.comment
        review.status = "REJECTED" if contains_profanity(review_update.comment) else "PENDING"
    if review_update.images is not None:
        review.images = review_update.images
        
    await db.commit()
    
    # Recalcular el rating ya que la reseña pasa a PENDING o REJECTED y deja de ser APPROVED
    prod_res = await db.execute(select(Review).where(Review.product_id == review.product_id, Review.status == "APPROVED"))
    approved_reviews = prod_res.scalars().all()
    count = len(approved_reviews)
    avg_rating = sum(r.rating for r in approved_reviews) / count if count > 0 else 0.0
    await db.execute(update(Product).where(Product.id == review.product_id).values(rating=avg_rating, reviews_count=count))
    await db.commit()
    
    await db.refresh(review)
    return review

@router.delete("/reviews/{review_id}")
async def delete_my_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Review).where(Review.id == review_id, Review.user_id == current_user.id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    was_approved = review.status == "APPROVED"
    product_id = review.product_id
    await db.delete(review)
    await db.commit()
    
    # Recalculate product rating if it was approved
    if was_approved:
        prod_res = await db.execute(select(Review).where(Review.product_id == product_id, Review.status == "APPROVED"))
        approved_reviews = prod_res.scalars().all()
        count = len(approved_reviews)
        avg_rating = sum(r.rating for r in approved_reviews) / count if count > 0 else 0.0
        await db.execute(update(Product).where(Product.id == product_id).values(rating=avg_rating, reviews_count=count))
        await db.commit()
        
    return {"success": True}

@router.patch("/reviews/{review_id}/status", dependencies=[Depends(require_permissions(["manage_catalog"]))])
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

@router.post("/reviews/upload-image")
async def upload_review_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    allowed_exts = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join("media", "reviews", filename)
    with open(path, "wb") as f:
        f.write(await file.read())
        
    return {"url": f"/media/reviews/{filename}"}

class VoteRequest(BaseModel):
    vote_type: str # "up" or "down"

@router.patch("/reviews/{review_id}/vote")
async def vote_review(
    review_id: int, 
    vote: VoteRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if vote.vote_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
        
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    user_id_str = str(current_user.id)
    votes_dict = dict(review.votes) if review.votes else {}
    
    if votes_dict.get(user_id_str) == vote.vote_type:
        del votes_dict[user_id_str]
    else:
        votes_dict[user_id_str] = vote.vote_type
        
    review.votes = votes_dict
    flag_modified(review, "votes")
    
    await db.commit()
    return {"success": True, "votes": review.votes}


# --- QUESTIONS ---

@router.get("/questions/product/{product_id}", response_model=List[QuestionResponse])
async def get_product_questions(product_id: int, db: AsyncSession = Depends(get_db)):
    query = select(Question).options(selectinload(Question.user)).where(
        Question.product_id == product_id,
        Question.status.in_(["PENDING", "ANSWERED"])
    ).order_by(desc(Question.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/questions/", response_model=QuestionResponse)
async def create_question(
    question: QuestionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user_id = current_user.id
    
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

@router.get("/questions/me", response_model=List[QuestionMeResponse])
async def get_my_questions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Question).options(selectinload(Question.product), selectinload(Question.user)).where(Question.user_id == current_user.id).order_by(desc(Question.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/questions/admin", response_model=List[QuestionResponse], dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def get_all_questions(status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Question).options(selectinload(Question.user)).order_by(desc(Question.created_at))
    if status:
        query = query.where(Question.status == status)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_my_question(
    question_id: int,
    question_update: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Question).where(Question.id == question_id, Question.user_id == current_user.id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.question_text = question_update.question_text
    question.status = "REJECTED" if contains_profanity(question_update.question_text) else "PENDING"
    question.answer_text = None
    question.answered_at = None
    
    await db.commit()
    await db.refresh(question)
    return question

@router.delete("/questions/{question_id}")
async def delete_my_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Question).where(Question.id == question_id, Question.user_id == current_user.id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    await db.delete(question)
    await db.commit()
    return {"success": True}

@router.patch("/questions/{question_id}/answer", dependencies=[Depends(require_permissions(["manage_catalog"]))])
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

@router.patch("/questions/{question_id}/reject", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def reject_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalars().first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    question.status = "REJECTED"
    await db.commit()
    return {"success": True}
