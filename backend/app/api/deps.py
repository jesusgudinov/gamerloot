from typing import List, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role, Permission, RolePermission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

async def get_token_from_request(request: Request, token: str = Depends(oauth2_scheme)) -> str:
    app_context = request.headers.get("X-App-Context")
    
    if app_context == "admin":
        cookie_token = request.cookies.get("admin_access_token")
    elif app_context == "client":
        cookie_token = request.cookies.get("client_access_token")
    else:
        # Fallback
        cookie_token = request.cookies.get("admin_access_token") or request.cookies.get("client_access_token") or request.cookies.get("access_token")
        
    if token:
        return token
    if cookie_token:
        return cookie_token
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se proporcionó token de autenticación",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_user(
    token: str = Depends(get_token_from_request),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Usamos joinedload para traer el rol y sus permisos de una vez
    stmt = select(User).options(
        joinedload(User.role).joinedload(Role.role_permissions).joinedload(RolePermission.permission)
    ).where(User.id == int(user_id))
    
    result = await db.execute(stmt)
    user = result.unique().scalars().first()
    
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="El usuario inactivo")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes suficientes privilegios (Admin)")
    return current_user

def require_permissions(required_permissions: List[str]):
    """
    Dependencia de FastAPI para verificar si el usuario logueado tiene los permisos requeridos.
    """
    async def permission_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.is_superuser:
            return current_user
            
        if not current_user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes un rol asignado."
            )
            
        user_permissions = [rp.permission.name for rp in current_user.role.role_permissions]
        
        # Verificar si tiene todos los permisos requeridos (o al menos uno, según la regla de negocio)
        # Aquí verificaremos que tenga TODOS los permisos solicitados en esa ruta particular.
        for req_perm in required_permissions:
            if req_perm not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permiso denegado. Se requiere: {req_perm}"
                )
        return current_user
        
    return permission_checker
