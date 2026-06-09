import asyncio
from app.db.session import engine, AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_superuser():
    async with AsyncSessionLocal() as session:
        # Verificar si el usuario ya existe
        stmt = select(User).where(User.email == "jesus@gamerloot.com.mx")
        result = await session.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("El superusuario ya existe. Actualizando contraseña...")
            existing_user.hashed_password = get_password_hash("kP9#vX2$mL!wQ7*zB5&t")
            existing_user.is_superuser = True
            existing_user.is_active = True
        else:
            print("Creando superusuario jesus@gamerloot.com.mx...")
            new_user = User(
                email="jesus@gamerloot.com.mx",
                hashed_password=get_password_hash("kP9#vX2$mL!wQ7*zB5&t"),
                full_name="Jesús",
                is_active=True,
                is_superuser=True
            )
            session.add(new_user)
            
        await session.commit()
        print("¡Superusuario creado/actualizado correctamente!")

if __name__ == "__main__":
    asyncio.run(create_superuser())
