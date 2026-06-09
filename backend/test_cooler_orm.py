import asyncio
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.product import Product, ProductAttributeValue, ProductAttribute, Category

async def run():
    db = AsyncSessionLocal()
    try:
        # Find cooler
        stmt = select(Product).join(Category).where(
            Category.slug == 'disipadores',
            Product.name.ilike('%Hyper 212 Spectrum V3%')
        ).options(
            selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute)
        )
        res = await db.execute(stmt)
        coolers = res.scalars().all()
        for c in coolers:
            print(f"Cooler: {c.name} (ID: {c.id}) is_in_configurator={c.is_in_configurator} status={c.status}")
            attrs = {a.attribute.name.lower(): a.value.lower() for a in c.attribute_values if a.value}
            print("  Attrs:", attrs)

        # Let's also check an Intel processor with LGA 1700
        stmt2 = select(Product).join(Category).where(
            Category.slug == 'procesadores',
            Product.name.ilike('%12900%')
        ).options(
            selectinload(Product.attribute_values).selectinload(ProductAttributeValue.attribute)
        )
        res2 = await db.execute(stmt2)
        proc = res2.scalars().first()
        if proc:
            print(f"\nProcessor: {proc.name}")
            attrs2 = {a.attribute.name.lower(): a.value.lower() for a in proc.attribute_values if a.value}
            print("  Attrs:", attrs2)
    finally:
        await db.close()

asyncio.run(run())
