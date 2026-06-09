from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from pydantic import BaseModel
import re
from app.db.session import get_db
from app.models.product import Product, ProductAttributeValue, ProductAttribute, Category
import traceback

router = APIRouter()

class ConfiguratorRequest(BaseModel):
    category_slug: str
    selected_product_ids: List[int] = []

def extract_number(val: str) -> float:
    match = re.search(r'[\d\.]+', val)
    return float(match.group()) if match else 0.0

def intersects(val1: str, val2: str) -> bool:
    if not val1 or not val2:
        return False
    set1 = {v.strip().lower() for v in val1.split('|')}
    set2 = {v.strip().lower() for v in val2.split('|')}
    return len(set1.intersection(set2)) > 0

def get_estimated_watts(p_attrs: dict) -> float:
    if "tdp" in p_attrs:
        return extract_number(p_attrs["tdp"])
    if "consumo de energía" in p_attrs:
        return extract_number(p_attrs["consumo de energía"])
    return 0.0

@router.post("/compatible-products")
async def get_compatible_products(req: ConfiguratorRequest, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Obtener la categoría destino
        cat_query = await db.execute(select(Category).where(Category.slug == req.category_slug))
        category = cat_query.scalars().first()
        if not category:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
            
        # 2. Consultar los productos actualmente seleccionados para armar el contexto
        selected_products = []
        if req.selected_product_ids:
            sp_stmt = select(Product).where(Product.id.in_(req.selected_product_ids)).options(
                selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute),
                selectinload(Product.category)
            )
            res = await db.execute(sp_stmt)
            selected_products = res.scalars().all()

        # Construir un diccionario consolidado de atributos seleccionados y datos del sistema
        ctx_attrs = {}
        total_watts = 0
        for sp in selected_products:
            # 1. Recolectar atributos del producto actual (UNION)
            sp_attrs = {}
            for attr_val in sp.attribute_values:
                if attr_val.value:
                    key = attr_val.attribute.name.lower().strip()
                    val = attr_val.value.lower().strip()
                    if key in sp_attrs:
                        existing = [v.strip() for v in sp_attrs[key].split('|')]
                        new_vals = [v.strip() for v in val.split('|')]
                        for nv in new_vals:
                            if nv not in existing:
                                sp_attrs[key] += f" | {nv}"
                    else:
                        sp_attrs[key] = val
            
            total_watts += get_estimated_watts(sp_attrs)
            
            # 2. Mezclar con el contexto global (INTERSECCIÓN estricta para conectores)
            for key, val in sp_attrs.items():
                if key in ctx_attrs:
                    existing = {v.strip() for v in ctx_attrs[key].split('|')}
                    new_vals = {v.strip() for v in val.split('|')}
                    intersected = existing.intersection(new_vals)
                    if intersected:
                        ctx_attrs[key] = " | ".join(intersected)
                    else:
                        ctx_attrs[key] = "" # Incompatible
                else:
                    ctx_attrs[key] = val

        # 3. Consultar productos candidatos
        stmt = select(Product).where(
            Product.category_id == category.id,
            Product.status == "PUBLISHED",
            Product.is_in_configurator == True
        ).options(
            selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute),
            selectinload(Product.inventory_stocks)
        )
        
        result = await db.execute(stmt)
        products = result.scalars().all()
        
        compatible_products = []
        
        # 4. Motor de Reglas Hardcoded
        target_slug = req.category_slug
        has_gpu = any(sp.category and sp.category.slug == 'tarjetas-de-video' for sp in selected_products)
        
        for p in products:
            p_attrs = {}
            for a in p.attribute_values:
                if a.value:
                    key = a.attribute.name.lower().strip()
                    val = a.value.lower().strip()
                    if key in p_attrs:
                        existing = [v.strip() for v in p_attrs[key].split('|')]
                        new_vals = [v.strip() for v in val.split('|')]
                        for nv in new_vals:
                            if nv not in existing:
                                p_attrs[key] += f" | {nv}"
                    else:
                        p_attrs[key] = val
            
            is_compatible = True
            
            # Regla Global de Fuentes de Poder
            if target_slug == 'fuentes-de-poder':
                p_watts = extract_number(p_attrs.get("potencia en watts", "0"))
                if p_watts:
                    min_required = total_watts + 100
                    if "fuente recomendada" in ctx_attrs:
                        recommended_watts = extract_number(ctx_attrs["fuente recomendada"])
                        if recommended_watts > min_required:
                            min_required = recommended_watts
                            
                    if p_watts < min_required:
                        is_compatible = False
                        
                # Regla de Certificación 80 Plus para GPUs discretas
                if has_gpu and is_compatible:
                    if "certificación" in p_attrs:
                        if "sin certificación" in p_attrs["certificación"].lower():
                            is_compatible = False
                            
            # Reglas Específicas por Categoría
            if is_compatible:
                # PROCESADORES
                if target_slug == 'procesadores':
                    if "socket" in ctx_attrs:
                        if "socket" not in p_attrs or not intersects(ctx_attrs["socket"], p_attrs["socket"]):
                            is_compatible = False

                # TARJETAS MADRE
                elif target_slug == 'tarjetas-madre':
                    if "socket" in ctx_attrs:
                        if "socket" not in p_attrs or not intersects(ctx_attrs["socket"], p_attrs["socket"]):
                            is_compatible = False
                    if "factor de forma" in ctx_attrs:
                        if "factor de forma" not in p_attrs or not intersects(ctx_attrs["factor de forma"], p_attrs["factor de forma"]):
                            is_compatible = False
                    if "tecnología ram" in ctx_attrs:
                        if "tecnología ram" not in p_attrs or not intersects(ctx_attrs["tecnología ram"], p_attrs["tecnología ram"]):
                            is_compatible = False
                    if "velocidad (mt/s)" in ctx_attrs:
                        if "velocidad (mt/s)" not in p_attrs or not intersects(ctx_attrs["velocidad (mt/s)"], p_attrs["velocidad (mt/s)"]):
                            is_compatible = False

                # MEMORIAS RAM
                elif target_slug == 'memorias-ram':
                    if "tecnología ram" in ctx_attrs:
                        if "tecnología ram" not in p_attrs or not intersects(ctx_attrs["tecnología ram"], p_attrs["tecnología ram"]):
                            is_compatible = False
                    if "velocidad (mt/s)" in ctx_attrs:
                        if "velocidad (mt/s)" not in p_attrs or not intersects(ctx_attrs["velocidad (mt/s)"], p_attrs["velocidad (mt/s)"]):
                            is_compatible = False
                    # Validar módulos (Extrae el número de módulos de "16GB Kit (2x8GB)" -> 2)
                    if "ranuras de memoria ram" in ctx_attrs and "presentación ram" in p_attrs:
                        slots_str = ctx_attrs["ranuras de memoria ram"]
                        slots = extract_number(slots_str)
                        
                        pres_str = p_attrs["presentación ram"]
                        mod_match = re.search(r'(\d+)x', pres_str)
                        mods = float(mod_match.group(1)) if mod_match else 1.0 # Single module si no dice nx
                        
                        if mods > slots:
                            is_compatible = False

                # DISIPADORES Y ENFRIAMIENTOS
                elif target_slug in ['disipadores', 'enfriamientos-liquidos']:
                    if "socket" in ctx_attrs:
                        if "socket" not in p_attrs or not intersects(ctx_attrs["socket"], p_attrs["socket"]):
                            is_compatible = False
                            
                    if target_slug == 'disipadores':
                        if "espacio max disipador (mm)" in ctx_attrs:
                            max_space = extract_number(ctx_attrs["espacio max disipador (mm)"])
                            if "altura del disipador (mm)" in p_attrs:
                                cooler_height = extract_number(p_attrs["altura del disipador (mm)"])
                                if cooler_height > max_space:
                                    is_compatible = False
                    
                    if target_slug == 'enfriamientos-liquidos':
                        if "soporte de radiador" in ctx_attrs:
                            if "tamaño del radiador" in p_attrs:
                                if not intersects(ctx_attrs["soporte de radiador"], p_attrs["tamaño del radiador"]):
                                    is_compatible = False

                # TARJETAS DE VIDEO
                elif target_slug == 'tarjetas-de-video':
                    if "espacio max gpu (mm)" in ctx_attrs:
                        max_gpu = extract_number(ctx_attrs["espacio max gpu (mm)"])
                        if "largo gpu (mm)" in p_attrs:
                            gpu_length = extract_number(p_attrs["largo gpu (mm)"])
                            if gpu_length > max_gpu:
                                is_compatible = False

                # ALMACENAMIENTO (Primario y Extra)
                elif target_slug in ['ssd', 'discos-duros']:
                    if "soporte de almacenamiento" in ctx_attrs:
                        supported = ctx_attrs["soporte de almacenamiento"].lower()
                        if "interfaz" in p_attrs:
                            interfaz = p_attrs["interfaz"].lower()
                            
                            # Logica difusa/diccionario para SSDs y HDDs
                            if "nvme" in interfaz and "nvme" not in supported:
                                is_compatible = False
                            elif "sata" in interfaz and "sata" not in supported:
                                is_compatible = False
                            elif "u2" in interfaz and "u2" not in supported:
                                is_compatible = False

                # GABINETES
                elif target_slug == 'gabinetes':
                    if "factor de forma" in ctx_attrs:
                        if "factor de forma" not in p_attrs or not intersects(ctx_attrs["factor de forma"], p_attrs["factor de forma"]):
                            is_compatible = False
                    if "formato de fuente" in ctx_attrs:
                        if "formato de fuente" not in p_attrs or not intersects(ctx_attrs["formato de fuente"], p_attrs["formato de fuente"]):
                            is_compatible = False
                    if "altura del disipador (mm)" in ctx_attrs:
                        cooler_height = extract_number(ctx_attrs["altura del disipador (mm)"])
                        if "espacio max disipador (mm)" in p_attrs:
                            max_space = extract_number(p_attrs["espacio max disipador (mm)"])
                            if max_space < cooler_height:
                                is_compatible = False
                    if "largo gpu (mm)" in ctx_attrs:
                        gpu_length = extract_number(ctx_attrs["largo gpu (mm)"])
                        if "espacio max gpu (mm)" in p_attrs:
                            max_space = extract_number(p_attrs["espacio max gpu (mm)"])
                            if max_space < gpu_length:
                                is_compatible = False
                    if "tamaño del radiador" in ctx_attrs:
                        if "soporte de radiador" not in p_attrs or not intersects(ctx_attrs["tamaño del radiador"], p_attrs["soporte de radiador"]):
                            is_compatible = False

            if is_compatible:
                compatible_products.append(p)

        out = []
        for p in compatible_products:
            attrs_formatted = [{"name": a.attribute.name, "value": a.value, "is_critical": a.attribute.is_for_configurator} for a in p.attribute_values]
            out.append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "price": p.base_price or 0.0,
                "images": p.image_gallery if p.image_gallery else ([p.main_image_url] if p.main_image_url else []),
                "stock": sum(s.quantity for s in p.inventory_stocks) if p.inventory_stocks else 0,
                "attributes": attrs_formatted,
                "estimated_watts": get_estimated_watts(p_attrs)
            })
            
        return out
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
