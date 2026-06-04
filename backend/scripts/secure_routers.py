import os
import re

def secure_router_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Update imports
    if 'from app.api.deps import get_current_active_user' in content:
        content = content.replace(
            'from app.api.deps import get_current_active_user', 
            'from app.api.deps import get_current_active_user, require_permissions'
        )
    elif 'require_permissions' not in content:
        content = content.replace(
            'from fastapi import APIRouter', 
            'from fastapi import APIRouter\nfrom app.api.deps import require_permissions'
        )
        
    # Replace the dependency
    content = content.replace(
        'dependencies=[Depends(get_current_active_user)]',
        'dependencies=[Depends(require_permissions(["manage_catalog"]))]'
    )

    with open(file_path, 'w') as f:
        f.write(content)

base_dir = '/Users/rampage/Documents/Gamer Loot Desarrollo/backend/app/routers'
secure_router_file(os.path.join(base_dir, 'catalog.py'))
secure_router_file(os.path.join(base_dir, 'products.py'))

print("Archivos catalog.py y products.py actualizados a require_permissions exitosamente.")
