from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from app.api.deps import get_current_active_user, require_permissions
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, asc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.db.session import get_db
from app.models.product import Product, ProductAttributeValue, ProductAttribute, MarketingTag, Category
from app.models.inventory import InventoryStock, Warehouse
from app.schemas.product import ProductPublicResponse, PaginatedProductResponse, ProductCreate, ProductUpdate, ProductAdminResponse, QuickEditRequest, BulkEditRequest
import math

router = APIRouter()

@router.get("/stats")
async def get_products_stats(db: AsyncSession = Depends(get_db)):
    # Total products
    total_query = select(func.count(Product.id))
    total_res = await db.execute(total_query)
    total_products = total_res.scalar() or 0
    
    # Low stock (< 3 total across all warehouses)
    # Use outerjoin to include products with no stock records
    from app.models.inventory import InventoryStock
    low_stock_query = select(Product.id).outerjoin(InventoryStock).group_by(Product.id).having(func.coalesce(func.sum(InventoryStock.quantity), 0) < 3)
    low_stock_res = await db.execute(low_stock_query)
    low_stock_products = len(low_stock_res.all())
    
    return {
        "total_products": total_products,
        "low_stock": low_stock_products
    }

@router.get("/", response_model=PaginatedProductResponse)
async def get_products(
    page: int = 1, 
    size: int = 50, 
    search: Optional[str] = None,
    brand_id: Optional[int] = None,
    sort_by: Optional[str] = None,
    provider: Optional[str] = None,
    in_stock: Optional[bool] = None,
    has_discount: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    tag: Optional[str] = None,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * size
    
    # Construir condiciones base
    conditions = []
    if search:
        conditions.append(or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"), Product.upc.ilike(f"%{search}%")))
    if brand_id is not None:
        conditions.append(Product.brand_id == brand_id)
    if category_id is not None:
        cat_result = await db.execute(select(Category).options(selectinload(Category.subcategories)).where(Category.id == category_id))
        category = cat_result.scalars().first()
        if category and category.subcategories:
            sub_ids = [c.id for c in category.subcategories]
            sub_ids.append(category_id)
            conditions.append(Product.category_id.in_(sub_ids))
        else:
            conditions.append(Product.category_id == category_id)
    if status is not None:
        conditions.append(Product.status == status)
    if has_discount:
        conditions.append(Product.discount_price.isnot(None))
    if is_featured is not None:
        conditions.append(Product.is_featured == is_featured)
    if tag:
        if tag == 'no_image':
            conditions.append(Product.main_image_url.is_(None))
        else:
            from sqlalchemy import cast, String
            conditions.append(cast(Product.tags, String).ilike(f'%"{tag}"%'))
        
    if in_stock:
        subq = select(func.coalesce(func.sum(InventoryStock.quantity), 0)).where(InventoryStock.product_id == Product.id).scalar_subquery()
        conditions.append((subq - Product.reserved_quantity) > 0)
        
    if provider:
        conditions.append(Product.inventory_stocks.any(
            InventoryStock.warehouse.has(Warehouse.provider_name == provider)
        ))

    # Calcular total de productos con filtros
    total_query = select(func.count()).select_from(Product)
    if conditions:
        total_query = total_query.where(*conditions)
        
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()

    # Obtenemos los productos con filtros
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.brand_relation),
        selectinload(Product.marketing_tags_relation),
        selectinload(Product.attribute_values),
        selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse),
        selectinload(Product.active_campaign)
    )
    if conditions:
        query = query.where(*conditions)
        
    # Ordenamiento
    if sort_by == "name_asc":
        query = query.order_by(asc(Product.name))
    elif sort_by == "name_desc":
        query = query.order_by(desc(Product.name))
    elif sort_by == "price_asc":
        query = query.order_by(asc(Product.base_price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.base_price))
    else:
        query = query.order_by(desc(Product.id))
        
    query = query.offset(skip).limit(size)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    pages = math.ceil(total / size) if size > 0 else 0
    
    return {
        "items": products,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }


