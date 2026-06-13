from pydantic import BaseModel, Field, field_validator, computed_field
from typing import Optional, List
from datetime import datetime
import html

class UserBasicInfo(BaseModel):
    id: int
    username: Optional[str]
    first_name: Optional[str]
    level: int

    class Config:
        from_attributes = True

class ProductBasicInfo(BaseModel):
    id: int
    name: str
    slug: str
    main_image_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- Reviews ---
class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: str
    images: List[str] = []

    @field_validator('comment')
    def sanitize_comment(cls, v):
        return html.escape(v) if v else v

class ReviewUpdateStatus(BaseModel):
    status: str # APPROVED, REJECTED

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    images: Optional[List[str]] = None

    @field_validator('comment')
    def sanitize_comment(cls, v):
        return html.escape(v) if v else v

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str]
    images: List[str] = []
    votes: dict = {}
    status: str
    created_at: datetime
    user: Optional[UserBasicInfo] = None

    @computed_field
    @property
    def upvotes(self) -> int:
        return sum(1 for v in self.votes.values() if v == 'up') if self.votes else 0
        
    @computed_field
    @property
    def downvotes(self) -> int:
        return sum(1 for v in self.votes.values() if v == 'down') if self.votes else 0

    class Config:
        from_attributes = True

class ReviewMeResponse(ReviewResponse):
    product: Optional[ProductBasicInfo] = None

# --- Questions ---
class QuestionCreate(BaseModel):
    product_id: int
    question_text: str

    @field_validator('question_text')
    def sanitize_question(cls, v):
        return html.escape(v) if v else v

class QuestionAnswer(BaseModel):
    answer_text: str

    @field_validator('answer_text')
    def sanitize_answer(cls, v):
        return html.escape(v) if v else v

class QuestionReject(BaseModel):
    pass # Solo cambia el estado a REJECTED

class QuestionUpdate(BaseModel):
    question_text: str

    @field_validator('question_text')
    def sanitize_question(cls, v):
        return html.escape(v) if v else v

class QuestionResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    question_text: str
    answer_text: Optional[str]
    status: str
    created_at: datetime
    answered_at: Optional[datetime]
    user: Optional[UserBasicInfo] = None

    class Config:
        from_attributes = True

class QuestionMeResponse(QuestionResponse):
    product: Optional[ProductBasicInfo] = None
