from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File
import os
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel
from slugify import slugify

from app.db.session import get_db, AsyncSessionLocal
from app.models.product import Product
from app.models.inventory import Warehouse, InventoryStock
from app.models.marketing import Campaign
from app.services.quantum import QuantumImportsClient
from app.core.config import settings

router = APIRouter()

# --- ESTADO GLOBAL EN MEMORIA ---
SYNC_STATUS = {
    "woocommerce": {"status": "idle", "progress": 0, "message": "Listo"},
    "quantum": {"status": "idle", "progress": 0, "message": "Listo"},
    "techsmart": {"status": "idle", "progress": 0, "message": "Listo"},
    "cva": {"status": "idle", "progress": 0, "message": "Listo"},
    "pch": {"status": "idle", "progress": 0, "message": "Listo"},
    "importacion_digital": {"status": "idle", "progress": 0, "message": "Listo"}
}

class SyncStatusUpdate(BaseModel):
    task: str
    status: str
    progress: int
    message: str

@router.get("/status")
async def get_sync_status():
    return SYNC_STATUS

@router.post("/status/update")
async def update_sync_status(update: SyncStatusUpdate):
    if update.task in SYNC_STATUS:
        SYNC_STATUS[update.task] = {
            "status": update.status,
            "progress": update.progress,
            "message": update.message
        }
    return {"success": True}

async def run_quantum_sync():
    async with AsyncSessionLocal() as db:
        await _run_quantum_sync(db)

async def _run_quantum_sync(db: AsyncSession):
    SYNC_STATUS["quantum"] = {"status": "running", "progress": 10, "message": "Conectando a API..."}
    # 1. Traer datos de Quantum Imports
    client = QuantumImportsClient(settings.QUANTUM_API_KEY, settings.QUANTUM_API_SECRET)
    quantum_products = await client.get_products()
    
    if not quantum_products:
        print("❌ No se obtuvieron productos de Quantum.")
        return
        
    print(f"🚀 Iniciando cruce de {len(quantum_products)} productos de Quantum Imports...")
    
    # 2. Buscar o crear la bodega de Quantum
    result = await db.execute(select(Warehouse).where(Warehouse.internal_code == "QICDMX"))
    quantum_warehouse = result.scalars().first()
    
    if not quantum_warehouse:
        quantum_warehouse = Warehouse(
            internal_code="QICDMX",
            name="Bodega Central Quantum",
            provider_name="Quantum Imports",
            city="CDMX",
            state="CDMX"
        )
        db.add(quantum_warehouse)
        await db.commit()
        await db.refresh(quantum_warehouse)
        
    # --- LIMPIEZA DE INVENTARIO FANTASMA ---
    from sqlalchemy import update
    await db.execute(update(InventoryStock).where(InventoryStock.warehouse_id == quantum_warehouse.id).values(quantity=0))
    await db.commit()
    
    updated_stock = 0
    processed_product_ids = set()
    
    # 3. Cruzar stock
    for i, qp in enumerate(quantum_products):
        sku = qp["sku"]
        # Buscamos si el producto existe en nuestro catálogo maestro
        prod_result = await db.execute(select(Product).where(Product.sku == sku))
        product = prod_result.scalars().first()
        
        if not product:
            continue # Si no está en el catálogo, lo ignoramos por ahora
            
        # Revisamos si ya existe la relación de inventario
        stock_result = await db.execute(
            select(InventoryStock)
            .where(InventoryStock.product_id == product.id)
            .where(InventoryStock.warehouse_id == quantum_warehouse.id)
        )
        stock_entry = stock_result.scalars().first()
        
        if stock_entry:
            stock_entry.quantity = qp["stock"]
            stock_entry.supplier_cost = qp["price"]
        else:
            new_stock = InventoryStock(
                product_id=product.id,
                warehouse_id=quantum_warehouse.id,
                quantity=qp["stock"],
                supplier_cost=qp["price"]
            )
            db.add(new_stock)
            
        updated_stock += 1
        processed_product_ids.add(product.id)
        if i % 50 == 0:
            SYNC_STATUS["quantum"] = {"status": "running", "progress": 10 + int((i/len(quantum_products))*90), "message": f"Cruzando producto {i} de {len(quantum_products)}..."}
        
    await db.commit()
    
    # --- MOTOR DE PRECIOS ---
    from app.core.pricing import recalculate_product_price
    SYNC_STATUS["quantum"]["message"] = "Recalculando precios públicos con el motor inteligente..."
    total_recalc = len(processed_product_ids)
    for idx, pid in enumerate(processed_product_ids):
        await recalculate_product_price(pid, db)
        if idx % 50 == 0:
            pct = 71 + int((idx/total_recalc)*28) if total_recalc > 0 else 99
            SYNC_STATUS["quantum"] = {"status": "running", "progress": pct, "message": f"Recalculando precio {idx}/{total_recalc}..."}
            await db.commit()
    await db.commit()
    
    SYNC_STATUS["quantum"] = {"status": "done", "progress": 100, "message": f"Sincronización finalizada. {updated_stock} productos actualizados."}
    print(f"✅ Sincronización finalizada. Stocks actualizados: {updated_stock}")