@router.get("/id/{id}", response_model=ProductPublicResponse)
async def get_product_by_id(id: int, db: AsyncSession = Depends(get_db)):
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.brand_relation),
        selectinload(Product.marketing_tags_relation),
        selectinload(Product.attribute_values),
        selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse),
        selectinload(Product.active_campaign)
    ).where(Product.id == id)
    
    result = await db.execute(query)
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.get("/{slug}", response_model=ProductPublicResponse)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.brand_relation),
        selectinload(Product.marketing_tags_relation),
        selectinload(Product.attribute_values),
        selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse),
        selectinload(Product.active_campaign)
    ).where(Product.slug == slug)
    
    result = await db.execute(query)
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/", response_model=ProductAdminResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    # Check si el SKU o SLUG ya existen
    check = await db.execute(select(Product).where(or_(Product.sku == product_in.sku, Product.slug == product_in.slug)))
    if check.scalars().first():
        raise HTTPException(status_code=400, detail="SKU o Slug ya existen")
        
    data = product_in.model_dump(exclude={"attribute_value_ids", "marketing_tag_ids", "category", "brand_relation"})
    new_product = Product(**data)
    
    # Resolver relations M2M
    if product_in.attribute_value_ids:
        res = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.id.in_(product_in.attribute_value_ids)))
        new_product.attribute_values = res.scalars().all()
        
    if product_in.marketing_tag_ids:
        res = await db.execute(select(MarketingTag).where(MarketingTag.id.in_(product_in.marketing_tag_ids)))
        new_product.marketing_tags_relation = res.scalars().all()

    db.add(new_product)
    await db.flush() # Para obtener el ID
    
    # Inicializar inventario por defecto en el primer almacén
    from app.models.inventory import Warehouse, InventoryStock
    first_warehouse_res = await db.execute(select(Warehouse).limit(1))
    first_warehouse = first_warehouse_res.scalars().first()
    
    if not first_warehouse:
        first_warehouse = Warehouse(name="Principal", provider_name="Interno", city="Default", state="Default")
        db.add(first_warehouse)
        await db.flush()
        
    new_stock = InventoryStock(product_id=new_product.id, warehouse_id=first_warehouse.id, quantity=0, supplier_cost=0.0)
    db.add(new_stock)

    await db.commit()
    
    # Reload full product
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.brand_relation),
        selectinload(Product.marketing_tags_relation),
        selectinload(Product.attribute_values),
        selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse),
        selectinload(Product.active_campaign)
    ).where(Product.id == new_product.id)
    res = await db.execute(query)
    return res.scalars().first()

@router.put("/{product_id}", response_model=ProductAdminResponse, dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def update_product(product_id: int, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Product).options(
        selectinload(Product.attribute_values),
        selectinload(Product.marketing_tags_relation)
    ).where(Product.id == product_id)
    res = await db.execute(query)
    product = res.scalars().first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    update_data = product_in.model_dump(exclude_unset=True, exclude={"attribute_value_ids", "marketing_tag_ids", "category", "brand_relation"})
    
    # Verificar unicidad de SKU/Slug
    if "slug" in update_data and update_data["slug"] != product.slug:
        check = await db.execute(select(Product).where(Product.slug == update_data["slug"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="Slug ya existe")
            
    if "sku" in update_data and update_data["sku"] != product.sku:
        check = await db.execute(select(Product).where(Product.sku == update_data["sku"]))
        if check.scalars().first():
            raise HTTPException(status_code=400, detail="SKU ya existe")

    for field, value in update_data.items():
        setattr(product, field, value)
        
    if product_in.attribute_value_ids is not None:
        res_attr = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.id.in_(product_in.attribute_value_ids)))
        product.attribute_values = res_attr.scalars().all()
        
    if product_in.marketing_tag_ids is not None:
        res_tag = await db.execute(select(MarketingTag).where(MarketingTag.id.in_(product_in.marketing_tag_ids)))
        product.marketing_tags_relation = res_tag.scalars().all()
        
    await db.commit()
    
    # Reload full product
    full_query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.brand_relation),
        selectinload(Product.marketing_tags_relation),
        selectinload(Product.attribute_values),
        selectinload(Product.inventory_stocks).selectinload(InventoryStock.warehouse),
        selectinload(Product.active_campaign)
    ).where(Product.id == product.id)
    full_res = await db.execute(full_query)
    return full_res.scalars().first()

@router.delete("/{product_id}", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Product).where(Product.id == product_id))
    product = res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    await db.delete(product)
    await db.commit()
    return {"message": "Producto eliminado exitosamente"}

@router.post("/upload-csv", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def upload_products_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # Aquí irá la lógica de Pandas / CSV DictReader para leer el archivo
    # Validar las columnas y hacer upsert en la BD.
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un .csv")
    
    return {"message": f"Archivo {file.filename} recibido exitosamente y listo para procesar stock manual."}

@router.patch("/{id}/quick-edit", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def quick_edit_product(
    id: int, 
    request: QuickEditRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Product).where(Product.id == id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if request.name is not None:
        product.name = request.name
    if request.sku is not None:
        product.sku = request.sku
    if request.base_price is not None:
        product.base_price = request.base_price
    if request.discount_price is not None:
        product.discount_price = request.discount_price
        
    await db.commit()
    return {"success": True}

@router.patch("/bulk-edit", dependencies=[Depends(require_permissions(["manage_catalog"]))])
async def bulk_edit_products(
    request: BulkEditRequest,
    db: AsyncSession = Depends(get_db)
):
    if not request.product_ids:
        return {"success": True, "updated": 0}
        
    query = select(Product).options(selectinload(Product.attribute_values)).where(Product.id.in_(request.product_ids))
    result = await db.execute(query)
    products = result.scalars().all()
    
    updated_count = 0
    action = request.action
    payload = request.payload
    
    for product in products:
        updated_count += 1
        if action == "DISCOUNT":
            percent = float(payload.get("percentage", 0))
            if percent > 0:
                product.discount_price = product.base_price * (1 - (percent / 100))
        elif action == "REMOVE_DISCOUNT":
            product.discount_price = None
        elif action == "STATUS":
            product.status = payload.get("status", "DRAFT")
        elif action == "FEATURED":
            product.is_featured = payload.get("is_featured", False)
        elif action == "BRAND":
            product.brand_id = payload.get("brand_id")
        elif action == "CATEGORY":
            new_cat_id = payload.get("category_id")
            product.category_id = new_cat_id
            
    await db.commit()
    return {"success": True, "updated": updated_count}
