from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload
from typing import List, Dict, Any
from pydantic import BaseModel

from app.db.session import get_db
from app.models.role import Role, Permission, RolePermission
from app.api.deps import require_permissions

router = APIRouter()

class RoleCreateUpdate(BaseModel):
    name: str
    description: str
    permissions: List[int] # Lista de IDs de permisos

@router.get("/", response_model=List[Dict[str, Any]])
async def get_roles(db: AsyncSession = Depends(get_db), current_user = Depends(require_permissions(["manage_roles"]))):
    """Obtiene todos los roles con sus permisos asociados"""
    stmt = select(Role).options(
        joinedload(Role.role_permissions).joinedload(RolePermission.permission)
    )
    result = await db.execute(stmt)
    roles = result.unique().scalars().all()
    
    roles_out = []
    for role in roles:
        permissions = [{"id": rp.permission.id, "name": rp.permission.name} for rp in role.role_permissions]
        roles_out.append({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": permissions
        })
    return roles_out

@router.get("/permissions", response_model=List[Dict[str, Any]])
async def get_all_permissions(db: AsyncSession = Depends(get_db), current_user = Depends(require_permissions(["manage_roles"]))):
    """Obtiene el catálogo de permisos disponibles"""
    result = await db.execute(select(Permission))
    perms = result.scalars().all()
    return [{"id": p.id, "name": p.name, "description": p.description} for p in perms]

@router.post("/", response_model=Dict[str, Any])
async def create_role(
    role_in: RoleCreateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permissions(["manage_roles"]))
):
    # Validar nombre
    check = await db.execute(select(Role).where(Role.name == role_in.name))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre.")

    # Crear rol
    new_role = Role(name=role_in.name, description=role_in.description)
    db.add(new_role)
    await db.flush() # Para obtener ID
    
    # Asignar permisos
    for perm_id in role_in.permissions:
        rp = RolePermission(role_id=new_role.id, permission_id=perm_id)
        db.add(rp)
        
    await db.commit()
    return {"message": "Rol creado exitosamente.", "role_id": new_role.id}

@router.put("/{role_id}", response_model=Dict[str, Any])
async def update_role(
    role_id: int,
    role_in: RoleCreateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permissions(["manage_roles"]))
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")
        
    if role.name == "Dueño":
        raise HTTPException(status_code=403, detail="No se puede modificar el rol principal del Dueño.")
        
    role.name = role_in.name
    role.description = role_in.description
    
    # Eliminar permisos actuales
    await db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
    
    # Asignar nuevos
    for perm_id in role_in.permissions:
        rp = RolePermission(role_id=role.id, permission_id=perm_id)
        db.add(rp)
        
    await db.commit()
    return {"message": "Rol actualizado exitosamente."}

@router.delete("/{role_id}", response_model=Dict[str, Any])
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_permissions(["manage_roles"]))
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado.")
        
    if role.name == "Dueño":
        raise HTTPException(status_code=403, detail="No se puede eliminar el rol principal del Dueño.")
        
    # Validar que no tenga usuarios asignados
    from app.models.user import User
    users_check = await db.execute(select(User).where(User.role_id == role_id))
    if users_check.scalars().first():
        raise HTTPException(status_code=400, detail="No se puede eliminar el rol porque hay usuarios asignados a él.")
        
    await db.delete(role)
    await db.commit()
    return {"message": "Rol eliminado exitosamente."}