@router.post("/trigger/quantum")
async def trigger_quantum_sync(background_tasks: BackgroundTasks):
    """
    Desencadena la sincronización con Quantum Imports en segundo plano.
    """
    background_tasks.add_task(run_quantum_sync)
    return {"message": "Sincronización con Quantum Imports iniciada en segundo plano."}

async def run_techsmart_sync():
    async with AsyncSessionLocal() as db:
        await _run_techsmart_sync(db)

async def _run_techsmart_sync(db: AsyncSession):
    from app.services.techsmart import TechSmartScraper
    
    SYNC_STATUS["techsmart"] = {"status": "running", "progress": 10, "message": "Iniciando scraper Playwright..."}
    scraper = TechSmartScraper()
    def update_techsmart_progress(progress_pct, msg):
        current = SYNC_STATUS["techsmart"]
        new_prog = progress_pct if progress_pct is not None else current["progress"]
        SYNC_STATUS["techsmart"] = {
            "status": "running",
            "progress": new_prog,
            "message": f"{msg}"
        }

    ts_products = await scraper.get_products(progress_callback=update_techsmart_progress)
    
    if not ts_products:
        SYNC_STATUS["techsmart"] = {"status": "error", "progress": 0, "message": "No se obtuvieron productos."}
        print("❌ No se obtuvieron productos de TechSmart.")
        return
        
    print(f"🚀 Iniciando cruce de {len(ts_products)} productos de TechSmart Scraper...")
    
    # 1. Buscar o crear las bodegas de TechSmart
    result_cdmx = await db.execute(select(Warehouse).where(Warehouse.internal_code == "TSCDMX"))
    ts_warehouse_cdmx = result_cdmx.scalars().first()
    
    if not ts_warehouse_cdmx:
        ts_warehouse_cdmx = Warehouse(
            internal_code="TSCDMX",
            name="Bodega TechSmart CDMX",
            provider_name="TechSmart",
            city="CDMX",
            state="CDMX"
        )
        db.add(ts_warehouse_cdmx)
        
    result_gdl = await db.execute(select(Warehouse).where(Warehouse.internal_code == "TSGDL"))
    ts_warehouse_gdl = result_gdl.scalars().first()
    
    if not ts_warehouse_gdl:
        ts_warehouse_gdl = Warehouse(
            internal_code="TSGDL",
            name="Bodega TechSmart GDL",
            provider_name="TechSmart",
            city="GDL",
            state="Jalisco"
        )
        db.add(ts_warehouse_gdl)
        
    await db.commit()
    await db.refresh(ts_warehouse_cdmx)
    await db.refresh(ts_warehouse_gdl)
        
    updated_stock = 0
    
    # 2. Cruzar stock y crear nuevos
    
    # --- MOTOR DE MAPEO DE CATEGORÍAS ---
    from app.services.taxonomy_engine import TaxonomyEngine
    from app.services.exchange import ExchangeService
    import httpx
    import os
    
    map_dict = await TaxonomyEngine.get_provider_map(db, "TechSmart")
    all_internal_categories = await TaxonomyEngine.get_all_categories_with_keywords(db)
    
    exchange_service = ExchangeService()
    usd_rate = await exchange_service.get_usd_to_mxn(db)
    # -------------------------------------

    # --- LIMPIEZA DE INVENTARIO FANTASMA ---
    from sqlalchemy import update
    await db.execute(update(InventoryStock).where(InventoryStock.warehouse_id.in_([ts_warehouse_cdmx.id, ts_warehouse_gdl.id])).values(quantity=0))
    await db.commit()
    
    processed_product_ids = set()
    
    # Directorio para imágenes locales
    media_dir = os.path.join("media", "products", "techsmart")
    os.makedirs(media_dir, exist_ok=True)

    async with httpx.AsyncClient() as http_client:
        for i, tsp in enumerate(ts_products):
            sku = tsp["sku"]
            prod_result = await db.execute(select(Product).where(Product.sku == sku))
            product = prod_result.scalars().first()
            
            # 1. Moneda y Costo Proveedor
            rate = usd_rate if tsp.get("currency", "MXN") == "USD" else 1.0
            
            # original_price es el precio sin descuento
            # promo_price es el precio con descuento (si no hay descuento, promo_price = original_price)
            orig_cost_usd = tsp.get("original_price", 0)
            promo_cost_usd = tsp.get("promo_price", 0)
            if promo_cost_usd <= 0:
                promo_cost_usd = orig_cost_usd
                
            orig_cost_mxn = orig_cost_usd * rate
            promo_cost_mxn = promo_cost_usd * rate
            
            # El costo real para nosotros es el promo_cost
            actual_supplier_cost = promo_cost_mxn
            
            # Precio al público del "precio original" (para mostrar rebaja)
            # IVA 16% y Utilidad 30%
            from app.core.pricing import marketing_round
            public_original = marketing_round(orig_cost_mxn * 1.16 * 1.30)
            
            if not product:
                # AUTO-CREACIÓN DE PRODUCTO
                product_name = tsp.get("name", "").strip()
                if not product_name:
                    product_name = f"Producto TechSmart {sku}"
                    
                slug = slugify(f"{sku}-{product_name}")[:100]
                cat_id = await TaxonomyEngine.categorize_product(db, "TechSmart", "", product_name, all_internal_categories, map_dict)
                
                product = Product(
                    sku=sku,
                    name=product_name,
                    slug=slug,
                    short_description=product_name,
                    base_price=round(public_original, 2),
                    category_id=cat_id,
                    status="PUBLISHED"
                )
                db.add(product)
                await db.flush()
            else:
                # Actualizar el base_price al precio original calculado, 
                # así cuando recalculate_product_price corra y vea un costo menor (promo), lo asignará a discount_price
                product.base_price = round(public_original, 2)
                
                # Si el producto existe pero no tiene categoría, intentar inferirla por título
                if not product.category_id:
                    cat_id = await TaxonomyEngine.categorize_product(db, "TechSmart", "", product.name, all_internal_categories, map_dict)
                    if cat_id:
                        product.category_id = cat_id
            
            # 2. Descargar Imagen si existe y no la hemos guardado en nuestro bucket local
            image_url = tsp.get("image_url")
            if image_url:
                # Descargamos si no hay imagen asignada, o si la imagen asignada es un link externo (no empieza con nuestro bucket)
                if not product.main_image_url or not product.main_image_url.startswith(f"/{media_dir}"):
                    try:
                        ext = image_url.split('.')[-1].lower()
                        if ext not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
                            ext = 'jpg'
                        
                        filename = f"{product.sku}.{ext}"
                        filepath = os.path.join(media_dir, filename)
                        
                        if not os.path.exists(filepath):
                            img_resp = await http_client.get(image_url, timeout=10.0)
                            if img_resp.status_code == 200:
                                with open(filepath, 'wb') as out_file:
                                    out_file.write(img_resp.content)
                                    
                        # Guardamos la ruta relativa para servir estáticamente
                        product.main_image_url = f"/{media_dir}/{filename}"
                    except Exception as e:
                        print(f"Error descargando imagen para {sku}: {e}")
                        
            # Helper para actualizar stock
            async def update_or_create_stock(warehouse_id, quantity, cost):
                stock_result = await db.execute(
                    select(InventoryStock)
                    .where(InventoryStock.product_id == product.id)
                    .where(InventoryStock.warehouse_id == warehouse_id)
                )
                stock_entry = stock_result.scalars().first()
                
                if stock_entry:
                    stock_entry.quantity = quantity
                    stock_entry.supplier_cost = cost
                else:
                    new_stock = InventoryStock(
                        product_id=product.id,
                        warehouse_id=warehouse_id,
                        quantity=quantity,
                        supplier_cost=cost
                    )
                    db.add(new_stock)

            # Actualizamos ambas bodegas con el costo real MXN
            await update_or_create_stock(ts_warehouse_cdmx.id, tsp.get("stock_cdmx", 0), actual_supplier_cost)
            await update_or_create_stock(ts_warehouse_gdl.id, tsp.get("stock_gdl", 0), actual_supplier_cost)
                
            updated_stock += 1
            processed_product_ids.add(product.id)
            if i % 20 == 0:
                SYNC_STATUS["techsmart"] = {"status": "running", "progress": 20 + int((i/len(ts_products))*70), "message": f"Procesando {i} de {len(ts_products)}..."}
        
    await db.commit()
    
    # --- MOTOR DE PRECIOS ---
    from app.core.pricing import recalculate_product_price
    SYNC_STATUS["techsmart"]["message"] = "Recalculando precios públicos con el motor inteligente..."
    total_recalc = len(processed_product_ids)
    for idx, pid in enumerate(processed_product_ids):
        await recalculate_product_price(pid, db)
        if idx % 50 == 0:
            pct = 90 + int((idx/total_recalc)*9) if total_recalc > 0 else 99
            SYNC_STATUS["techsmart"] = {"status": "running", "progress": pct, "message": f"Recalculando precio {idx}/{total_recalc}..."}
            await db.commit()
    await db.commit()
    
    SYNC_STATUS["techsmart"] = {"status": "done", "progress": 100, "message": "Catálogo de TechSmart actualizado."}
    print(f"✅ Sincronización Scraper finalizada. Productos de TechSmart cruzados: {updated_stock}")

