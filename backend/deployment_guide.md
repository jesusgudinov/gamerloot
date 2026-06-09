# Guía de Despliegue y Configuración de Base de Datos - Gamer Loot

Esta guía explica cómo configurar y desplegar el ecosistema del backend de Gamer Loot en entornos de producción/hosting y cómo solucionar los problemas comunes de conectividad con Supabase.

---

## 1. Conexión a Base de Datos (Supabase)

### El problema con IPv6 (Direct Connection)
Por defecto, Supabase utiliza direcciones **IPv6** para las conexiones directas a la base de datos (`db.[project-id].supabase.co` en el puerto `5432`). 
Si el hosting en el que despliegas o tu red local de internet no tiene IPv6 activado, recibirás el error:
`socket.gaierror: [Errno 8] nodename nor servname provided, or not known`

### La solución: Usar el Connection Pooler (IPv4)
Para conectarse usando **IPv4**, debes activar y utilizar el **Connection Pooler** de Supabase, que expone un puerto IPv4 público en el puerto `6543`.

#### Pasos para activarlo en Supabase:
1. Ve al panel de **Supabase** ([https://supabase.com/dashboard](https://supabase.com/dashboard)).
2. Entra en **Project Settings** (icono de engrane abajo a la izquierda) y ve a **Database**.
3. Desplázate hacia abajo hasta la sección **Connection Pooling**.
4. Asegúrate de que el Pooling esté activado (toggled ON).
5. Copia la URI de conexión en modo **Transaction** o **Session** (se recomienda **Transaction** para producción).

#### Formato de la URL para el Pooler:
El nombre de usuario para el pooler debe incluir el ID del proyecto. El formato final de tu variable de entorno `DATABASE_URL` debe ser:
```env
DATABASE_URL="postgresql+asyncpg://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

*Nota: La aplicación detectará automáticamente si estás usando el puerto `6543` o un pooler en la URL y configurará `statement_cache_size=0` en SQLAlchemy para evitar conflictos con pgBouncer.*

---

## 2. Configuración de Variables de Entorno (`.env`)

Asegúrate de configurar las siguientes variables en el entorno de tu hosting o en tu archivo `.env` de producción:

```env
# Configuración del Entorno
ENVIRONMENT="production"      # O "development" para pruebas locales
PROJECT_NAME="Gamer Loot API"
VERSION="1.0.0"

# Base de Datos (Pooler de Supabase)
DATABASE_URL="postgresql+asyncpg://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Configuración del Pool de SQLAlchemy (Ajustable según el tráfico)
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_RECYCLE=1800

# Redis (Caché y sesiones)
REDIS_URL="rediss://default:[TOKEN]@worthy-bengal-127700.upstash.io:6379"

# WooCommerce API Migration (Credenciales de WooCommerce)
WC_URL="https://gamerloot.com.mx"
WC_CONSUMER_KEY="ck_..."
WC_CONSUMER_SECRET="cs_..."
```

---

## 3. Pruebas y Diagnóstico de Conexión

Hemos dejado un script llamado `test_pooler.py` en la raíz del backend para diagnosticar la conexión de forma directa. Puedes ejecutarlo con:

```bash
source venv/bin/activate
python test_pooler.py
```

El script intentará conectarse usando tanto el puerto `6543` como el `5432` del Pooler de Supabase y te indicará el resultado exacto o el error detallado de la conexión.
