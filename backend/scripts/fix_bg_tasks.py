import os

file_path = "/Users/rampage/Documents/Gamer Loot Desarrollo/backend/app/routers/sync.py"
with open(file_path, "r") as f:
    content = f.read()

# Add import if not exists
if "AsyncSessionLocal" not in content:
    content = content.replace(
        "from app.db.session import get_db",
        "from app.db.session import get_db, AsyncSessionLocal"
    )

# 1. quantum
content = content.replace("async def run_quantum_sync(db: AsyncSession):", "async def run_quantum_sync():\\n    async with AsyncSessionLocal() as db:")
# We need to indent everything inside run_quantum_sync by 4 spaces.
# It's easier to just do it via multi_replace_file_content but since we are replacing multiple things, regex or string processing is fine.
# Wait, indenting the whole function is tedious in string replacement. Let's do it via AST or just simple string replacing.
# Actually, I can just do:
# async def run_quantum_sync():
#     async with AsyncSessionLocal() as db:
#         await _run_quantum_sync(db)
# async def _run_quantum_sync(db: AsyncSession):
# This is MUCH easier and avoids indentation hell!

# 2. techsmart
# Same wrapper approach.

import re

# We will rename the original functions to start with `_` and create a wrapper with the original name.
wrappers = """
async def run_quantum_sync():
    async with AsyncSessionLocal() as db:
        await _run_quantum_sync(db)

async def _run_quantum_sync(db: AsyncSession):"""

content = content.replace("async def run_quantum_sync(db: AsyncSession):", wrappers)

wrappers_ts = """
async def run_techsmart_sync():
    async with AsyncSessionLocal() as db:
        await _run_techsmart_sync(db)

async def _run_techsmart_sync(db: AsyncSession):"""

content = content.replace("async def run_techsmart_sync(db: AsyncSession):", wrappers_ts)

wrappers_wc = """
async def run_woocommerce_sync():
    async with AsyncSessionLocal() as db:
        await _run_woocommerce_sync(db)

async def _run_woocommerce_sync(db: AsyncSession):"""

content = content.replace("async def run_woocommerce_sync(db: AsyncSession):", wrappers_wc)

wrappers_wc_tax = """
async def run_woocommerce_taxonomy_sync():
    async with AsyncSessionLocal() as db:
        await _run_woocommerce_taxonomy_sync(db)

async def _run_woocommerce_taxonomy_sync(db: AsyncSession):"""

content = content.replace("async def run_woocommerce_taxonomy_sync(db: AsyncSession):", wrappers_wc_tax)

wrappers_excel = """
async def process_excel_bg(provider: str, file_path: str):
    async with AsyncSessionLocal() as db:
        await _process_excel_bg(provider, file_path, db)

async def _process_excel_bg(provider: str, file_path: str, db: AsyncSession):"""

content = content.replace("async def process_excel_bg(provider: str, file_path: str, db: AsyncSession):", wrappers_excel)


# Now we fix the trigger endpoints
# quantum
content = content.replace("async def trigger_quantum_sync(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):\\n    \\"\\"\\"\\n    Desencadena la sincronización con Quantum Imports en segundo plano.\\n    \\"\\"\\"\\n    background_tasks.add_task(run_quantum_sync, db)",
"async def trigger_quantum_sync(background_tasks: BackgroundTasks):\\n    \\"\\"\\"\\n    Desencadena la sincronización con Quantum Imports en segundo plano.\\n    \\"\\"\\"\\n    background_tasks.add_task(run_quantum_sync)")

# techsmart
content = content.replace("async def trigger_techsmart_sync(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):\\n    \\"\\"\\"\\n    Desencadena la sincronización con TechSmart en segundo plano.\\n    \\"\\"\\"\\n    background_tasks.add_task(run_techsmart_sync, db)",
"async def trigger_techsmart_sync(background_tasks: BackgroundTasks):\\n    \\"\\"\\"\\n    Desencadena la sincronización con TechSmart en segundo plano.\\n    \\"\\"\\"\\n    background_tasks.add_task(run_techsmart_sync)")

# woocommerce
content = content.replace("async def trigger_woocommerce_sync(\\n    background_tasks: BackgroundTasks,\\n    db: AsyncSession = Depends(get_db)\\n):\\n    \\"\\"\\"\\n    Desencadena la migración maestra de WooCommerce en segundo plano.\\n    \\"\\"\\"\\n    SYNC_STATUS[\\"woocommerce\\"] = {\\"status\\": \\"running\\", \\"progress\\": 5, \\"message\\": \\"Iniciando proceso en segundo plano...\\"}\\n    background_tasks.add_task(run_woocommerce_sync, db)",
"async def trigger_woocommerce_sync(background_tasks: BackgroundTasks):\\n    \\"\\"\\"\\n    Desencadena la migración maestra de WooCommerce en segundo plano.\\n    \\"\\"\\"\\n    SYNC_STATUS[\\"woocommerce\\"] = {\\"status\\": \\"running\\", \\"progress\\": 5, \\"message\\": \\"Iniciando proceso en segundo plano...\\"}\\n    background_tasks.add_task(run_woocommerce_sync)")

# woocommerce taxonomy
content = content.replace("async def trigger_woocommerce_taxonomy_sync(\\n    background_tasks: BackgroundTasks,\\n    db: AsyncSession = Depends(get_db)\\n):\\n    \\"\\"\\"Sincroniza categorías y atributos globales desde WooCommerce.\\"\\"\\"\\n    SYNC_STATUS[\\"woocommerce_taxonomy\\"] = {\\"status\\": \\"running\\", \\"progress\\": 5, \\"message\\": \\"Iniciando sincronización de taxonomías...\\"}\\n    background_tasks.add_task(run_woocommerce_taxonomy_sync, db)",
"async def trigger_woocommerce_taxonomy_sync(background_tasks: BackgroundTasks):\\n    \\"\\"\\"Sincroniza categorías y atributos globales desde WooCommerce.\\"\\"\\"\\n    SYNC_STATUS[\\"woocommerce_taxonomy\\"] = {\\"status\\": \\"running\\", \\"progress\\": 5, \\"message\\": \\"Iniciando sincronización de taxonomías...\\"}\\n    background_tasks.add_task(run_woocommerce_taxonomy_sync)")

# excel
content = content.replace("background_tasks.add_task(process_excel_bg, provider, tmp_path, db)", "background_tasks.add_task(process_excel_bg, provider, tmp_path)")
content = content.replace("async def upload_excel(\\n    provider: str,\\n    background_tasks: BackgroundTasks,\\n    file: UploadFile = File(...),\\n    db: AsyncSession = Depends(get_db)\\n):",
"async def upload_excel(\\n    provider: str,\\n    background_tasks: BackgroundTasks,\\n    file: UploadFile = File(...)\\n):")

with open(file_path, "w") as f:
    f.write(content)

print("done")
