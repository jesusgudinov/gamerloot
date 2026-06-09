from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.user import User
from app.models.role import Role
from app.api.deps import require_permissions, get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserRoleUpdate(BaseModel):
    role_id: int

@router.get("/team", response_model=List[Dict[str, Any]])
async def get_team_members(db: AsyncSession = Depends(get_db), current_user: User = Depends(require_permissions(["manage_users"]))):
    """Devuelve la lista de usuarios que tienen un rol asignado o son superusuarios (colaboradores)"""
    stmt = select(User).options(joinedload(User.role)).where(
        (User.role_id != None) | (User.is_superuser == True)
    )
    result = await db.execute(stmt)
    users = result.unique().scalars().all()
    
    users_out = []
    for user in users:
        role_name = "SuperAdmin" if user.is_superuser else (user.role.name if user.role else "Sin Rol")
        users_out.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name or user.username,
            "is_active": user.is_active,
            "role": role_name,
            "role_id": user.role_id,
            "created_at": user.created_at
        })
    return users_out

@router.put("/{user_id}/role", response_model=Dict[str, Any])
async def assign_role_to_user(
    user_id: int, 
    role_update: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_users"]))
):
    """Asigna o cambia el rol de un usuario existente"""
    # Evitar quitarle el rol de Dueño a sí mismo
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="No puedes modificar tu propio rol.")
        
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    result = await db.execute(select(Role).where(Role.id == role_update.role_id))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")
        
    # Seguridad: Solo un Superusuario puede otorgar el rol de "Dueño"
    if role.name == "Dueño" and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, 
            detail="Operación denegada. Solo el dueño actual puede otorgar privilegios de Dueño."
        )
        
    target_user.role_id = role.id
    
    # Si le damos un rol normal, asegurar que no sea superuser
    if role.name != "Dueño":
        target_user.is_superuser = False
    else:
        target_user.is_superuser = True
        
    await db.commit()
    
    return {"message": f"Rol {role.name} asignado correctamente a {target_user.email}."}

class TeamMemberCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role_id: int

@router.post("/team", response_model=Dict[str, Any])
async def create_team_member(
    member_in: TeamMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_users"]))
):
    """Crea un nuevo colaborador con contraseña manual y rol asignado."""
    # Verificar si el email ya existe
    check = await db.execute(select(User).where(User.email == member_in.email))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
        
    # Verificar rol
    result = await db.execute(select(Role).where(Role.id == member_in.role_id))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")
        
    # Seguridad: Solo un Superusuario puede crear una cuenta "Dueño"
    if role.name == "Dueño" and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, 
            detail="Operación denegada. Solo el dueño actual puede crear nuevas cuentas con privilegios de Dueño."
        )
        
    from app.core.security import get_password_hash
    hashed_pwd = get_password_hash(member_in.password)
    
    new_user = User(
        email=member_in.email,
        full_name=member_in.full_name,
        hashed_password=hashed_pwd,
        role_id=role.id,
        is_active=True,
        is_superuser=(role.name == "Dueño")
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {"message": "Colaborador creado exitosamente.", "user_id": new_user.id}

@router.delete("/{user_id}", response_model=Dict[str, Any])
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_users"]))
):
    """Elimina o desactiva a un usuario"""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta.")
        
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
    # En lugar de hard-delete, lo desactivamos para no romper relaciones (ej. logs)
    target_user.is_active = False
    target_user.role_id = None
    target_user.is_superuser = False
    
    await db.commit()
    
    return {"message": "Usuario desactivado y rol removido exitosamente."}
