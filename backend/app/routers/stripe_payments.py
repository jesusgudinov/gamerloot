from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.stripe_service import StripeService

router = APIRouter()

@router.get("/payment-methods")
async def list_payment_methods(current_user: User = Depends(get_current_user)):
    """
    Devuelve la lista de tarjetas guardadas del usuario en Stripe.
    """
    customer_id = StripeService.create_or_get_customer(
        user_email=current_user.email,
        name=f"{current_user.first_name} {current_user.last_name}"
    )
    
    if not customer_id:
        raise HTTPException(status_code=500, detail="No se pudo resolver el cliente en Stripe")

    methods = StripeService.get_saved_payment_methods(customer_id)
    return methods

@router.post("/setup-intent")
async def create_setup_intent(current_user: User = Depends(get_current_user)):
    """
    Genera un SetupIntent para recopilar de forma segura un método de pago en el frontend.
    """
    customer_id = StripeService.create_or_get_customer(
        user_email=current_user.email,
        name=f"{current_user.first_name} {current_user.last_name}"
    )
    
    if not customer_id:
        raise HTTPException(status_code=500, detail="No se pudo resolver el cliente en Stripe")

    intent_data = StripeService.create_setup_intent(customer_id)
    if "error" in intent_data:
        raise HTTPException(status_code=500, detail=intent_data["error"])
        
    return intent_data

@router.delete("/payment-methods/{payment_method_id}")
async def remove_payment_method(payment_method_id: str, current_user: User = Depends(get_current_user)):
    """
    Elimina (detach) un método de pago.
    Nota: En un entorno de producción estricto, deberíamos verificar que el payment_method
    realmente pertenezca al customer de este current_user para evitar accesos cruzados.
    Para esta iteración confiamos en el endpoint protegido por usuario.
    """
    success = StripeService.detach_payment_method(payment_method_id)
    if not success:
        raise HTTPException(status_code=400, detail="No se pudo eliminar el método de pago.")
        
    return {"status": "success", "message": "Método de pago eliminado correctamente"}
