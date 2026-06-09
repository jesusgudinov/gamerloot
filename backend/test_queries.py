import asyncio
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from sqlalchemy import select, func, cast, Date, desc
from app.models.sales import Order, OrderItem
from app.models.product import Product, Category, Brand

async def main():
    async with SessionLocal() as db:
        print("Testing DB connection...")

asyncio.run(main())
