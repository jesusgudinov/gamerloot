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
