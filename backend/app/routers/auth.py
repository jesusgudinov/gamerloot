from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings

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
        
    if user_in.email.lower().endswith("@gamerloot.com.mx"):
        raise HTTPException(
            status_code=400,
            detail="Los correos corporativos (@gamerloot.com.mx) no pueden usarse para crear cuentas de cliente. Contacta a un administrador para obtener acceso."
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
async def login(request: Request, response: Response, admin: bool = False, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    is_admin_login = admin
    
    # Si es login de cliente (NO admin), y el usuario es admin o de corporativo, rechazar
    if not is_admin_login:
        if user.is_superuser or (user.role_id is not None) or form_data.username.lower().endswith("@gamerloot.com.mx"):
            raise HTTPException(
                status_code=403,
                detail="Esta cuenta es administrativa. Por favor, inicia sesión desde el Panel de Administración."
            )
            
    # Si es login de admin, y el usuario es cliente, rechazar
    if is_admin_login:
        if not user.is_superuser and user.role_id is None:
            raise HTTPException(
                status_code=403,
                detail="Esta cuenta es de cliente. Por favor, inicia sesión desde la tienda."
            )
        
    from datetime import timedelta
    
    # Check MFA
    if user.mfa_enabled:
        temp_token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=10))
        return {"mfa_required": True, "temp_token": temp_token, "context": "admin" if is_admin_login else "client"}
        
    # Generate token
    access_token = create_access_token(subject=user.id)
    
    # Set HttpOnly Cookie based on login type
    cookie_name = "admin_access_token" if is_admin_login else "client_access_token"
    
    response.set_cookie(
        key=cookie_name,
        value=access_token,
        httponly=True,
        max_age=28800, # 8 horas a petición del dueño
        expires=28800,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production", # Usar True solo en prod
    )
    
    return {"access_token": access_token, "token_type": "bearer", "context": "admin" if is_admin_login else "client"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="admin_access_token", path="/", samesite="lax")
    response.delete_cookie(key="client_access_token", path="/", samesite="lax")
    response.delete_cookie(key="access_token", path="/", samesite="lax") # Legacy
    return {"message": "Sesión cerrada exitosamente"}

from app.api.deps import get_current_user
from typing import Dict, Any

@router.get("/me", response_model=Dict[str, Any])
async def get_my_profile(request: Request, context: str = "client", db: AsyncSession = Depends(get_db)):
    """Devuelve los datos del usuario logueado, leyendo la cookie correcta según el contexto"""
    cookie_name = "admin_access_token" if context == "admin" else "client_access_token"
    token = None
    
    # Check Authorization header first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        
    # Fallback to cookie
    if not token:
        token = request.cookies.get(cookie_name)
        
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
        
    try:
        from jose import jwt
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)
            
        from sqlalchemy.orm import joinedload
        from app.models.role import Role, RolePermission
        stmt = select(User).options(
            joinedload(User.role).joinedload(Role.role_permissions).joinedload(RolePermission.permission),
            joinedload(User.addresses)
        ).where(User.id == int(user_id))
        
        result = await db.execute(stmt)
        current_user = result.unique().scalars().first()
        
        if not current_user or not current_user.is_active:
            raise HTTPException(status_code=401)
            
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
    permissions = []
    role_name = None
    
    if current_user.is_superuser:
        # Los superusuarios pueden hacer todo, si queremos ser explícitos podríamos devolver todos los permisos
        # o manejar el caso especial en el frontend
        pass
        
    if current_user.role:
        role_name = current_user.role.name
        permissions = [rp.permission.name for rp in current_user.role.role_permissions]
        
    default_address = next((a for a in current_user.addresses if a.is_default), None) if current_user.addresses else None
    default_zip_code = default_address.zip_code if default_address else None

    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number,
        "profile_picture_url": current_user.profile_picture_url,
        "level": current_user.level,
        "xp": current_user.xp,
        "is_superuser": current_user.is_superuser,
        "mfa_enabled": current_user.mfa_enabled,
        "role": role_name,
        "permissions": permissions,
        "default_zip_code": default_zip_code
    }

