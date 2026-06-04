import asyncio
import sys

# Configure path so we can import app
sys.path.append(".")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    endpoints = [
        "/api/v1/sales/stats",
        "/api/v1/products/stats",
        "/api/v1/marketing/dashboard"
    ]
    
    all_success = True
    for ep in endpoints:
        print(f"Testing {ep}...")
        try:
            response = client.get(ep)
            if response.status_code == 200:
                print(f"SUCCESS: {ep} returned 200")
                print("Data:", response.json())
            else:
                print(f"FAILED: {ep} returned {response.status_code}")
                print("Error:", response.text)
                all_success = False
        except Exception as e:
            print(f"ERROR calling {ep}: {e}")
            all_success = False
            
    if all_success:
        print("\nAll endpoints tested successfully.")
    else:
        print("\nSome endpoints failed.")

if __name__ == "__main__":
    test_endpoints()
