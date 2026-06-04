import asyncio
from app.db.session import AsyncSessionLocal
from app.schemas.client import ClientCreate, AddressCreate
from app.routers.clients import create_client

async def main():
    async with AsyncSessionLocal() as db:
        client_in = ClientCreate(
            email="test_err@example.com",
            first_name="Test",
            last_name="Test",
            password="test",
            address=AddressCreate(
                street="Test",
                exterior_number="123",
                neighborhood="Test",
                city="Test",
                state="CDMX",
                zip_code="12345"
            )
        )
        try:
            res = await create_client(client_in, db)
            print("Success:", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