from app.schemas.user import UserProfileUpdate, UserPasswordUpdate

@router.put("/me", response_model=Dict[str, Any])
async def update_my_profile(
    profile_data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza los datos del usuario logueado"""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.username is not None:
        current_user.username = profile_data.username
    if profile_data.phone_number is not None:
        current_user.phone_number = profile_data.phone_number
    if profile_data.profile_picture_url is not None:
        current_user.profile_picture_url = profile_data.profile_picture_url
        
    await db.commit()
    await db.refresh(current_user)
    
    return await get_my_profile(current_user=current_user)

@router.put("/me/password", response_model=Dict[str, Any])
async def update_my_password(
    password_data: UserPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza la contraseña del usuario logueado"""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual es incorrecta."
        )
        
    current_user.hashed_password = get_password_hash(password_data.new_password)
    
    await db.commit()
    return {"message": "Contraseña actualizada exitosamente."}

import pyotp
import qrcode
import qrcode.image.svg
import io
from app.schemas.token import MFASetupResponse, MFAEnable, MFAVerify, GoogleLogin
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@router.get("/mfa/setup", response_model=MFASetupResponse)
async def mfa_setup(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA ya está activado")
        
    secret = pyotp.random_base32()
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="Gamer Loot")
    
    current_user.mfa_secret = secret
    await db.commit()
    return {"secret": secret, "uri": uri}

@router.post("/mfa/enable")
async def mfa_enable(data: MFAEnable, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA ya está activado")
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="No se ha configurado el secreto MFA")
        
    totp = pyotp.TOTP(current_user.mfa_secret)
    if totp.verify(data.code):
        current_user.mfa_enabled = True
        await db.commit()
        return {"message": "MFA activado con éxito"}
    else:
        raise HTTPException(status_code=400, detail="Código inválido")

@router.post("/mfa/verify")
async def mfa_verify(data: MFAVerify, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        from jose import jwt
        payload = jwt.decode(data.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token temporal inválido o expirado")
        
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if not user or not user.mfa_enabled:
        raise HTTPException(status_code=400, detail="Usuario no válido para MFA")
        
    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Código inválido")
        
    # Es válido, procedemos al login
    access_token = create_access_token(subject=user.id)
    cookie_name = "admin_access_token" if data.context == "admin" else "client_access_token"
    
    response.set_cookie(
        key=cookie_name,
        value=access_token,
        httponly=True,
        max_age=28800,
        expires=28800,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )
    return {"access_token": access_token, "token_type": "bearer", "context": data.context}

@router.post("/google")
async def google_login(data: GoogleLogin, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        # Aquí el CLIENT_ID idealmente vendría de variables de entorno, pero usamos el que me pasaste directo:
        CLIENT_ID = "649272582040-ht9unbfa1u6gkgtb7v199d41c2o2lc5v.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(data.credential, google_requests.Request(), CLIENT_ID)
        
        email = idinfo['email']
        google_id = idinfo['sub']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        # Buscar usuario por google_id o email
        result = await db.execute(select(User).where((User.google_id == google_id) | (User.email == email)))
        user = result.scalars().first()
        
        if not user:
            # Crear usuario nuevo
            user = User(
                email=email,
                google_id=google_id,
                full_name=name,
                profile_picture_url=picture
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Actualizar info si faltaba
            if not user.google_id:
                user.google_id = google_id
                await db.commit()
                
        # Si tiene MFA, retornamos requerimiento MFA
        if user.mfa_enabled:
            from datetime import timedelta
            temp_token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=10))
            return {"mfa_required": True, "temp_token": temp_token, "context": "client"}
            
        # Loguear usuario
        access_token = create_access_token(subject=user.id)
        response.set_cookie(
            key="client_access_token",
            value=access_token,
            httponly=True,
            max_age=28800,
            expires=28800,
            samesite="lax",
            secure=settings.ENVIRONMENT == "production",
        )
        return {"access_token": access_token, "token_type": "bearer", "context": "client"}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Token de Google inválido: {e}")
