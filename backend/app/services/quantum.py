import httpx
from typing import Dict, Any, List

class QuantumImportsClient:
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://api.quantum-imports.com/webhook/products"

    async def get_products(self) -> List[Dict[str, Any]]:
        """
        Obtiene la lista de productos y stock de Quantum Imports.
        """
        if not self.api_key or not self.api_secret:
            print("⚠️ Quantum API Credentials no configuradas.")
            return []
            
        headers = {
            "api_key": self.api_key,
            "api_secret": self.api_secret
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.base_url, headers=headers, timeout=20.0)
                response.raise_for_status()
                products_list = response.json()
                
                parsed_products = []
                for item in products_list:
                    sku = str(item.get("sku", ""))
                    if not sku:
                        continue
                        
                    price = float(item.get("price") or 0.0)
                    stock = int(item.get("quantity") or 0)
                    
                    parsed_products.append({
                        "sku": sku,
                        "name": item.get("name", ""),
                        "price": price,
                        "stock": stock,
                        "upc": str(item.get("barcode", "")),
                        "currency": "MXN",
                        "provider_name": "Quantum Imports",
                        "city": "Nacional", # Quantum maneja stock centralizado
                        "state": "Nacional"
                    })
                
                return parsed_products
            except Exception as e:
                print(f"❌ Error conectando a Quantum Imports: {e}")
                return []
