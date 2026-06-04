from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/signup", response_model=UserResponse)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya está registrado."
        )
    
    # Create new user
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login")
async def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate token
    access_token = create_access_token(subject=user.id)
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=1800, # 30 min por defecto, puede ser configurable
        expires=1800,
        samesite="lax",
        secure=False, # True en producción
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/", samesite="lax")
    return {"message": "Sesión cerrada exitosamente"}

from app.api.deps import get_current_user
from typing import Dict, Any

@router.get("/me", response_model=Dict[str, Any])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Devuelve los datos del usuario logueado, incluyendo su rol y permisos"""
    permissions = []
    role_name = None
    
    if current_user.is_superuser:
        # Los superusuarios pueden hacer todo, si queremos ser explícitos podríamos devolver todos los permisos
        # o manejar el caso especial en el frontend
        pass
        
    if current_user.role:
        role_name = current_user.role.name
        permissions = [rp.permission.name for rp in current_user.role.role_permissions]
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_superuser": current_user.is_superuser,
        "role": role_name,
        "permissions": permissions
    }

@router.post("/setup-admin")
async def setup_admin(db: AsyncSession = Depends(get_db)):
    """Endpoint para crear al superusuario principal inicial. Debe usarse solo una vez."""
    from app.models.role import Role
    res_role = await db.execute(select(Role).where(Role.name == "Dueño"))
    owner_role = res_role.scalars().first()
    
    if not owner_role:
        owner_role = Role(name="Dueño", description="Control total")
        db.add(owner_role)
        await db.flush()
        
    res_user = await db.execute(select(User).where(User.email == "jesus@gamerloot.com.mx"))
    user = res_user.scalars().first()
    
    if not user:
        user = User(
            email="jesus@gamerloot.com.mx",
            full_name="Gamer Loot",
            hashed_password=get_password_hash("kP9#vX2$mL!wQ7*zB5&t"),
            is_superuser=True,
            is_active=True,
            role_id=owner_role.id
        )
        db.add(user)
        await db.commit()
        return {"message": "Administrador creado exitosamente"}
        
    return {"message": "El administrador ya existe"}
