from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Any
import os
import shutil
from datetime import datetime

from app.db.session import get_db
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import User, BillingProfile
from app.models.sales import Order, Invoice
from app.schemas.billing import BillingProfileCreate, BillingProfileResponse, InvoiceRequestSchema, InvoiceResponse
from app.core.config import settings

router = APIRouter()

# --- Customer Billing Profile Endpoints ---

@router.get("/billing-profile", response_model=BillingProfileResponse)
async def get_billing_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BillingProfile).where(BillingProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de facturación no encontrado")
    return profile

@router.post("/billing-profile", response_model=BillingProfileResponse)
async def update_billing_profile(data: BillingProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BillingProfile).where(BillingProfile.user_id == current_user.id))
    profile = result.scalars().first()
    
    if profile:
        profile.rfc = data.rfc
        profile.business_name = data.business_name
        profile.tax_regime = data.tax_regime
        profile.cfdi_use = data.cfdi_use
        profile.zip_code = data.zip_code
    else:
        profile = BillingProfile(
            user_id=current_user.id,
            rfc=data.rfc,
            business_name=data.business_name,
            tax_regime=data.tax_regime,
            cfdi_use=data.cfdi_use,
            zip_code=data.zip_code
        )
        db.add(profile)
        
    await db.commit()
    await db.refresh(profile)
    return profile

@router.post("/billing-profile/constancia", response_model=BillingProfileResponse)
async def upload_constancia(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.storage import storage_service
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se admiten archivos PDF para la constancia")
        
    result = await db.execute(select(BillingProfile).where(BillingProfile.user_id == current_user.id))
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Configura tus datos fiscales básicos antes de subir la constancia")
        
    # Save file
    file_url = await storage_service.save_file(file, folder="constancias")
    
    profile.constancia_pdf_url = file_url
    await db.commit()
    await db.refresh(profile)
    
    return profile



# --- Customer Invoice Endpoints ---

@router.post("/request", response_model=InvoiceResponse)
async def request_invoice(data: InvoiceRequestSchema, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # 1. Validar que el pedido pertenece al usuario y existe
    result = await db.execute(select(Order).where(Order.id == data.order_id, Order.user_id == current_user.id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado o no pertenece a este usuario")
        
    # 2. Validar que no exista ya una factura
    result = await db.execute(select(Invoice).where(Invoice.order_id == order.id))
    existing_invoice = result.scalars().first()
    if existing_invoice:
        raise HTTPException(status_code=400, detail="Este pedido ya tiene una solicitud de factura")
        
    # 3. Validar límite de tiempo: Debe ser del mismo mes en curso
    now = datetime.now()
    if order.created_at.year != now.year or order.created_at.month != now.month:
        raise HTTPException(status_code=400, detail="Solo se pueden facturar compras realizadas dentro del mes en curso.")
        
    # 4. Obtener datos fiscales del usuario
    result = await db.execute(select(BillingProfile).where(BillingProfile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=400, detail="Debes configurar tus datos fiscales antes de solicitar una factura")
        
    # 5. Crear solicitud de factura (Snapshot de datos fiscales)
    new_invoice = Invoice(
        order_id=order.id,
        user_id=current_user.id,
        rfc=profile.rfc,
        business_name=profile.business_name,
        tax_regime=profile.tax_regime,
        cfdi_use=profile.cfdi_use,
        zip_code=profile.zip_code,
        status="Pendiente"
    )
    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)
    
    return new_invoice

@router.get("/my-requests", response_model=List[InvoiceResponse])
async def get_my_invoice_requests(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Invoice)
        .where(Invoice.user_id == current_user.id)
        .order_by(Invoice.created_at.desc())
    )
    invoices = result.scalars().all()
    return invoices


# --- Admin Invoice Endpoints ---

@router.get("/admin/list")
async def get_admin_invoices(admin: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    """Lista todas las facturas con datos del pedido para el Dashboard Administrativo."""
    result = await db.execute(
        select(Invoice, BillingProfile.constancia_pdf_url)
        .outerjoin(BillingProfile, Invoice.user_id == BillingProfile.user_id)
        .options(selectinload(Invoice.order))
        .order_by(Invoice.created_at.desc())
    )
    rows = result.all()
    
    # Custom response with order folio included
    response = []
    for inv, constancia_url in rows:
        response.append({
            "id": inv.id,
            "order_id": inv.order_id,
            "user_id": inv.user_id,
            "order_folio": inv.order.folio if inv.order else "N/A",
            "order_total": inv.order.total if inv.order else 0,
            "rfc": inv.rfc,
            "business_name": inv.business_name,
            "tax_regime": inv.tax_regime,
            "cfdi_use": inv.cfdi_use,
            "zip_code": inv.zip_code,
            "status": inv.status,
            "xml_url": inv.xml_url,
            "pdf_url": inv.pdf_url,
            "constancia_pdf_url": constancia_url,
            "created_at": inv.created_at,
            "updated_at": inv.updated_at
        })
    return response

@router.post("/admin/upload/{invoice_id}")
async def upload_invoice_files(
    invoice_id: int,
    xml_file: UploadFile = File(...),
    pdf_file: UploadFile = File(...),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Sube los archivos XML y PDF de una factura y actualiza su estado."""
    # 1. Validar que la factura existe
    result = await db.execute(select(Invoice).options(selectinload(Invoice.order)).where(Invoice.id == invoice_id))
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Solicitud de factura no encontrada")
        
    # Validar extensiones
    if not xml_file.filename.lower().endswith('.xml'):
        raise HTTPException(status_code=400, detail="El archivo XML debe tener extensión .xml")
    if not pdf_file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="El archivo PDF debe tener extensión .pdf")
        
    # 2. Crear estructura de carpetas: backend/media/invoices/YYYY/MM/DD/
    now = datetime.now()
    year_str = str(now.year)
    month_str = f"{now.month:02d}"
    day_str = f"{now.day:02d}"
    
    base_dir = os.path.join(os.getcwd(), "media", "invoices", year_str, month_str, day_str)
    os.makedirs(base_dir, exist_ok=True)
    
    # 3. Guardar archivos con formato LOOT-[Folio].xml|pdf
    order_folio = invoice.order.folio if invoice.order else f"ORDER-{invoice.order_id}"
    
    xml_filename = f"{order_folio}.xml"
    pdf_filename = f"{order_folio}.pdf"
    
    xml_path = os.path.join(base_dir, xml_filename)
    pdf_path = os.path.join(base_dir, pdf_filename)
    
    # Escribir archivos al disco
    with open(xml_path, "wb") as buffer:
        shutil.copyfileobj(xml_file.file, buffer)
        
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(pdf_file.file, buffer)
        
    # 4. Actualizar base de datos
    invoice.xml_url = f"/media/invoices/{year_str}/{month_str}/{day_str}/{xml_filename}"
    invoice.pdf_url = f"/media/invoices/{year_str}/{month_str}/{day_str}/{pdf_filename}"
    invoice.status = "Facturado"
    
    await db.commit()
    
    return {"message": "Archivos subidos correctamente", "status": invoice.status}
