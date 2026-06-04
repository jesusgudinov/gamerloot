from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.product import Product, Category
from app.models.inventory import InventoryStock

async def recalculate_product_price(product_id: int, db: AsyncSession):
    """
    1. Obtiene el costo más bajo de proveedores con stock para este producto.
    2. Obtiene el margen de ganancia de la categoría del producto (o 30.0 por defecto).
    3. Calcula el nuevo precio de venta y lo actualiza en la BD.
    """
    
    # 1. Buscar el costo más bajo de proveedores QUE TENGAN STOCK
    query_stock = select(func.min(InventoryStock.supplier_cost)).where(
        InventoryStock.product_id == product_id,
        InventoryStock.quantity > 0
    )
    result_stock = await db.execute(query_stock)
    cheapest_cost = result_stock.scalar_one_or_none()
    
    # Obtener el producto
    query_prod = select(Product).where(Product.id == product_id)
    result_prod = await db.execute(query_prod)
    product = result_prod.scalar_one_or_none()
    
    if not product:
        return
        
    if cheapest_cost is None:
        # Si no hay stock en ningún almacén o no hay costo, dejamos el precio base igual pero podríamos también ocultar el producto o marcar que no tiene stock.
        # Por ahora lo dejamos igual.
        return
        
    # 2. Obtener margen de ganancia
    margin = 30.0 # Default
    if product.category_id:
        query_cat = select(Category).where(Category.id == product.category_id)
        result_cat = await db.execute(query_cat)
        category = result_cat.scalar_one_or_none()
        if category and category.margin_percentage is not None:
            margin = category.margin_percentage
            
    # 3. Calcular y actualizar
    new_price = cheapest_cost * (1 + (margin / 100.0))
    
    # Redondeamos al entero más cercano o 2 decimales
    new_price = round(new_price, 2)
    
    product.base_price = new_price
    
    # Solo agregamos al DB, el commit() lo hará el script llamador.
    db.add(product)
