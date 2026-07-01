# Instrucciones para Agentes de IA

**Aviso Crítico de Infraestructura (Junio 2026)**:
Este proyecto ha sido migrado de una arquitectura en la nube (Supabase/Upstash) a una **arquitectura 100% nativa y local**. 

Por favor, como agente de IA trabajando en este repositorio, ten en cuenta las siguientes reglas estrictas:

1. **Base de Datos**: El proyecto utiliza **PostgreSQL local** (v15) corriendo de forma nativa en la Mac del usuario. NO intentes conectarte a Supabase, NO intentes buscar configuraciones de poolers (pgBouncer), y NO utilices el dashboard de Supabase para revisar esquemas. 
2. **Caché**: El proyecto utiliza **Redis local** corriendo de forma nativa. NO intentes conectarte a Upstash.
3. **Variables de Entorno**: Las variables de entorno de desarrollo (`.env`) apuntan a `localhost` (`postgresql+asyncpg://...` y `redis://...`). No modifiques esto para usar URLs remotas a menos que el usuario esté preparando un entorno de producción (ej. AWS RDS).
4. **Desarrollo**: Para revisar la base de datos, utiliza scripts locales o conéctate mediante `psql` (la base de datos se llama `gamerloot`).
5. **No uses Docker**: Las bases de datos están instaladas de forma nativa vía Homebrew. No busques ni intentes levantar contenedores de Docker u OrbStack para la persistencia de datos.

## Arquitectura de Diseño y UX/UI (Gamer Loot Premium)

Al crear o modificar interfaces en el frontend (Next.js), todos los agentes deben adherirse estrictamente a las siguientes directrices de diseño para mantener la calidad Premium "Epic Loot" del sitio:

1. **Estética General (Dark Mode Premium)**: El sitio es nativamente oscuro. Utiliza fondos oscuros con matices sutiles y elegantes (`#06070B`, `#0f172a`, `#1e1b4b`). No uses colores planos genéricos.
2. **Glassmorphism**: Aplica paneles estilo cristal esmerilado (`glass-panel`) en lugar de cajas sólidas. Utiliza fondos semi-transparentes (`background: rgba(255, 255, 255, 0.05)` o `rgba(0,0,0,0.2)`), bordes translúcidos (`border: 1px solid rgba(255,255,255,0.05)`) y filtros de desenfoque (`backdrop-filter: blur(16px)`). **Nota Crítica:** Si el componente será capturado con `html2canvas`, reemplaza el `backdrop-filter` por gradientes sólidos para evitar renderizados defectuosos.
3. **Tipografía y Textos Gradientes**: Para destacar elementos clave (como el precio o títulos importantes), usa texto con relleno de gradiente vibrante (ej. `background: linear-gradient(135deg, #a855f7, #6366f1); WebkitBackgroundClip: text; color: transparent`).
4. **Responsividad (Mobile-First Absoluta)**: Diseña asumiendo primero que el usuario está en un celular. Evita anchos fijos estrictos en favor de flexbox o grids que colapsen a una sola columna en pantallas pequeñas. Las interfaces nunca deben provocar scroll horizontal a menos que sea un carrusel intencional sin barra de desplazamiento (`scrollbar-width: none`).
5. **Micro-animaciones**: Los elementos interactivos (botones, tarjetas de productos) deben sentirse vivos. Emplea transiciones suaves (`transition: all 0.3s ease`). Aplica efectos como elevaciones sutiles (`transform: translateY(-2px)`) o cambios de sombra y brillo al hacer `:hover`.
6. **Iconografía**: Usa exclusiva y consistentemente la librería `lucide-react` para todos los íconos del sitio web. Acompaña las métricas o acciones con un ícono que ayude a la comprensión visual rápida (ej. `<Zap size={20} />` para consumo eléctrico).
7. **Colores de Acentuación**: Utiliza la siguiente paleta neón para comunicar estados:
   - Acciones Primarias / Branding: Púrpuras (`#8b5cf6`, `#a855f7`)
   - Éxito / Confirmar Compra: Verdes esmeralda (`#10b981`, `#059669`)
   - Precaución / Omitido: Amarillos/Naranjas (`#f59e0b`, `#eab308`)
   - Destructivo / Eliminar: Rojos (`#ef4444`)
