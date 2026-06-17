from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.deps import get_current_active_user, require_permissions
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.db.session import get_db
from app.models.product import Category, ProductAttribute, ProductAttributeValue, Product, Brand, MarketingTag
from app.schemas.category import CategoryResponse, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Category)
    if search:
        query = query.where(Category.name.ilike(f"%{search}%"))
    result = await db.execute(query.order_by(Category.name))
    categories = result.scalars().all()
    
    from sqlalchemy import func
    from app.models.product import Product
    count_res = await db.execute(select(Product.category_id, func.count(Product.id)).where(Product.category_id.isnot(None)).group_by(Product.category_id))
    counts = dict(count_res.all())
    
    for c in categories:
        c.product_count = counts.get(c.id, 0)
        
    return categories

@router.post("/categories", response_model=CategoryResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    check = await db.execute(select(Category).where(Category.slug == category_in.slug))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    new_cat = Category(**category_in.model_dump())
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat

@router.put("/categories/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    update_data = category_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != category.slug:
        check = await db.execute(select(Category).where(Category.slug == update_data["slug"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Slug already exists")
            
    for field, value in update_data.items():
        setattr(category, field, value)
        
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{category_id}", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Validar que no tenga productos o subcategorías antes de borrar (opcional, o dejar que cascade actúe si está configurado)
    check_products = await db.execute(select(Product.id).where(Product.category_id == category_id).limit(1))
    if check_products.scalars().first():
        raise HTTPException(status_code=400, detail="No se puede borrar porque existen productos usando esta categoría.")
        
    check_subs = await db.execute(select(Category.id).where(Category.parent_id == category_id).limit(1))
    if check_subs.scalars().first():
        raise HTTPException(status_code=400, detail="No se puede borrar porque tiene subcategorías asociadas.")
        
    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted"}

from app.schemas.attribute import (
    AttributeResponse, AttributeCreate, AttributeUpdate, AttributeWithValuesResponse,
    AttributeValueResponse, AttributeValueCreate, AttributeValueUpdate
)

@router.get("/attributes", response_model=List[AttributeWithValuesResponse])
async def get_attributes(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    query = select(ProductAttribute).options(selectinload(ProductAttribute.values))
    if search:
        query = query.where(ProductAttribute.name.ilike(f"%{search}%"))
    result = await db.execute(query.order_by(ProductAttribute.name))
    return result.scalars().all()

@router.post("/attributes", response_model=AttributeResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def create_attribute(
    attr_in: AttributeCreate,
    db: AsyncSession = Depends(get_db)
):
    check = await db.execute(select(ProductAttribute).where(ProductAttribute.slug == attr_in.slug))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    new_attr = ProductAttribute(**attr_in.model_dump())
    db.add(new_attr)
    await db.commit()
    await db.refresh(new_attr)
    return new_attr

@router.put("/attributes/{attribute_id}", response_model=AttributeResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def update_attribute(
    attribute_id: int,
    attr_in: AttributeUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProductAttribute).where(ProductAttribute.id == attribute_id))
    attr = result.scalars().first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
        
    update_data = attr_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != attr.slug:
        check = await db.execute(select(ProductAttribute).where(ProductAttribute.slug == update_data["slug"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Slug already exists")
            
    for field, value in update_data.items():
        setattr(attr, field, value)
        
    await db.commit()
    await db.refresh(attr)
    return attr

@router.delete("/attributes/{attribute_id}", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def delete_attribute(
    attribute_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProductAttribute).where(ProductAttribute.id == attribute_id))
    attr = result.scalars().first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")
        
    if attr.is_for_configurator:
        raise HTTPException(status_code=400, detail="No se puede eliminar un atributo crítico para el Configurador.")
        
    await db.delete(attr)
    await db.commit()
    return {"message": "Attribute deleted"}

# --- Valores de Atributo ---
@router.post("/attributes/{attribute_id}/values", response_model=AttributeValueResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def create_attribute_value(
    attribute_id: int,
    val_in: AttributeValueCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProductAttribute).where(ProductAttribute.id == attribute_id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Attribute not found")
        
    check = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.slug == val_in.slug))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
        
    new_val = ProductAttributeValue(**val_in.model_dump(), attribute_id=attribute_id)
    db.add(new_val)
    await db.commit()
    await db.refresh(new_val)
    return new_val

@router.put("/attributes/values/{value_id}", response_model=AttributeValueResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def update_attribute_value(
    value_id: int,
    val_in: AttributeValueUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.id == value_id))
    val = result.scalars().first()
    if not val:
        raise HTTPException(status_code=404, detail="Value not found")
        
    update_data = val_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != val.slug:
        check = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.slug == update_data["slug"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Slug already exists")
            
    for field, value in update_data.items():
        setattr(val, field, value)
        
    await db.commit()
    await db.refresh(val)
    return val

@router.delete("/attributes/values/{value_id}", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def delete_attribute_value(
    value_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.id == value_id))
    val = result.scalars().first()
    if not val:
        raise HTTPException(status_code=404, detail="Value not found")
        
    await db.delete(val)
    await db.commit()
    return {"message": "Value deleted"}

from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse

@router.get("/brands", response_model=List[BrandResponse])
async def get_brands(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Brand)
    if search:
        query = query.where(Brand.name.ilike(f"%{search}%"))
    result = await db.execute(query.order_by(Brand.name))
    return result.scalars().all()

@router.post("/brands", response_model=BrandResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def create_brand(
    brand_in: BrandCreate,
    db: AsyncSession = Depends(get_db)
):
    check = await db.execute(select(Brand).where(Brand.slug == brand_in.slug))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    new_brand = Brand(**brand_in.model_dump())
    db.add(new_brand)
    await db.commit()
    await db.refresh(new_brand)
    return new_brand

@router.get("/brands/{brand_id}", response_model=BrandResponse)
async def get_brand(
    brand_id: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(Brand).where(Brand.id == brand_id)
    result = await db.execute(query)
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@router.put("/brands/{brand_id}", response_model=BrandResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def update_brand(
    brand_id: int,
    brand_in: BrandUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalars().first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    update_data = brand_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != brand.slug:
        check = await db.execute(select(Brand).where(Brand.slug == update_data["slug"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Slug already exists")
            
    for field, value in update_data.items():
        setattr(brand, field, value)
        
    await db.commit()
    await db.refresh(brand)
    return brand

@router.delete("/brands/{brand_id}", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def delete_brand(
    brand_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalars().first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
        
    check_products = await db.execute(select(Product).where(Product.brand_id == brand_id).limit(1))
    if check_products.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete brand because it has associated products.")
        
    await db.delete(brand)
    await db.commit()
    return {"message": "Brand deleted"}

from app.schemas.product import MarketingTagCreate, MarketingTagUpdate, MarketingTagResponse

@router.get("/marketing-tags", response_model=List[MarketingTagResponse])
async def get_marketing_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MarketingTag).order_by(MarketingTag.name))
    return result.scalars().all()

@router.post("/marketing-tags", response_model=MarketingTagResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def create_marketing_tag(
    tag_in: MarketingTagCreate,
    db: AsyncSession = Depends(get_db)
):
    check = await db.execute(select(MarketingTag).where(MarketingTag.slug == tag_in.slug))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="Slug already exists")
    new_tag = MarketingTag(**tag_in.model_dump())
    db.add(new_tag)
    await db.commit()
    await db.refresh(new_tag)
    return new_tag

@router.put("/marketing-tags/{tag_id}", response_model=MarketingTagResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def update_marketing_tag(
    tag_id: int,
    tag_in: MarketingTagUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MarketingTag).where(MarketingTag.id == tag_id))
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
        
    update_data = tag_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != tag.slug:
        check = await db.execute(select(MarketingTag).where(MarketingTag.slug == update_data["slug"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Slug already exists")
            
    for field, value in update_data.items():
        setattr(tag, field, value)
        
    await db.commit()
    await db.refresh(tag)
    return tag

@router.delete("/marketing-tags/{tag_id}", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def delete_marketing_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MarketingTag).where(MarketingTag.id == tag_id))
    tag = result.scalars().first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
        
    await db.delete(tag)
    await db.commit()
    return {"message": "Tag deleted"}

import os
from app.services.image_optimizer import ImageOptimizer
from pydantic import BaseModel

from fastapi.responses import StreamingResponse
import json
import asyncio

@router.get("/optimize-images/stream", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def optimize_all_images_stream(db: AsyncSession = Depends(get_db)):
    """
    Escanea todo el catálogo buscando imágenes en JPG/PNG locales y las convierte
    a WEBP de 1000x1000, borrando el archivo original.
    Devuelve Server-Sent Events (SSE) para medir progreso.
    """
    async def event_generator():
        query = select(Product)
        result = await db.execute(query)
        products = result.scalars().all()
        
        total_products = len(products)
        optimized_count = 0
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
        
        yield f"data: {json.dumps({'status': 'scanning', 'current_product': 0, 'total_products': total_products, 'optimized_images': 0})}\n\n"
        
        for i, product in enumerate(products):
            updated = False
            
            # Procesar imagen principal
            if product.main_image_url and product.main_image_url.lower().endswith(('.jpg', '.jpeg', '.png')):
                if product.main_image_url.startswith('/media') or product.main_image_url.startswith('/uploads'):
                    rel_path = product.main_image_url.lstrip('/')
                    abs_path = os.path.join(base_dir, rel_path)
                    
                    if os.path.exists(abs_path):
                        try:
                            new_abs_path = await asyncio.to_thread(ImageOptimizer.optimize_image, abs_path)
                            os.remove(abs_path)
                            new_rel_path = '/' + os.path.relpath(new_abs_path, base_dir)
                            product.main_image_url = new_rel_path
                            optimized_count += 1
                            updated = True
                        except Exception as e:
                            print(f"Error optimizando {abs_path}: {e}")
            
            # Procesar galería
            if product.image_gallery:
                new_gallery = []
                for img_url in product.image_gallery:
                    if img_url.lower().endswith(('.jpg', '.jpeg', '.png')) and (img_url.startswith('/media') or img_url.startswith('/uploads')):
                        rel_path = img_url.lstrip('/')
                        abs_path = os.path.join(base_dir, rel_path)
                        if os.path.exists(abs_path):
                            try:
                                new_abs_path = await asyncio.to_thread(ImageOptimizer.optimize_image, abs_path)
                                os.remove(abs_path)
                                new_rel_path = '/' + os.path.relpath(new_abs_path, base_dir)
                                new_gallery.append(new_rel_path)
                                optimized_count += 1
                                updated = True
                                continue
                            except Exception as e:
                                print(f"Error optimizando galería {abs_path}: {e}")
                    
                    new_gallery.append(img_url)
                    
                if updated:
                    product.image_gallery = new_gallery
                    
            if updated:
                db.add(product)
                
            # Enviar progreso por lotes para evitar saturar el stream (o si se optimizó algo)
            if updated or (i % 10 == 0) or (i == total_products - 1):
                yield f"data: {json.dumps({'status': 'progress', 'current_product': i + 1, 'total_products': total_products, 'optimized_images': optimized_count})}\n\n"
                
        if optimized_count > 0:
            await db.commit()
            
        yield f"data: {json.dumps({'status': 'completed', 'current_product': total_products, 'total_products': total_products, 'optimized_images': optimized_count})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
