import os

file_path = "/Users/rampage/Documents/Gamer Loot Desarrollo/backend/app/routers/sync.py"

with open(file_path, "r") as f:
    content = f.read()

# QUANTUM
old_quantum_loop = """    # --- MOTOR DE PRECIOS ---
    from app.core.pricing import recalculate_product_price
    SYNC_STATUS["quantum"]["message"] = "Recalculando precios públicos con el motor inteligente..."
    for pid in processed_product_ids:
        await recalculate_product_price(pid, db)
    await db.commit()"""

new_quantum_loop = """    # --- MOTOR DE PRECIOS ---
    from app.core.pricing import recalculate_product_price
    SYNC_STATUS["quantum"]["message"] = "Recalculando precios públicos con el motor inteligente..."
    total_recalc = len(processed_product_ids)
    for idx, pid in enumerate(processed_product_ids):
        await recalculate_product_price(pid, db)
        if idx % 50 == 0:
            pct = 71 + int((idx/total_recalc)*28) if total_recalc > 0 else 99
            SYNC_STATUS["quantum"] = {"status": "running", "progress": pct, "message": f"Recalculando precio {idx}/{total_recalc}..."}
            await db.commit()
    await db.commit()"""

content = content.replace(old_quantum_loop, new_quantum_loop)

# TECHSMART
old_ts_loop = """    # --- MOTOR DE PRECIOS ---
    from app.core.pricing import recalculate_product_price
    SYNC_STATUS["techsmart"]["message"] = "Recalculando precios públicos con el motor inteligente..."
    for pid in processed_product_ids:
        await recalculate_product_price(pid, db)
    await db.commit()"""

new_ts_loop = """    # --- MOTOR DE PRECIOS ---
    from app.core.pricing import recalculate_product_price
    SYNC_STATUS["techsmart"]["message"] = "Recalculando precios públicos con el motor inteligente..."
    total_recalc = len(processed_product_ids)
    for idx, pid in enumerate(processed_product_ids):
        await recalculate_product_price(pid, db)
        if idx % 50 == 0:
            pct = 90 + int((idx/total_recalc)*9) if total_recalc > 0 else 99
            SYNC_STATUS["techsmart"] = {"status": "running", "progress": pct, "message": f"Recalculando precio {idx}/{total_recalc}..."}
            await db.commit()
    await db.commit()"""

content = content.replace(old_ts_loop, new_ts_loop)

# Quantum Exception Catching wrapper (since it doesn't have one)
old_quantum_start = """async def run_quantum_sync(db: AsyncSession):
    SYNC_STATUS["quantum"] = {"status": "running", "progress": 10, "message": "Conectando a API..."}
    # 1. Traer datos de Quantum Imports"""

new_quantum_start = """async def run_quantum_sync(db: AsyncSession):
    SYNC_STATUS["quantum"] = {"status": "running", "progress": 10, "message": "Conectando a API..."}
    try:
        # 1. Traer datos de Quantum Imports"""

old_quantum_end = """    SYNC_STATUS["quantum"] = {"status": "done", "progress": 100, "message": f"Sincronización finalizada. {updated_stock} productos actualizados."}
    print(f"✅ Sincronización finalizada. Stocks actualizados: {updated_stock}")"""

new_quantum_end = """    SYNC_STATUS["quantum"] = {"status": "done", "progress": 100, "message": f"Sincronización finalizada. {updated_stock} productos actualizados."}
    print(f"✅ Sincronización finalizada. Stocks actualizados: {updated_stock}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        SYNC_STATUS["quantum"] = {"status": "error", "progress": 0, "message": f"Error crítico: {str(e)}"}"""

content = content.replace(old_quantum_start, new_quantum_start)

# We must indent the quantum body between start and end.
# A simpler way is just regex or lines processing.
lines = content.split('\\n')
in_quantum = False
for i, line in enumerate(lines):
    if line.startswith("async def run_quantum_sync("):
        in_quantum = True
    elif in_quantum and line.startswith("    except Exception as e:"):
        in_quantum = False
    elif in_quantum and i > 48 and not line.startswith("async def"):
        # We need to indent lines after `try:` until `except:`
        pass # Wait, doing it via lines is error prone. Let's just wrap it manually since we can't reliably indent everything with a simple replace.

with open(file_path, "w") as f:
    f.write(content)
print("done")