@router.post("/trigger/techsmart")
async def trigger_techsmart_sync(background_tasks: BackgroundTasks):
    """
    Desencadena el Scraper Asíncrono de TechSmart en segundo plano.
    """
    background_tasks.add_task(run_techsmart_sync)
    return {"message": "Motor de extracción TechSmart (Playwright) iniciado en segundo plano."}

async def run_woocommerce_sync():
    async with AsyncSessionLocal() as db:
        await _run_woocommerce_sync(db)

async def _run_woocommerce_sync(db: AsyncSession):
    from app.services.woocommerce_sync_service import WooCommerceSyncService
    
    SYNC_STATUS["woocommerce"] = {"status": "running", "progress": 5, "message": "Iniciando migración de WooCommerce..."}
    
    try:
        service = WooCommerceSyncService()
        
        def update_progress(progress_pct, msg):
            status = "done" if progress_pct >= 100 else "running"
            SYNC_STATUS["woocommerce"] = {"status": status, "progress": progress_pct, "message": msg}
            
        await service.run_sync(db, update_progress)
    except Exception as e:
        import traceback
        traceback.print_exc()
        SYNC_STATUS["woocommerce"] = {"status": "error", "progress": 0, "message": f"Error: {str(e)}"}

async def run_woocommerce_taxonomy_sync():
    async with AsyncSessionLocal() as db:
        await _run_woocommerce_taxonomy_sync(db)

