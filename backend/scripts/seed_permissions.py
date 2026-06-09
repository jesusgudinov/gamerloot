import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.role import Permission

PERMISSIONS = [
    {
        "name": "manage_catalog",
        "description": "Gestión completa de Productos, Categorías, Marcas y Reviews."
    },
    {
        "name": "manage_sales",
        "description": "Gestión de Ventas, Pedidos y devoluciones (RMA)."
    },
    {
        "name": "manage_clients",
        "description": "Administración del directorio de Clientes."
    },
    {
        "name": "manage_marketing",
        "description": "Gestión de Campañas, Cupones de descuento y Banners."
    },
    {
        "name": "manage_sync",
        "description": "Control del Motor de Sincronización API de proveedores."
    },
    {
        "name": "manage_shipping",
        "description": "Configuración Logística y de Envíos."
    },
    {
        "name": "manage_users",
        "description": "Administración de Empleados y Equipo."
    },
    {
        "name": "manage_roles",
        "description": "Asignación de Roles y Control de Accesos (RBAC)."
    },
    {
        "name": "view_dashboard",
        "description": "Acceso a la vista principal y estadísticas financieras."
    }
]

async def seed_permissions():
    async with AsyncSessionLocal() as session:
        print("Iniciando inyección de permisos en la base de datos...")
        
        for perm_data in PERMISSIONS:
            stmt = select(Permission).where(Permission.name == perm_data["name"])
            result = await session.execute(stmt)
            existing_perm = result.scalar_one_or_none()
            
            if not existing_perm:
                new_perm = Permission(
                    name=perm_data["name"],
                    description=perm_data["description"]
                )
                session.add(new_perm)
                print(f"✅ Permiso creado: {perm_data['name']}")
            else:
                existing_perm.description = perm_data["description"]
                print(f"🔄 Permiso actualizado: {perm_data['name']}")
                
        await session.commit()
        print("\n🚀 Todos los permisos han sido registrados correctamente.")

if __name__ == "__main__":
    asyncio.run(seed_permissions())
