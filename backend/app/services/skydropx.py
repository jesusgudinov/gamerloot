import httpx
from typing import List, Dict, Any

class SkydropxService:
    def __init__(self, api_key: str = ""):
        # Aquí se inyectaría la API Key de Producción o Sandbox
        self.api_key = api_key or "demo_key"
        self.base_url = "https://api.skydropx.com/v1"
        self.origin_zip = "45403" # Tonalá, Jalisco

    async def get_rates(self, request=None, origin_provider: str = "DEFAULT", origin_city: str = "CDMX") -> List[Dict[str, Any]]:
        # Mock logic for the admin shipping router
        return [
            {
                "provider": "FedEx",
                "service_level_name": "Standard",
                "service_level_code": "FEDEX_STD",
                "amount_local": 150.0,
                "currency": "MXN",
                "days": 3
            },
            {
                "provider": "DHL",
                "service_level_name": "Express",
                "service_level_code": "DHL_EXP",
                "amount_local": 250.0,
                "currency": "MXN",
                "days": 1
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

    async def quote_shipping(self, destination_zip: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Simula una cotización con Skydropx agrupando el peso/volumen de los items.
        """
        # Calcular peso total
        # En la BD tenemos 'weight', si no, asumimos 1kg por item por defecto
        total_weight = sum(item.get("weight", 1.0) * item.get("quantity", 1) for item in items)
        
        # MOCK de tarifas reales basadas en distancias/pesos comunes en México para el MVP
        # Si el CP de destino empieza con 4 (Jalisco), es local.
        is_local = destination_zip.startswith("4")
        
        base_rate = 99.0 if is_local else 159.0
        weight_surcharge = max(0, total_weight - 1) * 15.0 # $15 extra por cada kg adicional
        
        cost = base_rate + weight_surcharge
        
        return [
            {
                "provider": "Estafeta",
                "service_level_name": "Terrestre",
                "service_level_code": "EST_TER",
                "days": 3 if not is_local else 1,
                "amount_local": cost,
                "currency": "MXN"
            },
            {
                "provider": "DHL",
                "service_level_name": "Express",
                "service_level_code": "DHL_EXP",
                "days": 1,
                "amount_local": cost + 120.0,
                "currency": "MXN"
            }
        ]
