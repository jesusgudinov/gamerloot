import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres:OoNPvwoLGDdTD9s9@db.exejsyryljnmakatrprx.supabase.co:5432/postgres')
    
    # Cooler: 27409, Proc: 27528, Mobo: 27618
    async def get_attrs(pid):
        rels = await conn.fetch("SELECT attribute_value_id FROM product_attribute_associations WHERE product_id = $1", pid)
        attrs = []
        for r in rels:
            v = await conn.fetchrow("SELECT attribute_id, value FROM product_attribute_values WHERE id = $1", r['attribute_value_id'])
            a = await conn.fetchrow("SELECT name FROM product_attributes WHERE id = $1", v['attribute_id'])
            attrs.append((a['name'], v['value']))
        return attrs

    cooler_attrs = await get_attrs(27409)
    proc_attrs = await get_attrs(27528)
    mobo_attrs = await get_attrs(27618)

    ctx_attrs = {}
    for p_attrs_raw in [cooler_attrs, proc_attrs]:
        sp_attrs = {}
        for name, value in p_attrs_raw:
            if value:
                key = name.lower().strip()
                val = value.lower().strip()
                if key in sp_attrs:
                    existing = [v.strip() for v in sp_attrs[key].split('|')]
                    new_vals = [v.strip() for v in val.split('|')]
                    for nv in new_vals:
                        if nv not in existing:
                            sp_attrs[key] += f" | {nv}"
                else:
                    sp_attrs[key] = val
        
        for key, val in sp_attrs.items():
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

    p_attrs = {}
    for name, value in mobo_attrs:
        if value:
            key = name.lower().strip()
            val = value.lower().strip()
            if key in p_attrs:
                existing = [v.strip() for v in p_attrs[key].split('|')]
                new_vals = [v.strip() for v in val.split('|')]
                for nv in new_vals:
                    if nv not in existing:
                        p_attrs[key] += f" | {nv}"
            else:
                p_attrs[key] = val

    def intersects(val1: str, val2: str) -> bool:
        if not val1 or not val2:
            return True
        set1 = {v.strip().lower() for v in val1.split('|')}
        set2 = {v.strip().lower() for v in val2.split('|')}
        return len(set1.intersection(set2)) > 0

    print("\nMOBO EVAL:")
    if "socket" in ctx_attrs:
        if "socket" not in p_attrs or not intersects(ctx_attrs["socket"], p_attrs["socket"]):
            print("FAIL socket")
    if "factor de forma" in ctx_attrs:
        if "factor de forma" not in p_attrs or not intersects(ctx_attrs["factor de forma"], p_attrs["factor de forma"]):
            print("FAIL factor de forma")

    await conn.close()

asyncio.run(run())
