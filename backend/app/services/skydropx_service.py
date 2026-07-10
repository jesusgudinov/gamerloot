import aiohttp
from app.core.config import settings
import time

class SkydropxService:
    def __init__(self):
        self.client_id = settings.SKYDROPX_API_KEY
        self.client_secret = settings.SKYDROPX_API_SECRET
        
        # En producción sería pro.skydropx.com
        # Dado que estamos usando llaves de pruebas (Sandbox), usamos el entorno de Sandbox PRO
        self.base_url = "https://sb-pro.skydropx.com/api"
        
        self.access_token = None
        self.token_expires_at = 0

    async def _get_access_token(self) -> str:
        """Obtiene un token OAuth 2.0 si no existe o ya expiró."""
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token
            
        url = f"{self.base_url}/v1/oauth/token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    self.access_token = data.get("access_token")
                    expires_in = data.get("expires_in", 3600)
                    self.token_expires_at = time.time() + expires_in - 60 # Margen de 1 minuto
                    return self.access_token
                else:
                    error_text = await response.text()
                    print(f"Error autenticando con Skydropx OAuth: {error_text}")
                    return None

    async def _get_auth_headers(self):
        token = await self._get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    async def get_rates(self, origin_zip: str, dest_zip: str, parcel: dict):
        """
        Cotiza envíos usando la API V2 de Skydropx PRO (/v2/quotations).
        parcel dict: {"length": cm, "width": cm, "height": cm, "weight": kg}
        """
        headers = await self._get_auth_headers()
        if not headers.get("Authorization"):
            return self._fallback_rates()

        url = f"{self.base_url}/v2/quotations"
        payload = {
            "quotation": {
                "address_from": {
                    "country_code": "MX",
                    "postal_code": str(origin_zip),
                    "area_level1": "NA",
                    "area_level2": "NA",
                    "area_level3": "NA"
                },
                "address_to": {
                    "country_code": "MX",
                    "postal_code": str(dest_zip),
                    "area_level1": "NA",
                    "area_level2": "NA",
                    "area_level3": "NA"
                },
                "parcels": [
                    {
                        "weight": float(parcel.get("weight", 1.0)),
                        "height": float(parcel.get("height", 10.0)),
                        "width": float(parcel.get("width", 10.0)),
                        "length": float(parcel.get("length", 10.0))
                    }
                ]
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status not in (200, 201):
                    error_text = await response.text()
                    print(f"Skydropx V2 Rates Error: {error_text}")
                    return self._fallback_rates()
                
                data = await response.json()
                print(f"Skydropx Response: {data}")
                
                # En la V2 la respuesta viene con un arreglo "rates" dentro del JSON raíz
                if isinstance(data, dict):
                    rates_data = data.get("rates", data.get("included", data.get("data", data)))
                else:
                    rates_data = data

                if not isinstance(rates_data, list):
                    print(f"Skydropx error or unexpected format: {rates_data}")
                    return self._fallback_rates()

                rates = []
                # Skydropx V2 PRO returns an array of rates, directly or inside 'included'/'data'
                for rate in rates_data:
                    if not isinstance(rate, dict):
                        continue
                    attrs = rate.get("attributes", rate)
                    
                    provider = attrs.get("provider_display_name", attrs.get("provider_name", attrs.get("provider", "Desconocido")))
                    amount = float(attrs.get("total", attrs.get("amount_local", 0.0)))
                    if amount == 0.0:
                        continue
                        
                    days = int(attrs.get("days", 3))
                    rate_id = attrs.get("id") or rate.get("id", "")
                    
                    rates.append({
                        "provider": provider,
                        "amount_local": amount,
                        "days": days,
                        "rate_id": rate_id
                    })
                
                if not rates:
                    return self._fallback_rates()
                return rates

    def _fallback_rates(self):
        """Fallback de contingencia si las credenciales o API fallan."""
        return [
            {"provider": "FedEx (Contingencia)", "amount_local": 150.0, "days": 4, "rate_id": "fallback_fedex"},
            {"provider": "DHL Express (Contingencia)", "amount_local": 290.0, "days": 1, "rate_id": "fallback_dhl"}
        ]

    async def create_shipment(self, order_id: str, address_from: dict, address_to: dict, parcels: list, rate_id: str = None):
        """
        Crea una guía usando la API V2 PRO de Skydropx.
        """
        headers = await self._get_auth_headers()
        if not headers.get("Authorization"):
            return {"success": False, "detail": "Error de autenticación con Skydropx OAuth."}

        url = f"{self.base_url}/v2/shipments"
        
        # Adaptar parcels a packages para V2
        packages = []
        for idx, p in enumerate(parcels):
            packages.append({
                "package_number": str(idx + 1),
                "package_protected": False,
                "weight": float(p.get("weight", 1.0)),
                "length": float(p.get("length", 10.0)),
                "width": float(p.get("width", 10.0)),
                "height": float(p.get("height", 10.0))
            })

        payload = {
            "shipment": {
                "reference": str(order_id),
                "address_from": {
                    "province": address_from.get("province", "Jalisco"),
                    "city": address_from.get("city", "Guadalajara"),
                    "name": address_from.get("name", "Gamer Loot"),
                    "zip": address_from.get("zip", "45403"),
                    "country": address_from.get("country", "MX"),
                    "address1": address_from.get("street1", "Centro"),
                    "company": address_from.get("company", "Gamer Loot"),
                    "address2": address_from.get("street2", ""),
                    "phone": address_from.get("phone", "5555555555"),
                    "email": address_from.get("email", "contacto@gamerloot.com.mx")
                },
                "address_to": {
                    "province": address_to.get("province", "Ciudad de México"),
                    "city": address_to.get("city", "Cuauhtémoc"),
                    "name": address_to.get("name", "Cliente"),
                    "zip": address_to.get("zip", "06100"),
                    "country": address_to.get("country", "MX"),
                    "address1": address_to.get("street1", "Centro"),
                    "company": address_to.get("company", "Cliente"),
                    "address2": address_to.get("street2", ""),
                    "phone": address_to.get("phone", "5555555555"),
                    "email": address_to.get("email", "cliente@gamerloot.com.mx"),
                    "reference": address_to.get("reference", "")
                },
                "packages": packages
            }
        }
        
        if rate_id:
            payload["shipment"]["rate_id"] = rate_id
            
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, headers=headers) as response:
                if response.status not in (200, 201):
                    error_text = await response.text()
                    return {"success": False, "detail": f"Error Skydropx V2: {error_text}"}
                
                data = await response.json()
                return {"success": True, "data": data}