8. **Estándar Visual (El Dashboard como Fuente de Verdad)**: El diseño implementado en el `AdminDashboard` (`/admin/page.tsx`) y `API e Integración` es el estándar definitivo del sitio. Cualquier vista nueva (incluyendo interfaces de usuario como Carrito o Checkout) debe emular exactamente esta estructura:
   - **Gradientes Radiales**: Los paneles grandes deben tener luces sutiles de fondo (ej. `background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)` con `filter: blur(30px)`) para añadir profundidad espacial.
   - **Líneas de Acentuación**: Los contenedores principales o formularios deben incluir una línea lateral izquierda de 4px con el color de la temática (`<div style={{ width: '4px', height: '100%', background: 'var(--primary)' }}></div>`).
   - **Íconos Enmarcados**: Los íconos de sección deben estar envueltos en un `div` con fondo translúcido (ej. `rgba(139,92,246,0.1)`), padding de 8px-10px y `border-radius: 10px-12px`.
   - **Interactividad**: Aplica siempre la clase `.hover-card` a cualquier panel, botón o tarjeta que sea interactivo para heredar la animación estándar de flotación y sombra difuminada.

## Arquitectura de Backend y Operaciones Masivas (Catálogo)

Al trabajar en los sistemas internos del catálogo (Scraping, Procesamiento, Imágenes), los agentes deben seguir estas directrices establecidas en implementaciones pasadas:

1. **Gestión de Medios (Imágenes locales)**: 
   - Nunca enlazar imágenes de productos directamente a los servidores de los proveedores originales (hotlinking). 
   - Las imágenes deben descargarse, alojarse localmente y ser servidas por FastAPI montando los directorios estáticos correspondientes (ej. `app.mount("/media", ...)`).
   - Las rutas en la BD deben ser relativas (ej. `/media/products/techsmart/imagen.webp`).

2. **Optimización de Imágenes (WebP)**:
   - Toda imagen de producto debe ser optimizada a formato `.webp` de 1000x1000 píxeles.
   - **Transparencia vs. Opacidad**: Si la imagen original (PNG) tiene canal alfa (transparente), el padding necesario para alcanzar los 1000x1000 debe hacerse con relleno transparente. Si es JPG u opaca, el fondo debe rellenarse de color blanco sólido.
   - Una vez optimizadas las imágenes a `.webp`, los archivos originales crudos (`.jpg`, `.png`) **deben eliminarse** del servidor para ahorrar almacenamiento.

3. **Operaciones Pesadas en Tiempo Real (Server-Sent Events)**:
   - Para tareas que procesen cientos de miles de registros (como la optimización masiva de imágenes o sincronizaciones largas), **nunca** uses un endpoint síncrono bloqueante (`POST` simple que tarde minutos en responder).
   - Se debe implementar `StreamingResponse` (Server-Sent Events) en el backend (con yield de JSONs).
   - En el frontend, se debe crear un **submódulo dedicado** para la tarea (ej. en el Sidebar) con una barra de progreso animada que consuma el stream, para mantener al usuario informado. **No** congeles interfaces genéricas con botones bloqueantes.

4. **Reglas de Precios y Web Scraping**:
   - Siempre mapear correctamente el tipo de moneda leyendo las etiquetas (ej. `USD` o `MXN`) de la fuente para hacer las conversiones necesarias (TC). No asumas MXN.
   - Si el sitio fuente tiene descuentos, extrae tanto el precio base como el precio de descuento para pasarlos a nuestro sistema.
   - **Regla de Redondeo (Precios Mercadológicos)**: Al calcular precios finales (con IVA, utilidad, etc.), el precio debe ajustarse a una terminación de marketing:
     - Si termina entre 0 y 4 (ej. `$554`), se redondea al `9` inferior (ej. `$549`).
     - Si termina entre 5 y 9 (ej. `$555`), se redondea al `9` superior (ej. `$559`).

