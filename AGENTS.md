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
