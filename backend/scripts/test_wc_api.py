import asyncio
import httpx
import base64
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

async def main():
    url = os.getenv("WC_URL")
    key = os.getenv("WC_CONSUMER_KEY")
    secret = os.getenv("WC_CONSUMER_SECRET")
    
    if not url or not key or not secret:
        print("Missing credentials")
        return
        
    async with httpx.AsyncClient(auth=(key, secret)) as client:
        res = await client.get(f"{url}/wp-json/wc/v3/products?per_page=1")
        if res.status_code == 200:
            import json
            print(json.dumps(res.json(), indent=2))
        else:
            print(res.status_code, res.text)

asyncio.run(main())