5. **Códigos del SAT y Catálogos**: Las categorías en PostgreSQL (`categories`) DEBEN contener el campo `sat_code` con los códigos de producto/servicio reales del catálogo oficial del SAT. Nunca asumas códigos al azar y nunca envíes un 'SN' al tratar con APIs de paqueterías (ej. Mienvío), de lo contrario la integración logística rebotará los JSON con errores 422 de "Invalid payload".

## Logística y Envíos (Skydropx y Origen Unificado)

Al trabajar con el checkout y las cotizaciones de envío, se debe usar **Skydropx API V2** de forma exclusiva. Sigue esta lógica de "Envío Unificado":

1. **Evaluación de Origen**: Se debe revisar de qué bodega (`Warehouse`) sale cada producto en el carrito.
2. **Regla de Cotización**: 
   - Si **TODOS** los productos del carrito provienen de la **misma bodega**, se cotiza el envío asumiendo ese Código Postal como origen.
   - Si los productos provienen de **bodegas diferentes** (múltiples orígenes), se agrupan en una sola "caja virtual" (sumando pesos y maximizando/sumando dimensiones) y se cotiza el envío **ASUMIENDO QUE SALEN DE LA BODEGA GAMERLOOT (45403)**. Esto evita cobrarle al cliente envíos redundantes.
3. **API V2 Skydropx**: Se utiliza obligatoriamente la API V2 (`/v2/quotations`) de Skydropx.
4. **Tarifa Consolidada**: El usuario solo verá 2 opciones: "Estándar" (la más barata) y "Express" (la más rápida).
5. **Trazabilidad Interna**: Aunque el envío se genere consolidado desde Gamerloot hacia el cliente final, internamente (`Order.items` y correos administrativos) DEBES preservar el origen real de cada pieza para que Compras sepa a qué proveedor solicitarlas.

## Interacciones y Contenido Generado por el Usuario (Reseñas y Q&A)

Al desarrollar módulos que interactúen con el contenido de los usuarios (como reseñas de productos), se debe seguir el siguiente estándar:

1. **Imágenes Locales de Reseñas**: Las imágenes que los clientes adjuntan a sus reseñas NO deben subirse a la nube (S3, Firebase). Al igual que los productos, deben alojarse en el disco local (`/media/reviews/`) y ser servidas estáticamente vía FastAPI para evitar costos externos.
2. **Sistema de Votos Anti-Spam (JSONB)**: Para la lógica de votos útiles (Mano arriba / Mano abajo) de las reseñas, se debe almacenar el registro en la columna `votes` (tipo `JSONB`) en PostgreSQL, mapeando el ID del usuario (`user_id`) con su voto (`up` o `down`). Esto previene duplicidad de votos y es extremadamente eficiente sin necesidad de crear tablas pivote adicionales.
3. **Autenticación en Paneles de Administración**: Las peticiones `fetch` que realicen acciones de moderación desde el dashboard (ej. responder o rechazar preguntas) DEBEN incluir explícitamente `credentials: 'include'` en sus cabeceras, de lo contrario las protecciones del backend rechazarán la petición al no identificar la cookie HttpOnly de la sesión `superuser`.

## Directrices para Agentes de Limpieza y Refactorización

Para los agentes encargados de purgar código, eliminar archivos de prueba y limpiar la estructura del proyecto, es CRÍTICO entender qué archivos y directorios son **vitales**. Una eliminación incorrecta puede destruir la arquitectura del frontend o backend.

### Directorios y Archivos Intocables (Backend)
- `backend/app/`: Contiene toda la lógica del servidor (routers, models, schemas, core). ¡NO ELIMINAR NINGÚN ARCHIVO AQUÍ!
- `backend/alembic/` y `backend/alembic.ini`: Esenciales para las migraciones de la base de datos PostgreSQL.
- `backend/venv/`: Entorno virtual principal (las librerías se manejan aquí, no debe ser borrado a menos que se regenere con `requirements.txt`).
- `backend/.env`: Configuración crítica de variables de entorno de acceso local.
- `backend/media/` y `backend/uploads/`: Contienen las imágenes optimizadas de los productos y los assets almacenados dinámicamente. **CRÍTICO: NO BORRAR NINGUNA IMAGEN NI DIRECTORIO DENTRO DE ESTAS RUTAS.**
- `backend/scripts/`: Scripts oficiales de mantenimiento o migración de datos.
- `backend/requirements.txt`: Lista de dependencias del servidor.

