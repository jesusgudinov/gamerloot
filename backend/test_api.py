import requests
import json

payload = {"category_slug": "tarjetas-madre", "selected_product_ids": [27544, 27409]}
r = requests.post("http://127.0.0.1:8000/api/v1/configurator/compatible-products", json=payload)
print(r.status_code)
print(json.dumps(r.json(), indent=2))
