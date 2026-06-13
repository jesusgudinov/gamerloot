from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import re
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    model_config = ConfigDict(extra='forbid')
    
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, max_length=50)
    phone_number: Optional[str] = Field(None, max_length=20)
    profile_picture_url: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=64, description="Contraseña de 8 a 64 caracteres")
    
    @field_validator('new_password')
    @classmethod
    def password_complexity(cls, v):
        if not re.match(r'^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$', v):
            raise ValueError('La contraseña debe incluir letras, números y al menos un símbolo.')
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=64, description="Contraseña de 8 a 64 caracteres")
    
    @field_validator('password')
    @classmethod
    def password_complexity(cls, v):
        if not re.match(r'^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$', v):
            raise ValueError('La contraseña debe incluir letras, números y al menos un símbolo.')
        return v

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True