### Directorios y Archivos Intocables (Frontend)
- `frontend/src/app/`: Sistema de enrutamiento principal (App Router de Next.js). Incluye layouts, vistas (`page.tsx`) y rutas de la API (`route.ts`).
- `frontend/src/components/`: Componentes modulares y reutilizables de la interfaz.
- `frontend/src/context/`: Contextos globales de React (como `AuthContext.tsx`).
- `frontend/src/utils/` y `frontend/src/hooks/`: Utilidades críticas (ej. manejo de URLs de imágenes).
- `frontend/public/`: Assets estáticos nativos (íconos, manifest, imágenes estáticas base).
- **Archivos de Configuración Raíz**: `frontend/tailwind.config.ts`, `frontend/next.config.mjs`, `frontend/package.json`, `frontend/postcss.config.js`, `frontend/tsconfig.json`.

### ✅ ¿Qué SÍ PUEDES (y debes) limpiar de forma segura?

1. **Scripts de Prueba (Scratch Scripts)**:
   - Cualquier archivo suelto en `backend/` o en la raíz (archivos como `test_*.py`, `check_*.py`, `list_*.py`, `debug_*.py`, `demo_*.py`) que hayan sido generados como experimentos aislados.
   - Archivos con nombres como `test.json`, `mock_data.json` o `.md` aleatorios que no sean documentación formal.

2. **Bases de Datos Locales Obsoletas**:
   - Bases de datos SQLite (`*.sqlite`, `*.sqlite3`, `*.db` como `gamer_loot.db`, `app.db`) en el entorno de desarrollo y raíz. El sistema transicionó completamente a PostgreSQL local, por lo que estas son reliquias inútiles.

3. **Componentes Frontend Huérfanos**:
   - Archivos dentro de `frontend/src/components/` que hayan quedado completamente huérfanos o reemplazados por nuevas versiones (ej. si se creó `CardV2.tsx`, se puede purgar `Card.tsx`).
   - **Requisito crítico:** Tras una búsqueda exhaustiva (`grep`), debes comprobar matemáticamente que **NO están siendo importados ni utilizados** en ningún otro archivo de la aplicación antes de borrarlos.

4. **Archivos Basura y Logs**:
   - Archivos de logs pesados (ej. `backend.log`) pueden ser truncados si ocupan mucho espacio.
   - Archivos basura del SO como `.DS_Store`, `Thumbs.db`, etc.
   - Imágenes duplicadas en resoluciones no optimizadas si su versión `.webp` de 1000x1000px ya fue comprobada.

#### Directorios Autogenerados Críticos
- No intentes "limpiar" `frontend/node_modules/` o `frontend/.next/`. Aunque son autogenerados, borrarlos detendrá el servidor de desarrollo en curso.

#### Raíz del Proyecto / Contexto de IA
- `AGENTS.md`: ¡Este archivo! Es el cerebro de las reglas de los agentes. NUNCA lo elimines.

**Regla de Oro para el Agente de Limpieza:** Si tienes duda sobre un archivo en los directorios `app/` o `src/`, asume que es vital y PREGUNTA al usuario antes de ejecutar un comando `rm`. Nunca uses comandos de borrado masivo (`rm -rf *`) sin filtros estrictos.

## Arquitectura de Pagos (Stripe) y Webhooks

El sistema de Gamer Loot utiliza Stripe como pasarela principal para procesar pagos seguros y guardar métodos de pago para futuras compras (Bóveda de Tarjetas Segura). Todos los agentes deben seguir estas directrices al modificar o depurar el flujo de pagos:

