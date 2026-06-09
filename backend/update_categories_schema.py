import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def run():
    engine = create_async_engine('postgresql+asyncpg://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    async with engine.connect() as conn:
        # 1. Create missing attributes
        missing_attrs = [
            "Ranuras de Memoria RAM",
            "Soporte de radiador"
        ]
        
        for attr in missing_attrs:
            res = await conn.execute(text("SELECT id FROM product_attributes WHERE name = :n"), {"n": attr})
            if not res.fetchone():
                await conn.execute(text("INSERT INTO product_attributes (name, is_filterable, is_for_configurator, is_connector) VALUES (:n, true, true, false)"), {"n": attr})
                print(f"Created attribute: {attr}")
        
        # 2. Add to categories
        updates = {
            "tarjetas-madre": ["Ranuras de Memoria RAM"],
            "tarjetas-de-video": ["Largo GPU (mm)"],
            "gabinetes": ["Espacio Max GPU (mm)", "Espacio Max Disipador (mm)", "Soporte de radiador"],
            "disipadores": ["Altura del Disipador (mm)"]
        }
        
        for slug, new_attrs in updates.items():
            res = await conn.execute(text("SELECT id, attribute_schema FROM categories WHERE slug = :s"), {"s": slug})
            row = res.fetchone()
            if row:
                cat_id, schema_str = row
                schema = []
                if schema_str:
                    if isinstance(schema_str, str):
                        try:
                            schema = json.loads(schema_str)
                        except:
                            schema = schema_str
                    else:
                        schema = schema_str
                
                # add missing
                for na in new_attrs:
                    if na not in schema:
                        schema.append(na)
                
                await conn.execute(text("UPDATE categories SET attribute_schema = :sc WHERE id = :id"), {"sc": json.dumps(schema), "id": cat_id})
                print(f"Updated {slug} with {new_attrs}")
                
        await conn.commit()

asyncio.run(run())
