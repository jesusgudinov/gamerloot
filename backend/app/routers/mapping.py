from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional

from app.db.session import get_db
from app.models.mapping import SupplierCategoryMap, UnmappedCategoryLog
from app.models.product import Category

router = APIRouter()

class UnmappedCategoryResponse(BaseModel):
    id: int
    provider_name: str
    provider_category_path: str
    sample_product_name: Optional[str]
    
    class Config:
        from_attributes = True

class MapCategoryRequest(BaseModel):
    unmapped_id: int
    internal_category_id: int

class CategoryResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class SupplierMapResponse(BaseModel):
    id: int
    provider_name: str
    provider_category_path: str
    internal_category: CategoryResponse
    
    class Config:
        from_attributes = True

@router.get("/unmapped", response_model=List[UnmappedCategoryResponse])
async def get_unmapped_categories(db: AsyncSession = Depends(get_db)):
    """
    Obtiene la lista de todas las categorías de proveedores que están pendientes de mapeo.
    """
    result = await db.execute(select(UnmappedCategoryLog).order_by(UnmappedCategoryLog.created_at.desc()))
    return result.scalars().all()

@router.post("/map")
async def map_category(req: MapCategoryRequest, db: AsyncSession = Depends(get_db)):
    """
    Asigna una categoría interna a una ruta de proveedor, guardándola en el Diccionario.
    """
    # 1. Buscar el log
    result = await db.execute(select(UnmappedCategoryLog).where(UnmappedCategoryLog.id == req.unmapped_id))
    unmapped = result.scalars().first()
    
    if not unmapped:
        raise HTTPException(status_code=404, detail="Categoría no mapeada no encontrada.")
        
    # 2. Validar que la categoría interna exista
    cat_res = await db.execute(select(Category).where(Category.id == req.internal_category_id))
    if not cat_res.scalars().first():
        raise HTTPException(status_code=400, detail="Categoría interna inválida.")
        
    # 3. Crear el mapeo
    new_map = SupplierCategoryMap(
        provider_name=unmapped.provider_name,
        provider_category_path=unmapped.provider_category_path,
        internal_category_id=req.internal_category_id
    )
    db.add(new_map)
    
    # 4. Eliminar del log
    await db.delete(unmapped)
    
    # 5. Guardar
    await db.commit()
    
    return {"success": True, "message": "Categoría mapeada correctamente."}

@router.delete("/unmapped/{unmapped_id}")
async def ignore_unmapped_category(unmapped_id: int, db: AsyncSession = Depends(get_db)):
    """
    Ignora (elimina) una categoría no mapeada del log si no se desea mapear.
    """
    result = await db.execute(select(UnmappedCategoryLog).where(UnmappedCategoryLog.id == unmapped_id))
    unmapped = result.scalars().first()
    if unmapped:
        await db.delete(unmapped)
        await db.commit()
    return {"success": True}

@router.get("/maps", response_model=List[SupplierMapResponse])
async def get_supplier_maps(db: AsyncSession = Depends(get_db)):
    """
    Obtiene el diccionario activo de reglas (mapeos guardados).
    """
    result = await db.execute(select(SupplierCategoryMap).options(selectinload(SupplierCategoryMap.internal_category)).order_by(SupplierCategoryMap.created_at.desc()))
    return result.scalars().all()

@router.delete("/maps/{map_id}")
async def delete_supplier_map(map_id: int, db: AsyncSession = Depends(get_db)):
    """
    Elimina una regla del diccionario.
    """
    result = await db.execute(select(SupplierCategoryMap).where(SupplierCategoryMap.id == map_id))
    map_entry = result.scalars().first()
    if not map_entry:
        raise HTTPException(status_code=404, detail="Regla no encontrada.")
    await db.delete(map_entry)
    await db.commit()
    return {"success": True}
