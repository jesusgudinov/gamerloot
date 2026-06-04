import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.inventory import ExchangeRate

class ExchangeService:
    @staticmethod
    async def get_usd_to_mxn(db: AsyncSession) -> float:
        """
        Intenta obtener el tipo de cambio USD a MXN desde una API pública.
        Si falla, usa el último guardado en la base de datos.
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("https://api.exchangerate-api.com/v4/latest/USD")
                data = response.json()
                rate = data['rates']['MXN']
                
                # Guardar el último válido en la DB
                new_rate = ExchangeRate(currency_from="USD", currency_to="MXN", rate=rate)
                db.add(new_rate)
                await db.commit()
                return rate
        except Exception as e:
            print(f"⚠️ Error al obtener tipo de cambio en vivo: {e}. Buscando en BD...")
            
            # Buscar el último en la DB
            result = await db.execute(
                select(ExchangeRate)
                .where(ExchangeRate.currency_from == "USD")
                .where(ExchangeRate.currency_to == "MXN")
                .order_by(ExchangeRate.created_at.desc())
            )
            last_rate = result.scalars().first()
            if last_rate:
                return last_rate.rate
                
            return 18.0 # Fallback hardcodeado si la DB está vacía