async def _run_woocommerce_taxonomy_sync(db: AsyncSession):
    from app.services.woocommerce_taxonomy import WooCommerceTaxonomyService
    
    SYNC_STATUS["woocommerce_taxonomy"] = {"status": "running", "progress": 5, "message": "Conectando con WooCommerce API..."}
    
    try:
        service = WooCommerceTaxonomyService()
        
        def update_progress(progress_pct, msg):
            SYNC_STATUS["woocommerce_taxonomy"] = {
                "status": "running",
                "progress": progress_pct,
                "message": msg
            }
            
        await service.sync_categories(db, progress_callback=update_progress)
        await service.sync_attributes(db, progress_callback=update_progress)
        
        SYNC_STATUS["woocommerce_taxonomy"] = {
            "status": "done", 
            "progress": 100, 
            "message": "Taxonomías sincronizadas con éxito."
        }
    except Exception as e:
        SYNC_STATUS["woocommerce_taxonomy"] = {
            "status": "error", 
            "progress": 0, 
            "message": f"Error: {str(e)}"
        }

@router.post("/trigger/woocommerce")
async def trigger_woocommerce_sync(
    background_tasks: BackgroundTasks
):
    """
    Desencadena la migración maestra de WooCommerce en segundo plano.
    """
    SYNC_STATUS["woocommerce"] = {"status": "running", "progress": 5, "message": "Iniciando proceso en segundo plano..."}
    background_tasks.add_task(run_woocommerce_sync)
    return {"message": "Sincronización maestra de WooCommerce iniciada en segundo plano."}

