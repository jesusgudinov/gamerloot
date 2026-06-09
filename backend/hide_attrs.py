import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine('postgresql+asyncpg://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    async with engine.connect() as conn:
        attrs_to_hide = [
            "TDP",
            "Ranuras de Memoria RAM",
            "Largo GPU (mm)",
            "Espacio Max GPU (mm)",
            "Espacio Max Disipador (mm)",
            "Soporte de radiador",
            "Altura del Disipador (mm)"
        ]
        
        for attr in attrs_to_hide:
            await conn.execute(text("UPDATE product_attributes SET is_filterable = false, is_for_configurator = false WHERE name ILIKE :n"), {"n": f"%{attr}%"})
            print(f"Ocultado: {attr}")
                
        await conn.commit()

asyncio.run(run())
