import urllib.request
import json

data = json.dumps({"category_slug": "procesadores", "selected_product_ids": []}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/v1/configurator/compatible-products", data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode())
