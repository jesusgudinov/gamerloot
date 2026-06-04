import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def migrate_products():
    print("Iniciando migración de estado de productos...")
    async with AsyncSessionLocal() as session:
        try:
            # 1. Agregar columna status
            print("1. Añadiendo columna 'status'...")
            try:
                await session.execute(text("ALTER TABLE products ADD COLUMN status VARCHAR DEFAULT 'DRAFT';"))
                await session.commit()
            except Exception as e:
                print(f"La columna status ya podría existir: {e}")
                await session.rollback()

            # 2. Actualizar valores basados en is_active y main_image_url
            print("2. Migrando datos...")
            
            # A) Si estaba activo y tiene imagen -> PUBLISHED
            res_pub = await session.execute(text("UPDATE products SET status = 'PUBLISHED' WHERE is_active = true AND main_image_url IS NOT NULL AND main_image_url != '';"))
            
            # B) Si estaba activo pero NO tiene imagen -> DRAFT
            res_draft = await session.execute(text("UPDATE products SET status = 'DRAFT' WHERE is_active = true AND (main_image_url IS NULL OR main_image_url = '');"))
            
            # C) Si estaba inactivo -> ARCHIVED (o DRAFT, pero DRAFT es mejor para los inactivos genéricos, usemos ARCHIVED si queremos separarlos explícitamente, pero el usuario los llamaba inactivos. Lo pasaremos a DRAFT para que no se pierdan, o ARCHIVED).
            # Let's use DRAFT for inactive to keep it simple, or ARCHIVED. "Inactivo = Borrador" was one option. Let's make it ARCHIVED.
            res_arch = await session.execute(text("UPDATE products SET status = 'ARCHIVED' WHERE is_active = false;"))
            
            await session.commit()
            print(f"   -> Productos publicados: {res_pub.rowcount}")
            print(f"   -> Productos a borrador (sin imagen): {res_draft.rowcount}")
            print(f"   -> Productos archivados (eran inactivos): {res_arch.rowcount}")

            # 3. Eliminar la columna is_active
            print("3. Eliminando columna 'is_active'...")
            try:
                await session.execute(text("ALTER TABLE products DROP COLUMN is_active;"))
                await session.commit()
            except Exception as e:
                print(f"No se pudo eliminar is_active: {e}")
                await session.rollback()

            print("¡Migración completada exitosamente!")
        except Exception as e:
            print(f"Error general en migración: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(migrate_products())
