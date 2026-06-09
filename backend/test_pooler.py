import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_conn(url):
    print("Conectando a:", url)
    # Para poolers (como pgBouncer en Transaction Mode), desactivamos el statement cache
    engine = create_async_engine(url, connect_args={"statement_cache_size": 0})
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text('SELECT 1'))
            for r in res:
                print("Resultado exitoso:", r)
            return True
    except Exception as e:
        print("Error de conexión:", e)
        return False

async def main():
    print("--- Probando puerto 6543 (Transaction Mode) ---")
    url_6543 = 'postgresql+asyncpg://postgres.exejsyryljnmakatrprx:OoNPvwoLGDdTD9s9@aws-0-us-west-1.pooler.supabase.com:6543/postgres'
    await test_conn(url_6543)

    print("\n--- Probando puerto 5432 (Session Mode) ---")
    url_5432 = 'postgresql+asyncpg://postgres.exejsyryljnmakatrprx:OoNPvwoLGDdTD9s9@aws-0-us-west-1.pooler.supabase.com:5432/postgres'
    await test_conn(url_5432)

asyncio.run(main())
