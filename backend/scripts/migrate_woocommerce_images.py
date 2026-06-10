import asyncio
import os
import uuid
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from urllib.parse import urlparse
import sys
import mimetypes

# Adjust path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.product import Product
from app.models.marketing import Campaign
from app.models.inventory import InventoryStock

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def download_image(url: str, client: httpx.AsyncClient) -> str:
    if not url or not url.startswith("http"):
        return url
    if "localhost" in url or "127.0.0.1" in url:
        return url
        
    try:
        response = await client.get(url, follow_redirects=True, timeout=30.0)
        response.raise_for_status()
        
        # Determine extension from URL or Content-Type
        parsed = urlparse(url)
        ext = os.path.splitext(parsed.path)[1].lower()
        if not ext:
            content_type = response.headers.get('content-type', '')
            ext = mimetypes.guess_extension(content_type) or '.jpg'
            
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
            
        return f"/uploads/images/{unique_filename}"
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return url

async def migrate_images():
    print(f"Starting image migration... Destination: {UPLOAD_DIR}")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Product))
        products = result.scalars().all()
        
        async with httpx.AsyncClient() as client:
            for product in products:
                updated = False
                print(f"Processing product ID: {product.id} - {product.name} (SKU: {product.sku})")
                
                # Migrate main_image_url
                if product.main_image_url and product.main_image_url.startswith("http") and "localhost" not in product.main_image_url:
                    print(f"  Downloading main image: {product.main_image_url}")
                    new_url = await download_image(product.main_image_url, client)
                    if new_url != product.main_image_url:
                        product.main_image_url = new_url
                        updated = True
                
                # Migrate image_gallery
                if product.image_gallery and isinstance(product.image_gallery, list):
                    new_gallery = []
                    for img_url in product.image_gallery:
                        if img_url and img_url.startswith("http") and "localhost" not in img_url:
                            print(f"  Downloading gallery image: {img_url}")
                            new_img_url = await download_image(img_url, client)
                            new_gallery.append(new_img_url)
                            if new_img_url != img_url:
                                updated = True
                        else:
                            new_gallery.append(img_url)
                    if updated:
                        product.image_gallery = new_gallery
                        
                if updated:
                    session.add(product)
                    await session.commit()
                    print(f"✅ Updated product {product.id} in DB.")

if __name__ == "__main__":
    asyncio.run(migrate_images())
    print("Migration finished!")
