import os
import httpx
from typing import List, Dict, Any

class SkydropxService:
    def __init__(self):
        self.api_key = os.getenv("SKYDROPX_API_KEY")
        # Skydropx V2 API URL
        self.base_url = "https://api.skydropx.com/v2"

    async def get_transit_time_cached(self, origin_zip: str, destination_zip: str, extra_days: int = 1) -> dict:
        """
        Consulta y cachea los días de tránsito usando Redis.
        Suma `extra_days` (por defecto 1, para PCs puede ser 3) al resultado base de Skydropx.
        """
        import json
        from app.core.redis_client import redis_client
        
        cache_key = f"eta:{origin_zip}:{destination_zip}"
        
        # Try Cache first
        if redis_client:
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    return {"days": int(cached) + extra_days}
            except Exception as e:
                print(f"Redis error: {e}")

        # Si no hay cache, llamamos a Skydropx con un paquete dummy
        dummy_parcel = {
            "weight": 1.0,
            "distance_unit": "CM",
            "mass_unit": "KG",
            "length": 10.0,
            "width": 10.0,
            "height": 10.0
        }
        
        rates = await self.get_rates_v2(origin_zip, destination_zip, dummy_parcel)
        
        if not rates:
            base_days = 3
        else:
            try:
                # Tomar la paquetería más rápida/barata
                base_days = min([int(r.get("days", 3)) for r in rates if r.get("days") is not None])
            except Exception:
                base_days = 3

        # Guardar en Redis (30 días de TTL)
        if redis_client:
            try:
                await redis_client.setex(cache_key, 60*60*24*30, str(base_days))
            except Exception as e:
                print(f"Redis error setting cache: {e}")

        return {"days": base_days + extra_days}

    async def get_rates_v2(self, origin_zip: str, destination_zip: str, parcel: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Llama a la API v2 de Skydropx para obtener tarifas.
        """
        if not self.api_key:
            # Fallback a MOCK si no hay llave
            return self._mock_rates(origin_zip, destination_zip, parcel)

        payload = {
            "quotation": {
                "address_from": {
                    "country_code": "MX",
                    "postal_code": str(origin_zip),
                    "area_level1": "Ciudad de México", # Valores por defecto para que la API no falle
                    "area_level2": "Cuauhtémoc"
                },
                "address_to": {
                    "country_code": "MX",
                    "postal_code": str(destination_zip),
                    "area_level1": "Destino",
                    "area_level2": "Destino"
                },
                "parcels": [parcel]
            }
        }

        headers = {
            "Authorization": f"Token token={self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.base_url}/quotations", json=payload, headers=headers)
                if response.status_code == 201 or response.status_code == 200:
                    data = response.json()
                    # Parse rates from v2 structure
                    rates = []
                    # Dependiendo de la estructura de V2, las tarifas pueden venir en 'data', etc.
                    # Asumimos que viene una lista bajo 'data' que tiene attributes
                    for rate_obj in data.get('data', []):
                        attrs = rate_obj.get('attributes', {})
                        rates.append({
                            "provider": attrs.get('carrier_name', 'Skydropx'),
                            "service_level_name": attrs.get('service_level_name', 'Standard'),
                            "service_level_code": attrs.get('service_level_code', 'STD'),
                            "amount_local": float(attrs.get('total_pricing', 150.0)),
                            "currency": attrs.get('currency', 'MXN'),
                            "days": attrs.get('delivery_days', 3)
                        })
                    return sorted(rates, key=lambda x: x["amount_local"])
                else:
                    print(f"Skydropx API Error: {response.text}")
                    return self._mock_rates(origin_zip, destination_zip, parcel)
            except Exception as e:
                print(f"Skydropx HTTP Error: {e}")
                return self._mock_rates(origin_zip, destination_zip, parcel)

    def _mock_rates(self, origin_zip: str, dest_zip: str, parcel: Dict[str, Any]) -> List[Dict[str, Any]]:
        # MOCK logic
        total_weight = parcel.get("weight", 1.0)
        is_local = origin_zip[:2] == dest_zip[:2]
        
        base_rate = 99.0 if is_local else 159.0
        weight_surcharge = max(0, total_weight - 1) * 15.0
        
        cost = base_rate + weight_surcharge
        return [
            {
                "provider": "Estafeta",
                "service_level_name": "Terrestre",
                "service_level_code": "EST_TER",
                "days": 3 if not is_local else 1,
                "amount_local": round(cost, 2),
                "currency": "MXN"
            },
            {
                "provider": "DHL",
                "service_level_name": "Express",
                "service_level_code": "DHL_EXP",
                "days": 1,
                "amount_local": round(cost + 120.0, 2),
                "currency": "MXN"
            }
        ]

    async def create_shipment(self, rate_id: str) -> Dict[str, Any]:
        return {
            "success": True,
            "data": {
                "attributes": {
                    "label_url": "https://example.com/dummy-label.pdf",
                    "tracking_number": "TRACK123456789"
                }
            }
        }
