import asyncio
import os
import sys

# Añadir el directorio raíz al path para poder importar módulos de app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.role import Role, Permission, RolePermission
from app.models.user import User

PERMISSIONS = [
    {"name": "manage_settings", "description": "Acceso total a las configuraciones globales."},
    {"name": "manage_roles", "description": "Crear y editar roles de usuario."},
    {"name": "manage_users", "description": "Invitar y gestionar colaboradores."},
    {"name": "manage_catalog", "description": "Crear y editar productos, categorías y proveedores."},
    {"name": "view_catalog", "description": "Ver el catálogo de productos."},
    {"name": "manage_sales", "description": "Editar y gestionar pedidos de clientes."},
    {"name": "view_sales", "description": "Ver pedidos y cotizaciones."},
    {"name": "manage_shipping", "description": "Generar guías de envío y rastreo."},
    {"name": "view_shipping", "description": "Ver estado de envíos."},
    {"name": "manage_marketing", "description": "Crear cupones y banners."},
    {"name": "view_reports", "description": "Ver reportes financieros y de ventas."},
]

ROLES = {
    "Dueño": {
        "description": "Control total sobre la plataforma.",
        "permissions": [p["name"] for p in PERMISSIONS]
    },
    "Administrador": {
        "description": "Puede gestionar casi todo, excepto configurar nuevos roles o dueños.",
        "permissions": [p["name"] for p in PERMISSIONS if p["name"] not in ["manage_roles"]]
    },
    "Soporte": {
        "description": "Atención al cliente. Ve pedidos y catálogo, pero no edita productos ni ve finanzas.",
        "permissions": ["view_catalog", "view_sales", "view_shipping"]
    },
    "Marketing": {
        "description": "Encargado de promociones y cupones.",
        "permissions": ["view_catalog", "manage_marketing"]
    }
}

async def init_roles():
    print("Iniciando la siembra de Roles y Permisos...")
    async with AsyncSessionLocal() as session:
        # 1. Crear Permisos
        for p_data in PERMISSIONS:
            result = await session.execute(select(Permission).where(Permission.name == p_data["name"]))
            permission = result.scalars().first()
            if not permission:
                permission = Permission(name=p_data["name"], description=p_data["description"])
                session.add(permission)
                print(f"Permiso creado: {p_data['name']}")
        await session.commit()
        
        # Obtener todos los permisos para asignar
        result = await session.execute(select(Permission))
        db_permissions = {p.name: p for p in result.scalars().all()}
        
        # 2. Crear Roles y asociar permisos
        for role_name, role_data in ROLES.items():
            result = await session.execute(select(Role).where(Role.name == role_name))
            role = result.scalars().first()
            if not role:
                role = Role(name=role_name, description=role_data["description"])
                session.add(role)
                await session.flush() # Para tener el role.id
                print(f"Rol creado: {role_name}")
                
                for p_name in role_data["permissions"]:
                    if p_name in db_permissions:
                        rp = RolePermission(role_id=role.id, permission_id=db_permissions[p_name].id)
                        session.add(rp)
                
        await session.commit()
        print("Roles y Permisos inicializados correctamente.")
        
        # 3. Asignar el rol de "Dueño" a los usuarios SuperAdmin actuales
        result = await session.execute(select(Role).where(Role.name == "Dueño"))
        owner_role = result.scalars().first()
        
        if owner_role:
            users_result = await session.execute(select(User).where(User.is_superuser == True))
            superusers = users_result.scalars().all()
            for su in superusers:
                su.role_id = owner_role.id
                print(f"Asignado rol Dueño al superusuario {su.email}")
            await session.commit()
        
if __name__ == "__main__":
    asyncio.run(init_roles())
