from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List

from app.db.session import get_db
from app.models.user import User, UserAddress
from app.schemas.client import AddressCreate, AddressResponse, AddressUpdate
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/user/{user_id}", response_model=List[AddressResponse])
async def list_user_addresses(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Obtiene todas las direcciones de un usuario.
    """
    if current_user.id != user_id and not current_user.is_superuser and not current_user.role_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver las direcciones de este usuario")
        
    query = select(UserAddress).where(UserAddress.user_id == user_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/{user_id}", response_model=AddressResponse)
async def create_address(user_id: int, address_in: AddressCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Crea una nueva dirección para un usuario.
    """
    if current_user.id != user_id and not current_user.is_superuser and not current_user.role_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para crear direcciones para este usuario")
        
    user_query = select(User).where(User.id == user_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # Si la nueva dirección es predeterminada, quitamos el is_default de las demás
    if address_in.is_default:
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )
        
    new_address = UserAddress(
        user_id=user.id,
        **address_in.dict()
    )
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)
    return new_address

@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(address_id: int, address_in: AddressUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Actualiza una dirección existente.
    """
    query = select(UserAddress).where(UserAddress.id == address_id)
    result = await db.execute(query)
    address = result.scalar_one_or_none()
    
    if not address:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
    if current_user.id != address.user_id and not current_user.is_superuser and not current_user.role_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para modificar esta dirección")
        
    update_data = address_in.dict(exclude_unset=True)
    
    # Manejar el caso de que cambie a predeterminada
    if update_data.get("is_default") is True:
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == address.user_id)
            .where(UserAddress.id != address.id)
            .values(is_default=False)
        )
        
    for key, value in update_data.items():
        setattr(address, key, value)
        
    await db.commit()
    await db.refresh(address)
    return address

@router.delete("/{address_id}")
async def delete_address(address_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Elimina una dirección.
    """
    query = select(UserAddress).where(UserAddress.id == address_id)
    result = await db.execute(query)
    address = result.scalar_one_or_none()
    
    if not address:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
        
    if current_user.id != address.user_id and not current_user.is_superuser and not current_user.role_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar esta dirección")
        
    await db.delete(address)
    await db.commit()
    return {"success": True, "detail": "Dirección eliminada correctamente"}
