import httpx
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slugify import slugify

from app.models.product import Product, Brand, Category
from app.models.inventory import Warehouse, InventoryStock
from app.core.pricing import recalculate_product_price
from sqlalchemy import update

class SyscomClient:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = "https://developers.syscom.mx/api/v1"
        self.token = None
        
    async def authenticate(self):
        """Autenticación OAuth2 Client Credentials con Syscom"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://developers.syscom.mx/oauth/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "client_credentials"
                }
            )
            response.raise_for_status()
            data = response.json()
            self.token = data.get("access_token")
            return self.token
            
    async def _get(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        if not self.token:
            await self.authenticate()
            
        headers = {"Authorization": f"Bearer {self.token}"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{self.base_url}{endpoint}", headers=headers, params=params)
            # Manejar token expirado de forma básica
            if response.status_code == 401:
                await self.authenticate()
                headers = {"Authorization": f"Bearer {self.token}"}
                response = await client.get(f"{self.base_url}{endpoint}", headers=headers, params=params)
                
            response.raise_for_status()
            return response.json()

    async def sync_catalog(self, db: AsyncSession, log_func=None) -> int:
        """
        Descarga productos de Syscom y los inserta/actualiza en la base de datos.
        """
        if log_func: log_func(5, "Autenticando con Syscom API...")
        await self.authenticate()
        
        if log_func: log_func(10, "Asegurando bodega de Syscom...")
        result = await db.execute(select(Warehouse).where(Warehouse.internal_code == "SYSCOM"))
        syscom_warehouse = result.scalars().first()
        if not syscom_warehouse:
            syscom_warehouse = Warehouse(
                name="Bodega Central Syscom", 
                provider_name="Syscom", 
                internal_code="SYSCOM",
                city="Chihuahua",
                state="Chihuahua"
            )
            db.add(syscom_warehouse)
            await db.commit()
            await db.refresh(syscom_warehouse)

        page = 1
        updated = 0
        total_pages = 1 # Se actualizará en la primera petición
        
        # --- MOTOR DE MAPEO DE CATEGORÍAS ---
        from app.services.taxonomy_engine import TaxonomyEngine
        map_dict = await TaxonomyEngine.get_provider_map(db, "Syscom")
        all_internal_categories = await TaxonomyEngine.get_all_categories_with_keywords(db)
        # -------------------------------------
        
        # --- LIMPIEZA DE INVENTARIO FANTASMA ---
        if log_func: log_func(12, "Limpiando stock fantasma de Syscom...")
        await db.execute(update(InventoryStock).where(InventoryStock.warehouse_id == syscom_warehouse.id).values(quantity=0))
        await db.commit()
        
        processed_product_ids = set()
        
        while page <= total_pages:
            if log_func: log_func(15 + int((page/max(1, total_pages))*80), f"Descargando página {page} de {total_pages}...")
            
            try:
                # Filtrar solo productos que estén disponibles (stock > 0 puede ser otro filtro)
                # O podríamos traer un subconjunto específico por categoría.
                data = await self._get("/productos", {"pagina": page})
                total_pages = data.get("paginas", 1)
                productos = data.get("productos", [])
                
                for p in productos:
                    sku = p.get("modelo", "").strip()
                    if not sku:
                        continue
                        
                    # Procesar Marca
                    brand_name = p.get("marca", "").strip()
                    brand_obj = None
                    if brand_name:
                        brand_slug = slugify(brand_name)
                        b_res = await db.execute(
                            select(Brand).where(
                                (Brand.slug == brand_slug) | (Brand.name.ilike(brand_name))
                            )
                        )
                        brand_obj = b_res.scalars().first()
                        if not brand_obj:
                            brand_obj = Brand(name=brand_name, slug=brand_slug)
                            db.add(brand_obj)
                            await db.flush()
                            
                    # Procesar Categoría usando el Motor
                    cat_name = ""
                    cat_list = p.get("categorias", [])
                    if isinstance(cat_list, list) and cat_list:
                        cat_names = [str(c.get("nombre", "")) for c in cat_list if isinstance(c, dict) and c.get("nombre")]
                        if cat_names:
                            cat_name = " > ".join(cat_names).upper()
                            
                    cat_id = await TaxonomyEngine.categorize_product(db, "Syscom", cat_name, p.get("titulo", ""), all_internal_categories, map_dict)

                    # Precio y Costo (Syscom usa USD por defecto)
                    # Precios_lista (string), lo convertimos
                    precio_lista = p.get("precios", {}).get("precio_lista", "0")
                    precio_descuento = p.get("precios", {}).get("precio_descuento", "0")
                    
                    try:
                        precio = float(precio_lista)
                        costo = float(precio_descuento) # Usaremos el de descuento como costo proveedor
                    except:
                        precio = 0.0
                        costo = 0.0
                        
                    # Imágenes
                    main_img = p.get("img_portada")
                    
                    # Buscar producto
                    p_res = await db.execute(select(Product).where(Product.sku == sku))
                    product = p_res.scalars().first()
                    
                    if not product:
                        product = Product(
                            sku=sku,
                            name=p.get("titulo", ""),
                            slug=slugify(f"{sku}-{p.get('titulo', '')}")[:100], # Limitar longitud
                            short_description=p.get("descripcion", ""),
                            base_price=round(precio * 1.3, 2), # 30% de ganancia por defecto para auto-creados (antes del recálculo)
                            main_image_url=main_img,
                            brand_id=brand_obj.id if brand_obj else None,
                            category_id=cat_id
                        )
                        db.add(product)
                        await db.flush()
                    else:
                        # Si ya existe, podríamos solo actualizar si no tiene imagen, etc.
                        if not product.main_image_url and main_img:
                            product.main_image_url = main_img
                            
                        # Actualizar categoría si estaba huérfano y ahora encontramos una
                        if not product.category_id:
                            cat_id_fallback = await TaxonomyEngine.categorize_product(db, "Syscom", cat_name, product.name, all_internal_categories, map_dict)
                            if cat_id_fallback:
                                product.category_id = cat_id_fallback
                                
                    # Actualizar Stock
                    # Syscom no siempre da el stock total en el listado base, o da un booleano. 
                    # Supongamos que si lo devuelve es > 0 o hay que hacer /existencia
                    # Por simplicidad de MVP asumiendo que el Endpoint trae "existencia" (generalmente Syscom exige llamadas extras para stock real, pero lo simulamos aquí si está)
                    existencia = p.get("existencia", {}).get("nuevo", 0) if isinstance(p.get("existencia"), dict) else 0
                    
                    stock_res = await db.execute(
                        select(InventoryStock).where(
                            (InventoryStock.product_id == product.id) &
                            (InventoryStock.warehouse_id == syscom_warehouse.id)
                        )
                    )
                    stock_entry = stock_res.scalars().first()
                    
                    if stock_entry:
                        stock_entry.quantity = existencia
                        stock_entry.supplier_cost = costo
                    else:
                        new_stock = InventoryStock(
                            product_id=product.id,
                            warehouse_id=syscom_warehouse.id,
                            quantity=existencia,
                            supplier_cost=costo
                        )
                        db.add(new_stock)
                        
                    updated += 1
                    processed_product_ids.add(product.id)
                    
                await db.commit()
                page += 1
                
                # LIMITADOR TEMPORAL PARA DESARROLLO (Para no consumir toda la cuota)
                if page > 5:
                    break
                    
            except Exception as e:
                if log_func: log_func(100, f"Error en Syscom: {str(e)}")
                break
                
        # --- MOTOR DE PRECIOS: Recalcular precios de los productos modificados ---
        if log_func: log_func(95, "Recalculando precios públicos con el motor inteligente...")
        for pid in processed_product_ids:
            await recalculate_product_price(pid, db)
        await db.commit()
                
        if log_func: log_func(100, f"¡Sincronización Syscom finalizada! {updated} productos procesados.")
        return updated
