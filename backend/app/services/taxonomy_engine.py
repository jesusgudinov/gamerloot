from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.mapping import SupplierCategoryMap, UnmappedCategoryLog
from app.models.product import Category
import json
import re

class TaxonomyEngine:
    @staticmethod
    async def get_provider_map(db: AsyncSession, provider_name: str) -> dict[str, int]:
        """
        Obtiene el diccionario de mapeos para un proveedor.
        """
        result = await db.execute(select(SupplierCategoryMap).where(SupplierCategoryMap.provider_name == provider_name))
        existing_maps = result.scalars().all()
        return {m.provider_category_path: m.internal_category_id for m in existing_maps}

    @staticmethod
    async def categorize_product(
        db: AsyncSession,
        provider_name: str,
        cat_path: str,
        product_title: str,
        all_categories: list[Category],
        map_dict: dict[str, int]
    ) -> Optional[int]:
        """
        Intenta categorizar un producto usando 1) Mapeo exacto, 2) Palabras clave en título.
        Si ambos fallan y la categoría original no estaba vacía, se registra en UnmappedCategoryLog.
        """
        # 1. Intentar mapeo exacto
        if cat_path and cat_path in map_dict:
            return map_dict[cat_path]
            
        # 2. Intentar inferencia por título
        inferred_id = TaxonomyEngine.infer_category_from_title(product_title, all_categories)
        if inferred_id:
            return inferred_id
            
        # 3. Si todo falló, registrar como huérfana
        if cat_path and cat_path.strip():
            log_res = await db.execute(
                select(UnmappedCategoryLog)
                .where(UnmappedCategoryLog.provider_name == provider_name)
                .where(UnmappedCategoryLog.provider_category_path == cat_path)
            )
            if not log_res.scalars().first():
                new_log = UnmappedCategoryLog(
                    provider_name=provider_name,
                    provider_category_path=cat_path,
                    sample_product_name=product_title[:200] if product_title else ""
                )
                db.add(new_log)
                await db.commit()
                
        return None

    @staticmethod
    async def get_all_categories_with_keywords(db: AsyncSession) -> list[Category]:
        result = await db.execute(select(Category).where(Category.is_active == True))
        return list(result.scalars().all())
        
    @staticmethod
    def infer_category_from_title(title: str, categories: list[Category]) -> Optional[int]:
        """
        Busca coincidencias de palabras clave en el título.
        """
        if not title:
            return None
            
        title_lower = title.lower()
        
        for cat in categories:
            if cat.keywords:
                for kw in cat.keywords:
                    kw_lower = kw.lower()
                    # Buscar con bordes de palabra para evitar que "RAM" haga match en "PRAMA"
                    pattern = r'\b' + re.escape(kw_lower) + r'\b'
                    if re.search(pattern, title_lower):
                        return cat.id
        return None
