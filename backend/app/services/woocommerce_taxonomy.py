import os
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Category, ProductAttribute, ProductAttributeValue
from typing import Callable
from dotenv import load_dotenv

load_dotenv()

class WooCommerceTaxonomyService:
    def __init__(self):
        self.url = os.getenv("WC_URL")
        self.key = os.getenv("WC_CONSUMER_KEY")
        self.secret = os.getenv("WC_CONSUMER_SECRET")
        
        # Opcional: Para pruebas locales si no hay env vars
        if not self.url:
            print("⚠️ Advertencia: Credenciales WC no encontradas en env.")

    async def _fetch_paginated(self, endpoint: str):
        if not self.url:
            return []
            
        items = []
        page = 1
        
        async with httpx.AsyncClient(auth=(self.key, self.secret), timeout=30.0) as client:
            while True:
                response = await client.get(f"{self.url}/wp-json/wc/v3/{endpoint}", params={"per_page": 100, "page": page})
                if response.status_code != 200:
                    print(f"Error {response.status_code} fetching {endpoint}")
                    break
                    
                data = response.json()
                print(f"Fetching {endpoint} page {page}: got {len(data) if isinstance(data, list) else type(data)}")
                if not data:
                    break
                    
                if isinstance(data, list):
                    items.extend(data)
                else:
                    print("Data is not a list! Breaking loop.", data)
                    break
                    
                total_pages = int(response.headers.get("X-WP-TotalPages", 1))
                if page >= total_pages:
                    break
                    
                page += 1
                
        return items

    async def sync_categories(self, db: AsyncSession, progress_callback: Callable = None):
        if progress_callback: progress_callback(10, "Descargando categorías de WooCommerce...")
        
        categories_data = await self._fetch_paginated("products/categories")
        if not categories_data:
            if progress_callback: progress_callback(100, "No se encontraron categorías o faltan credenciales.")
            return 0
            
        if progress_callback: progress_callback(40, f"Procesando {len(categories_data)} categorías...")
        
        updated_count = 0
        for item in categories_data:
            # Buscar si ya existe
            result = await db.execute(select(Category).where(Category.slug == item['slug']))
            cat = result.scalars().first()
            
            if cat:
                cat.name = item['name']
                cat.description = item['description']
            else:
                cat = Category(
                    name=item['name'],
                    slug=item['slug'],
                    description=item['description']
                )
                db.add(cat)
            updated_count += 1
            
        await db.commit()
        if progress_callback: progress_callback(50, f"✅ {updated_count} categorías sincronizadas.")
        return updated_count

    async def sync_attributes(self, db: AsyncSession, progress_callback: Callable = None):
        if progress_callback: progress_callback(60, "Descargando atributos globales...")
        
        attributes_data = await self._fetch_paginated("products/attributes")
        if not attributes_data:
            if progress_callback: progress_callback(100, "No se encontraron atributos.")
            return 0
            
        if progress_callback: progress_callback(70, f"Sincronizando {len(attributes_data)} atributos y sus valores...")
        
        updated_count = 0
        for attr in attributes_data:
            result = await db.execute(select(ProductAttribute).where(ProductAttribute.slug == attr['slug']))
            pa = result.scalars().first()
            
            if not pa:
                pa = ProductAttribute(name=attr['name'], slug=attr['slug'])
                db.add(pa)
                await db.commit()
                await db.refresh(pa)
                
            # Ahora descargar los terms (valores) de este atributo
            terms_data = await self._fetch_paginated(f"products/attributes/{attr['id']}/terms")
            
            for term in terms_data:
                term_result = await db.execute(select(ProductAttributeValue).where(ProductAttributeValue.slug == term['slug']))
                pav = term_result.scalars().first()
                
                if not pav:
                    pav = ProductAttributeValue(
                        attribute_id=pa.id,
                        value=term['name'],
                        slug=term['slug']
                    )
                    db.add(pav)
            
            updated_count += 1
            
        await db.commit()
        if progress_callback: progress_callback(100, f"✅ {updated_count} atributos sincronizados completamente.")
        return updated_count