1. **Flujo de Pago Asíncrono (PaymentIntents)**: El backend de FastAPI NUNCA procesa números de tarjetas directamente. El flujo siempre debe ser:
   - Frontend solicita crear una orden en `/place-order`.
   - Backend llama a `StripeService.create_payment_intent()` generando un `client_secret`.
   - Backend inyecta el `order_id` y `user_email` en la propiedad `metadata` del PaymentIntent.
   - Frontend usa el `client_secret` para montar el `<Elements>` de Stripe y capturar el pago.

2. **Webhooks como Única Fuente de Verdad**: El cambio de estado de una orden a "Pagado" o "Pago Declinado" DEBE hacerse EXCLUSIVAMENTE a través del endpoint `/api/v1/stripe/webhook`, nunca de manera síncrona en el frontend.
   - Si el webhook recibe `payment_intent.succeeded`, cambia el estado a `"Pagado"`.
   - Si recibe `payment_intent.payment_failed`, cambia el estado a `"Pago Declinado"` y almacena el motivo de rechazo en la columna `rejection_reason` de la base de datos leyendo la propiedad `event["data"]["object"]["last_payment_error"]["message"]`.

3. **Cálculo de Utilidad (Dropshipping)**: Debido a nuestro modelo de dropshipping, las consultas SQL de métricas (`get_sales_stats`) NUNCA deben usar directamente el total de ventas (`Order.total`) para calcular la Utilidad. Siempre se debe calcular a través de un `JOIN` asegurando restar el costo: `func.sum(OrderItem.total_price) - func.sum(OrderItem.total_cost)`. Esto previene duplicaciones por JOINs de múltiples productos.

4. **Entorno Local vs. Producción (Migración)**:
   - **Local**: Stripe no puede enviar webhooks a `http://localhost`. Para depurar pagos en tiempo real en desarrollo, es OBLIGATORIO correr el CLI de Stripe para hacer un túnel seguro (ej. `stripe listen --forward-to localhost:8000/api/v1/stripe/webhook`).
   - **Producción**: Al migrar a producción (`api.gamerloot.com.mx`), el webhook debe registrarse en el Dashboard de Stripe usando los eventos obligatorios: `payment_intent.succeeded` y `payment_intent.payment_failed` (y opcionalmente los de `customer.*` y `setup_intent.*` para la bóveda de tarjetas). Reemplaza siempre el `STRIPE_WEBHOOK_SECRET` de producción en el `.env` tras generar el endpoint.

## Arquitectura de Logística (Skydropx V2) y Webhooks

El sistema utiliza la API de Skydropx V2 para calcular cotizaciones síncronas, generar guías y rastrear envíos de manera automatizada. Al modificar la lógica de envíos, los agentes deben apegarse estrictamente a lo siguiente:

1. **Cotización Síncrona Consolidada**: La API de Skydropx permite realizar cotizaciones (`/v2/quotations`). El sistema debe consolidar las cotizaciones en una tarifa "Estándar" y otra "Express".
2. **Generación de Envíos (Shipments)**: El endpoint para generar la guía (`POST /v2/shipments`) usará la dirección de la bodega correspondiente o la dirección 45403 en caso de envíos múltiples consolidados.
3. **Webhooks de Rastreo (Skydropx)**: El backend escucha actualizaciones de estado en `/api/v1/webhooks/skydropx`. 
   - El webhook valida un token de seguridad: `lmfub4jzpMhkIgEWt7_XH_tcbo3ckRhhsFQhNgleyDk` (nombre `gamerloot_webhook`).
   - El webhook mapea los eventos (`created`, `transit`, `delivered`) para actualizar la columna `status` y el `label_url` de la tabla `Order` (y dentro del arreglo `shipments_data` JSONB).
4. **URL de Webhook en Producción**: Al migrar a producción o utilizar el entorno real, la URL a configurar en Skydropx es `https://api.gamerloot.com.mx/api/v1/webhooks/skydropx`.
5. **Notificaciones a Proveedores**: Al confirmar el pago, el sistema de Fulfillment genera la guía de envío para el cliente final y usa `EmailService.send_admin_supplier_email` para notificar al admin. El administrador será el responsable de solicitar la mercancía a los proveedores originales basándose en la metadata interna de la orden.
