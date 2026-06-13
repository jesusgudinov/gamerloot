from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid

from app.db.session import get_db
from app.api.deps import require_permissions, get_current_active_user
from app.models.support import Ticket, TicketMessage
from app.models.user import User
from app.schemas.support import TicketCreate, TicketResponse, TicketMessageCreate, TicketMessageResponse, TicketUpdate

router = APIRouter()

@router.get("/", response_model=List[TicketResponse], dependencies=[Depends(require_permissions(["manage_support"]))])
async def list_all_tickets(status: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Lista todos los tickets para administradores"""
    query = select(Ticket).options(selectinload(Ticket.messages))
    if status:
        query = query.where(Ticket.status == status)
    query = query.order_by(Ticket.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/me", response_model=List[TicketResponse])
async def get_my_tickets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Lista los tickets del usuario logueado"""
    query = select(Ticket).options(selectinload(Ticket.messages)).where(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Obtiene un ticket por ID asegurando permisos"""
    result = await db.execute(select(Ticket).options(selectinload(Ticket.messages)).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
        
    if ticket.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este ticket")
        
    return ticket

@router.post("/", response_model=TicketResponse)
async def create_ticket(req: TicketCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Crea un nuevo ticket de soporte"""
    folio = f"TKT-{str(uuid.uuid4())[:8].upper()}"
    
    new_ticket = Ticket(
        folio=folio,
        user_id=current_user.id,
        order_id=req.order_id,
        subject=req.subject,
        category=req.category,
        priority=req.priority,
        status="Abierto"
    )
    db.add(new_ticket)
    await db.flush() # Obtener el ID del ticket
    
    first_message = TicketMessage(
        ticket_id=new_ticket.id,
        user_id=current_user.id,
        message=req.message,
        is_from_admin=False
    )
    db.add(first_message)
    await db.commit()
    
    res = await db.execute(select(Ticket).options(selectinload(Ticket.messages)).where(Ticket.id == new_ticket.id))
    return res.scalars().first()

@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse)
async def add_message(ticket_id: int, req: TicketMessageCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """Agrega un mensaje a un ticket existente"""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
        
    is_admin = current_user.is_superuser or (current_user.role is not None)
    
    if ticket.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="No tienes permiso para responder en este ticket")
        
    new_message = TicketMessage(
        ticket_id=ticket_id,
        user_id=current_user.id,
        message=req.message,
        attachments=req.attachments,
        is_from_admin=is_admin
    )
    db.add(new_message)
    
    # Cambiar estado si el admin responde
    if is_admin and ticket.status == "Abierto":
        ticket.status = "En Progreso"
        
    await db.commit()
    await db.refresh(new_message)
    return new_message

@router.put("/{ticket_id}", response_model=TicketResponse, dependencies=[Depends(require_permissions(["manage_support"]))])
async def update_ticket(ticket_id: int, update: TicketUpdate, db: AsyncSession = Depends(get_db)):
    """Actualiza propiedades del ticket (Solo admins)"""
    result = await db.execute(select(Ticket).options(selectinload(Ticket.messages)).where(Ticket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
        
    if update.status:
        ticket.status = update.status
    if update.priority:
        ticket.priority = update.priority
        
    await db.commit()
    return ticket