@router.post("/trigger/woocommerce-taxonomy")
async def trigger_woocommerce_taxonomy_sync(
    background_tasks: BackgroundTasks
):
    """Sincroniza categorías y atributos globales desde WooCommerce."""
    SYNC_STATUS["woocommerce_taxonomy"] = {"status": "running", "progress": 5, "message": "Iniciando sincronización de taxonomías..."}
    background_tasks.add_task(run_woocommerce_taxonomy_sync)
    return {"message": "Sincronización de taxonomías iniciada en segundo plano."}

async def process_excel_bg(provider: str, file_path: str):
    async with AsyncSessionLocal() as db:
        await _process_excel_bg(provider, file_path, db)

async def _process_excel_bg(provider: str, file_path: str, db: AsyncSession):
    from app.services.exchange import ExchangeService
    exchange_service = ExchangeService()
    
    SYNC_STATUS[provider] = {"status": "running", "progress": 5, "message": f"Iniciando procesamiento de {provider}..."}
    
    try:
        def update_progress(pct, msg):
            SYNC_STATUS[provider] = {"status": "running", "progress": pct, "message": msg}
            
        if provider == "pch":
            from app.services.excel_parser import PCHExcelParser
            parser = PCHExcelParser(file_path)
        elif provider == "importacion_digital":
            from app.services.id_excel_parser import IDExcelParser
            parser = IDExcelParser(file_path)
        elif provider == "cva":
            from app.services.cva_excel_parser import CVAExcelParser
            parser = CVAExcelParser(file_path)
        else:
            raise ValueError(f"Proveedor no soportado: {provider}")
            
        updated = await parser.parse_and_sync(db, exchange_service=exchange_service, log_func=update_progress)
        
        SYNC_STATUS[provider] = {"status": "done", "progress": 100, "message": f"Lista de {provider.upper()} cargada. {updated} cruzados."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        SYNC_STATUS[provider] = {"status": "error", "progress": 0, "message": f"Error: {str(e)}"}
    finally:
        import os
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/upload/{provider}")
async def upload_excel(
    provider: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Sube y procesa una lista de precios en Excel para un proveedor específico.
    Soporta: pch, importacion_digital, cva
    """
    valid_providers = ["pch", "importacion_digital", "cva"]
    if provider not in valid_providers:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Proveedor inválido.")
        
    import os
    import tempfile
    
    # Check extension
    ext = os.path.splitext(file.filename)[1].lower()
    if provider == "cva" and ext not in [".xls", ".xlsx"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="El archivo de CVA debe ser .xls o .xlsx")
    elif provider != "cva" and ext not in [".csv", ".xlsx"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="El archivo debe ser .csv o .xlsx")
        
    try:
        suffix = ext if ext else ".xlsx"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
            
        background_tasks.add_task(process_excel_bg, provider, tmp_path)
        return {"message": f"Archivo cargado. Iniciando sincronización de {provider} en segundo plano."}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
