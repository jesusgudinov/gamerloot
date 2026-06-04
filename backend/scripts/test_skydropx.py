import sys
import os
import asyncio

# Añadir el directorio raíz del backend al path para que funcionen los imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.skydropx import SkydropxClient
from app.schemas.shipping import ShippingQuoteRequest, AddressSchema, ParcelSchema

async def main():
    print("Testing Skydropx API integration...")
    client = SkydropxClient()
    
    # Destino en Monterrey
    address_to = AddressSchema(
        country_code="MX",
        postal_code="64000",
        area_level1="Nuevo León",
        area_level2="Monterrey",
        area_level3="Monterrey Centro",
        street1="Calle Falsa 123",
        company="Cliente",
        name="Juan Perez",
        phone="8180000000",
        email="juan@ejemplo.com",
        reference="Casa amarilla"
    )
    
    # Paquete de prueba
    parcels = [
        ParcelSchema(
            weight=2.5,
            length=25,
            width=25,
            height=25
        )
    ]
    
    req = ShippingQuoteRequest(
        address_to=address_to,
        parcels=parcels,
        requested_carriers=["fedex", "estafeta", "dhl", "redpack"]
    )
    
    print("Cotizando desde PCH CDMX...")
    rates = await client.get_rates(req, origin_provider="PCH", origin_city="CDMX")
    
    if rates:
        print(f"Obtenidas {len(rates)} tarifas:")
        for r in rates:
            print(f"- {r.provider} ({r.service_level_name}): ${r.amount_local} {r.currency} (Llega en {r.days} días)")
    else:
        print("No se obtuvieron tarifas o hubo un error.")

if __name__ == "__main__":
    asyncio.run(main())
