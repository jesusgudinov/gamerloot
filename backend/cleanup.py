import asyncio
import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.user import User, UserAddress
from app.models.role import Role
from sqlalchemy import select, delete

async def cleanup():
    async with AsyncSessionLocal() as db:
        # Delete rampage@gamerloot.mx
        await db.execute(delete(User).where(User.email == 'admin@gamerloot.mx'))
        await db.execute(delete(User).where(User.email == 'rampage@gamerloot.mx'))
        
        # Select all users who are clients (not superusers, no role)
        result = await db.execute(select(User).where((User.is_superuser == False) & (User.role_id == None)))
        clients = result.scalars().all()
        
        # Delete clients EXCEPT rampage#68302
        for client in clients:
            if client.username != 'rampage#68302':
                print(f"Deleting client: {client.email} - {client.username}")
                await db.delete(client)
                
        await db.commit()
        print("Cleanup completed successfully.")

if __name__ == "__main__":
    asyncio.run(cleanup())
