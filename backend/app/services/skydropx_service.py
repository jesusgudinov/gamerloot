import aiohttp
from app.core.config import settings

class SkydropxService:
    def __init__(self):
        self.api_key = settings.SKYDROPX_API_KEY
        self.base_url = "https://api.skydropx.com/v2"
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }

    async def get_rates(self, origin_zip: str, dest_zip: str, parcel: dict):
        """
        Cotiza envíos usando la API V2 de Skydropx (/v2/quotations).
        parcel dict: {"length": cm, "width": cm, "height": cm, "weight": kg}
        """
        url = f"{self.base_url}/quotations"
        payload = {
            "zip_from": origin_zip,
            "zip_to": dest_zip,
            "parcel": {
                "weight": parcel.get("weight", 1),
                "height": parcel.get("height", 10),
                "width": parcel.get("width", 10),
                "length": parcel.get("length", 10)
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=self.headers) as response:
                if response.status not in (200, 201):
                    error_text = await response.text()
                    print(f"Skydropx V2 Rates Error: {error_text}")
                    return []
                
                data = await response.json()
                
                # Dependiendo de la estructura exacta de V2, parseamos las tarifas
                # Asumiremos una estructura donde regresan un array o una lista de rates
                rates = []
                # El formato exacto depende de la API, pero típicamente Skydropx V2 regresa un array o dentro de 'data'
                # Supongamos que regresa una lista directa o 'included' con rates
                
                rates_data = data if isinstance(data, list) else data.get("data", [])
                
                for rate in rates_data:
                    # Adaptamos los campos al formato esperado por nuestro checkout
                    # En Skydropx V2, los montos suelen estar en attributes
                    attrs = rate if "provider" in rate else rate.get("attributes", {})
                    
                    provider = attrs.get("provider", attrs.get("carrier_name", "Desconocido"))
                    amount = float(attrs.get("amount_local", attrs.get("total_pricing", 0.0)))
                    days = int(attrs.get("days", attrs.get("delivery_time", 3)))
                    rate_id = rate.get("id") or attrs.get("id", "")
                    
                    rates.append({
                        "provider": provider,
                        "amount_local": amount,
                        "days": days,
                        "rate_id": rate_id
                    })
                
                return rates

    async def create_shipment(self, order_id: str, address_from: dict, address_to: dict, parcels: list, rate_id: str = None):
        """
        Crea una guía usando la API V2. 
        Mapeamos la dirección a la estructura de Skydropx V2.
        """
        url = f"{self.base_url}/shipments"
        
        payload = {
            "reference": str(order_id),
            "address_from": {
                "province": address_from.get("province"),
                "city": address_from.get("city"),
                "name": address_from.get("name"),
                "zip": address_from.get("zip"),
                "country": address_from.get("country", "MX"),
                "address1": address_from.get("street1"),
                "company": address_from.get("company"),
                "address2": address_from.get("street2"),
                "phone": address_from.get("phone"),
                "email": address_from.get("email")
            },
            "address_to": {
                "province": address_to.get("province"),
                "city": address_to.get("city"),
                "name": address_to.get("name"),
                "zip": address_to.get("zip"),
                "country": address_to.get("country", "MX"),
                "address1": address_to.get("street1"),
                "company": address_to.get("company"),
                "address2": address_to.get("street2"),
                "phone": address_to.get("phone"),
                "email": address_to.get("email"),
                "reference": address_to.get("reference")
            },
            "parcels": parcels
        }
        
        # En Skydropx V2 normalmente se puede enviar el rate_id directo en la creación del shipment o en la compra de la etiqueta
        if rate_id:
            payload["rate_id"] = rate_id
            # O alternativamente, Skydropx V2 usa 'consignment' si es envío directo.
            
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=self.headers) as response:
                if response.status not in (200, 201):
                    error_text = await response.text()
                    return {"success": False, "detail": f"Error Skydropx: {error_text}"}
                
                data = await response.json()
                return {"success": True, "data": data}
