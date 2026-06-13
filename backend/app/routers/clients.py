from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, or_, desc, asc
from typing import List, Optional
import random

from app.db.session import get_db
from app.models.user import User, UserAddress
from app.schemas.client import ClientResponse, ClientCreate, ClientUpdate
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
async def get_clients(
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # Filtramos a los usuarios que NO son superusuarios y NO tienen un rol asignado
    query = select(User).options(selectinload(User.addresses)).where(
        (User.is_superuser == False) & (User.role_id.is_(None))
    )
    if q:
        search = f"%{q}%"
        query = query.where(
            or_(
                User.email.ilike(search),
                User.username.ilike(search),
                User.first_name.ilike(search),
                User.last_name.ilike(search),
                User.phone_number.ilike(search),
                User.rfc.ilike(search)
            )
        )
    
    query = query.order_by(desc(User.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    clients = result.scalars().all()
    return clients

@router.post("/", response_model=ClientResponse)
async def create_client(client_in: ClientCreate, db: AsyncSession = Depends(get_db)):
    # Check si el email ya existe
    result = await db.execute(select(User).where(User.email == client_in.email))
    user = result.scalars().first()
    if user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Logica de Blizzard Tag para el username
    final_username = None
    if client_in.username:
        base_username = client_in.username.split('#')[0] # Por si acaso enviaron con #
        while True:
            tag = random.randint(10000, 99999)
            test_username = f"{base_username}#{tag}"
            result_uname = await db.execute(select(User).where(User.username == test_username))
            if not result_uname.scalars().first():
                final_username = test_username
                break

    # Si full_name no se envió pero sí first y last, lo armamos
    full_name = client_in.full_name
    if not full_name and client_in.first_name:
        full_name = f"{client_in.first_name} {client_in.last_name or ''}".strip()

    db_user = User(
        email=client_in.email,
        hashed_password=get_password_hash(client_in.password),
        username=final_username,
        first_name=client_in.first_name,
        last_name=client_in.last_name,
        full_name=full_name,
        phone_number=client_in.phone_number,
        profile_picture_url=client_in.profile_picture_url,
        rfc=client_in.rfc,
        is_active=client_in.is_active
    )
    
    db.add(db_user)
    await db.commit()

    # Si enviaron dirección, la creamos
    if client_in.address:
        addr = client_in.address
        db_address = UserAddress(
            user_id=db_user.id,
            alias=addr.alias or "Principal",
            street=addr.street,
            exterior_number=addr.exterior_number,
            interior_number=addr.interior_number,
            neighborhood=addr.neighborhood,
            city=addr.city,
            state=addr.state,
            zip_code=addr.zip_code,
            references=addr.references,
            is_default=True
        )
        db.add(db_address)
        await db.commit()

    # Reload user with addresses relationship
    query = select(User).options(selectinload(User.addresses)).where(User.id == db_user.id)
    res = await db.execute(query)
    return res.scalars().first()

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    query = select(User).options(selectinload(User.addresses)).where(
        (User.id == client_id) & (User.is_superuser == False) & (User.role_id.is_(None))
    )
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return user

@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, client_in: ClientUpdate, db: AsyncSession = Depends(get_db)):
    query = select(User).options(selectinload(User.addresses)).where(
        (User.id == client_id) & (User.is_superuser == False) & (User.role_id.is_(None))
    )
    result = await db.execute(query)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    update_data = client_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    # Si actualizaron first_name o last_name, regeneramos full_name
    if "first_name" in update_data or "last_name" in update_data:
        user.full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

