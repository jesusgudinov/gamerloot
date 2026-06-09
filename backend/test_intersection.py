import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    # 1. Cooler: Hyper 212 Spectrum V3
    cooler = await conn.fetchrow("SELECT id FROM products WHERE name ILIKE '%Hyper 212 Spectrum V3%'")
    # 2. Proc: Ultra 7 265K
    proc = await conn.fetchrow("SELECT id FROM products WHERE name ILIKE '%Ultra 7 265K con%'")
    # 3. Mobo: NZXT N9 Z890 BLACK
    mobo = await conn.fetchrow("SELECT id FROM products WHERE name ILIKE '%NZXT N9 Z890 BLACK%'")

    async def get_attrs(pid):
        rels = await conn.fetch("SELECT attribute_value_id FROM product_attribute_associations WHERE product_id = $1", pid)
        attrs = []
        for r in rels:
            v = await conn.fetchrow("SELECT attribute_id, value FROM product_attribute_values WHERE id = $1", r['attribute_value_id'])
            a = await conn.fetchrow("SELECT name FROM product_attributes WHERE id = $1", v['attribute_id'])
            attrs.append((a['name'], v['value']))
        return attrs

    cooler_attrs = await get_attrs(cooler['id'])
    proc_attrs = await get_attrs(proc['id'])
    mobo_attrs = await get_attrs(mobo['id'])

    ctx_attrs = {}
    for p_attrs_raw in [cooler_attrs, proc_attrs]:
        for name, value in p_attrs_raw:
            if value:
                key = name.lower().strip()
                val = value.lower().strip()
                if key in ctx_attrs:
                    existing = {v.strip() for v in ctx_attrs[key].split('|')}
                    new_vals = {v.strip() for v in val.split('|')}
                    intersected = existing.intersection(new_vals)
                    if intersected:
                        ctx_attrs[key] = " | ".join(intersected)
                    else:
                        ctx_attrs[key] = ""
                else:
                    ctx_attrs[key] = val

    print("CTX ATTRS:")
    for k, v in ctx_attrs.items(): print(f"  {k}: {v}")

    m_attrs = {}
    for name, value in mobo_attrs:
        if value:
            key = name.lower().strip()
            val = value.lower().strip()
            if key in m_attrs:
                existing = [v.strip() for v in m_attrs[key].split('|')]
                new_vals = [v.strip() for v in val.split('|')]
                for nv in new_vals:
                    if nv not in existing:
                        m_attrs[key] += f" | {nv}"
            else:
                m_attrs[key] = val

    print("\nMOBO ATTRS:")
    for k, v in m_attrs.items(): print(f"  {k}: {v}")

    await conn.close()

asyncio.run(run())
