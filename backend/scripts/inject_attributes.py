import asyncio
import asyncpg
import json
import re

json_data = """{
  "💻 Computadoras": {
    "Desktops": [
      "Tipo de computadora",
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema operativo",
      "Iluminación"
    ],
    "Laptops": [
      "Tipo de laptop",
      "Tamaño de pantalla",
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema operativo",
      "Iluminación",
      "Color"
    ],
    "Servidores": [
      "Tipo de servidor",
      "Familia de procesador",
      "Memoria RAM",
      "Capacidad"
    ],
    "Workstations": [
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema operativo"
    ],
    "Tablets": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Memoria RAM",
      "Capacidad",
      "Color"
    ]
  },
  "🖥️ Componentes": {
    "Procesadores": [
      "Familia de procesador",
      "Socket",
      "Cantidad de núcleos",
      "Gráficos integrados",
      "Incluye disipador"
    ],
    "Tarjetas Madre": [
      "Socket",
      "Factor de Forma",
      "Tecnología RAM",
      "Velocidad (MT/s)",
      "Soporte de Almacenamiento",
      "Chipset",
      "Capacidad de memoria RAM",
      "Iluminación"
    ],
    "Tarjetas de Video": [
      "Chip gráfico",
      "Memoria de Video",
      "Tipo de Ventilación",
      "Interfaz PCI-e",
      "Salidas de video",
      "Fuente recomendada"
    ],
    "Memorias RAM": [
      "Capacidad de Memoria RAM",
      "Tecnología RAM",
      "Velocidad (MT/s)",
      "Solución Térmica",
      "Perfiles OC",
      "Presentación RAM",
      "Iluminación"
    ],
    "SSD": [
      "Capacidad",
      "Interfaz",
      "Solución Térmica",
      "Iluminación"
    ],
    "Discos Duros": [
      "Tipo de uso HDD",
      "Capacidad",
      "Interfaz",
      "Memoria cache",
      "Velocidad (RPM)"
    ],
    "Enfriamientos Líquidos": [
      "Socket",
      "Tamaño del radiador",
      "Tamaño del ventilador",
      "Tipo de enfriamiento",
      "Ventiladores incluidos",
      "Iluminación"
    ],
    "Disipadores": [
      "Socket",
      "Tamaño de Disipador",
      "Tamaño del ventilador",
      "Tipo de disipador",
      "Ventiladores incluidos",
      "Iluminación"
    ],
    "Gabinetes": [
      "Tamaño de gabinete",
      "Fuente integrada",
      "Factor de Forma",
      "Ventiladores incluidos",
      "Tamaño del ventilador",
      "Soporte enfriamiento (líquido)",
      "Iluminación",
      "Tipo de ventana",
      "Color"
    ],
    "Fuentes de poder": [
      "Gestión de cables",
      "Potencia en Watts",
      "Certificación",
      "Tamaño del ventilador",
      "Iluminación"
    ],
    "Ventiladores": [
      "Tamaño del ventilador",
      "Tipo de ventilador",
      "Presentación del ventilador",
      "Velocidad (RPM)",
      "Iluminación"
    ],
    "Pastas térmicas": [
      "Presentación de pasta",
      "Color"
    ],
    "Soportes para GPU": [
      "Iluminación",
      "Diseño"
    ]
  },
  "🖱️ Accesorios": {
    "Mouse": [
      "Tipo de Mouse",
      "Diseño del mouse",
      "Conectividad",
      "Cantidad de DPIs",
      "Cantidad de botones",
      "Tipo de sensor",
      "Iluminación",
      "Color"
    ],
    "Teclado": [
      "Tipo de teclado",
      "Tamaño del teclado",
      "Tipo de teclas",
      "Conectividad",
      "Idioma",
      "Iluminación",
      "Color"
    ],
    "Kit de accesorios": [
      "Tipo de kit",
      "Conectividad",
      "Iluminación",
      "Color"
    ],
    "Mouse Pad": [
      "Tamaño del mousepad",
      "Tipo de mousepad",
      "Bordado del mousepad",
      "Iluminación",
      "Color"
    ],
    "Game Pads": [
      "Compatibilidad del gamepad",
      "Conectividad",
      "Sistema de vibración",
      "Color"
    ],
    "Mochilas": [
      "Tipo de mochila",
      "Tamaño de laptop soportado",
      "Color"
    ],
    "Reposamuñecas": [
      "Tamaño del reposamuñecas",
      "Material",
      "Iluminación",
      "Color"
    ],
    "Hubs": [
      "Cantidad de puertos",
      "Conectividad"
    ],
    "Cables": [
      "Tipo de cable",
      "Tamaño",
      "Color"
    ],
    "Adaptadores": [
      "Tipo de adaptador"
    ],
    "Bases para laptop": [
      "Tamaño de laptop soportado",
      "Ventiladores incluidos",
      "Niveles ajustables",
      "Iluminación"
    ],
    "Stylus": [
      "Tipo de tecnología",
      "Compatibilidad de marca",
      "Tipo de punta",
      "Funciones especiales",
      "Tipo de carga"
    ]
  },
  "🎧 Audio": {
    "Bocinas": [
      "Calidad del audio",
      "Conectividad",
      "Iluminación",
      "Color"
    ],
    "Barras de Sonido": [
      "Calidad de audio",
      "Conectividad",
      "Iluminación",
      "Color"
    ],
    "Headsets": [
      "Tipo de headset",
      "Calidad del audio",
      "Conectividad",
      "Cancelación de ruido",
      "Plataforma compatible",
      "Iluminación",
      "Color"
    ],
    "Auriculares": [
      "Tipo de audífonos",
      "Calidad del  audio",
      "Conectividad",
      "Cancelación de ruido",
      "Manos libres",
      "Plataforma compatible",
      "Color"
    ],
    "Bases para headset": [
      "Color",
      "Iluminación"
    ],
    "Tarjetas de sonido": [
      "Calidad de audio",
      "Conectividad",
      "Puertos"
    ]
  },
  "💾 Almacenamiento": {
    "Discos Duros Externos": [
      "Capacidad",
      "Interfaz",
      "Protecciones",
      "Plataforma compatible",
      "Color"
    ],
    "SSD Externo": [
      "Capacidad",
      "Interfaz",
      "Protecciones",
      "Plataforma compatible",
      "Color"
    ],
    "Memorias USB": [
      "Diseño de memoria",
      "Capacidad",
      "Interfaz",
      "Color"
    ],
    "Memorias SD": [
      "Capacidad",
      "Clase de velocidad",
      "Tipo de uso SD"
    ],
    "Memorias MicroSD": [
      "Capacidad",
      "Clase de velocidad",
      "Tipo de uso SD"
    ],
    "NAS": [
      "Bahías para discos",
      "Almacenamiento compatible",
      "Capacidad máxima",
      "Procesador interno",
      "Memoria RAM interna",
      "Funciones integradas",
      "Sistema operativo NAS",
      "Plataforma compatible"
    ],
    "Enclosure": [
      "Almacenamiento compatible",
      "Interfaz",
      "Capacidad máxima",
      "Plataforma compatible",
      "Color"
    ]
  },
  "🖥️ Monitores": {
    "Monitores de escritorio": [
      "Tipo de monitor",
      "Tipo de Panel",
      "Tipo de HDR",
      "Tamaño de pantalla",
      "Resolución del Monitor",
      "Velocidad de Actualización",
      "Tecnología de sincronización",
      "Forma de panel",
      "Tiempo de respuesta",
      "Entradas del monitor",
      "Bocinas integradas",
      "Iluminación"
    ],
    "Monitores Portátiles": [
      "Tipo de monitor",
      "Tipo de Panel",
      "Tipo de HDR",
      "Tamaño de pantalla",
      "Resolución del Monitor",
      "Velocidad de Actualización",
      "Tecnología de sincronización",
      "Forma de panel",
      "Tiempo de respuesta",
      "Entradas del monitor",
      "Bocinas integradas",
      "Iluminación"
    ],
    "Proyectores": [
      "Tipo de proyector",
      "Brillo del proyector",
      "Resolución del monitor",
      "Altavoces del proyector",
      "Conexiones del proyector"
    ],
    "Soportes para monitor": [
      "Tamaño de monitor soportado",
      "Cantidad de monitores",
      "Peso máximo soportado",
      "Compatibilidad VESA",
      "Tipo de instalación",
      "Ajustes de movimiento"
    ]
  },
  "🎥 Streaming": {
    "Cámaras web": [
      "Resolución de la cámara",
      "Conectividad",
      "Velocidad de la cámara",
      "Iluminación"
    ],
    "Micrófonos": [
      "Tipo de micrófono",
      "Conectividad",
      "Iluminación",
      "Patrón polar",
      "Plataforma compatible",
      "Color"
    ],
    "Teclados para streaming": [
      "Número de teclas",
      "Plataforma compatible",
      "Conectividad",
      "Color"
    ],
    "Capturadora de video": [
      "Tipo de capturadora",
      "Resolución de captura",
      "Conectividad",
      "Plataforma compatible"
    ],
    "Paneles acústicos": [
      "Tipo de panel acústico",
      "Nivel de absorción",
      "Tamaño",
      "Diseño",
      "Formato de venta",
      "Color"
    ],
    "Iluminación": [
      "Tipo de iluminación",
      "Temperatura de color",
      "Control de la luz",
      "Tipo de montaje",
      "Plataforma compatible"
    ],
    "Pantallas verdes": [
      "Tipo de pantalla verde",
      "Tamaño",
      "Material",
      "Tipo de montaje"
    ],
    "Brazos para micrófono": [
      "Tipo de brazo",
      "Rango de movimiento",
      "Tipo de montaje",
      "Material",
      "Color"
    ],
    "Teleprompter": [
      "Marca"
    ]
  },
  "🍎 Apple": {
    "MacBook Pro": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "MacBook Air": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "MacBook Neo": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "iMac": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "Mac mini": [
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo"
    ],
    "Mac Studio": [
      "Familia de procesador",
      "Tarjeta de video",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo"
    ],
    "iPad": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "iPad mini": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "iPad Air": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ],
    "iPad Pro": [
      "Tamaño de pantalla",
      "Familia de procesador",
      "Memoria RAM",
      "Capacidad",
      "Sistema Operativo",
      "Color"
    ]
  },
  "🖨️ Impresión": {
    "Impresoras": [
      "Tipo de impresora",
      "Tipo de impresión",
      "Tecnología de impresora",
      "Conectividad",
      "Tipo de consumible"
    ],
    "Multifuncionales": [
      "Tipo de Multifuncional",
      "Tipo de impresión",
      "Tecnología de impresora",
      "Conectividad",
      "Tipo de consumible"
    ],
    "Plotters": [
      "Tipo de plotter",
      "Ancho de impresión máximo"
    ],
    "Consumibles": [
      "Tipo de consumible",
      "Color"
    ]
  },
  "💺 Muebles": {
    "Sillas": [
      "Tipo de silla",
      "Material de la silla",
      "Tipo de descansabrazos",
      "Material de la estrella",
      "Clase de pistón",
      "Peso soportado",
      "Iluminación",
      "Color"
    ],
    "Sillones": [
      "Material de la silla",
      "Peso soportado",
      "Iluminación",
      "Color"
    ],
    "Escritorios": [
      "Forma del escritorio",
      "Material de fabricación",
      "Altura ajustable"
    ],
    "Tapetes para silla": [
      "Tamaño del tapete",
      "Material del tapete",
      "Color"
    ]
  },
  "⚡ Energía": {
    "Multicontactos": [
      "Cantidad de contactos",
      "Largo del cable"
    ],
    "Reguladores": [
      "Cantidad de contactos",
      "Contactos supresores",
      "Watts Soportados",
      "Cantidad de VA"
    ],
    "No breaks": [
      "Tiempo de respaldo",
      "Cantidad de contactos",
      "Contactos supresores",
      "Contactos de Respaldo",
      "Watts Soportados",
      "Cantidad de VA"
    ],
    "Power Banks": [
      "Capacidad (mAh)",
      "Puertos de salida",
      "Tecnología de carga",
      "Color"
    ],
    "Cargadores": [
      "Tipo de cargador",
      "Cantidad de entradas",
      "Conectividad",
      "Color"
    ],
    "Compensadores": [
      "Carga máxima"
    ],
    "Extensiones": [
      "Largo del cable",
      "Cantidad de contactos"
    ]
  },
  "🛜 Redes": {
    "Access point": [
      "Tipo de access point",
      "Estándar WiFi",
      "Velocidad (Mbps)",
      "Puertos de red",
      "Modo de operación",
      "Usuarios conectados",
      "Tipo de Seguridad"
    ],
    "Adaptadores WiFi": [
      "Tipo de adaptador WiFi (interno, externo)",
      "Estándar WiFi",
      "Velocidad (Mbps)",
      "Banda de frecuencia",
      "Cantidad de antenas",
      "Conectividad",
      "Plataforma compatible",
      "Bluetooth Integrado"
    ],
    "Routers": [
      "Tipo de router",
      "Estándar WiFi",
      "Puertos de red",
      "Banda de frecuencia",
      "Velocidad (Mbps)",
      "Cantidad de antenas",
      "Modo de operación"
    ],
    "Switches": [
      "Tipo de Switch",
      "Puertos de redPoE",
      "Puertos SFP"
    ],
    "Tarjetas de Red": [
      "Interfaz",
      "Velocidad (Mbps)",
      "Estándar WiFi"
    ]
  },
  "💹 Puntos de venta": {
    "Cajón de dinero": [
      "Tipo de apertura",
      "Conectividad",
      "Espacios para billetes",
      "Color"
    ],
    "Impresora térmica": [
      "Tipo de impresora",
      "Ancho de impresión",
      "Resolución de impresión",
      "Método de corte",
      "Conectividad",
      "Plataforma compatible"
    ],
    "Lector de código de barras": [
      "Tipo de lector de códigos",
      "Tecnología de escaneo",
      "Códigos soportados",
      "Conectividad",
      "Plataforma compatible"
    ]
  },
  "📷 Videovigilancia": {
    "Alarmas": [
      "Tipo de sistema",
      "Conectividad",
      "Zonas soportadas"
    ],
    "Cámaras de seguridad": [
      "Tipo de cámara",
      "Resolución de la cámara",
      "Conectividad",
      "Visión nocturna",
      "Tecnología compatible",
      "Protecciones",
      "Audio integrado"
    ],
    "DVRs": [
      "Canales de video",
      "Tecnología compatible",
      "Resolución de video",
      "Capacidad máxima",
      "Funciones inteligentes"
    ],
    "Kits de videovigilancia": [
      "Tipo de sistema",
      "Resolución de video",
      "Conectividad",
      "Visión nocturna",
      "Protecciones",
      "Audio integrado",
      "Capacidad máxima",
      "Funciones inteligentes"
    ],
    "NVRs": [
      "Canales de video",
      "Puertos PoE",
      "Tecnología compatible",
      "Resolución de video",
      "Capacidad máxima",
      "Funciones inteligentes"
    ],
    "Sensores": [
      "Tipo de sensor de alarma",
      "Conectividad",
      "Tipo de notificación"
    ],
    "Videoporteros": [
      "Tipo de videoportero",
      "Tamaño de pantalla",
      "Resolución de video",
      "Conectividad",
      "Compatibilidad con cerradura"
    ]
  },
  "🧑‍💻 Software": {
    "Sistemas operativos": [
      "Versión del sistema",
      "Tipo de licencia",
      "Idioma"
    ],
    "Antivirus": [
      "Plataforma compatible",
      "Tipo de protección",
      "Tipo de licencia",
      "Cantidad de dispositivos"
    ],
    "Software de facturación": [
      "Tipo de facturación",
      "Tipo de contribuyente",
      "Plataforma compatible",
      "Tipo de licencia",
      "Cantidad de timbres"
    ],
    "Software de ofimática": [
      "Versión de suite",
      "Tipo de licencia",
      "Cantidad de dispositivos",
      "Plataforma compatible",
      "Idioma"
    ],
    "Software de punto de venta": [
      "Tipo de negocio",
      "Plataforma compatible",
      "Tipo de licencia",
      "Cantidad de productos",
      "Usuarios simultáneos"
    ]
  },
  "🛜 Estructura para site": {
    "Rack para site": [
      "Tipo rack",
      "Cantidad de unidades",
      "Cantidad de postes",
      "Peso soportado"
    ],
    "Gabinete para site": [
      "Tipo de gabinete (Piso, Pared, exterior)",
      "Certificación IP",
      "Cantidad de unidades",
      "Peso soportado",
      "Tipo de ventana"
    ],
    "Cable de red": [
      "Categoría del cable",
      "Largo del cable",
      "Color"
    ],
    "Plugs": [
      "Categoría del plug (CAT5, CAT5e, CAT6, CAT6A)"
    ],
    "Jacks": [
      "Categoría de jack (CAT5, CAT5e, CAT6, CAT6A)"
    ],
    "Charolas": [
      "Tipo de charola",
      "Cantidad de unidades",
      "Peso soportado"
    ],
    "Organizadores": [
      "Tipo de organizador",
      "Cantidad de unidades"
    ],
    "Patch Panel": [
      "Categoría de panel (CAT5, CAT5e, CAT6, CAT6A)",
      "Cantidad de Puertos",
      "Cantidad de unidades"
    ],
    "Panel ciego": [
      "Tamaño de unidades de rack",
      "Tipo de instalación",
      "Tipo de material",
      "Tipo de diseño",
      "Color"
    ],
    "Balanceadores": [
      "Tipo de despliegue",
      "Capa del modelo OSI",
      "Capacidad de rendimiento",
      "Algoritmos de balanceo",
      "Funciones de seguridad"
    ]
  },
  "🕹️ Juegos y Juguetes": {
    "Drones": [
      "Tipo de uso",
      "Peso del dron",
      "Calidad de la cámara",
      "Tiempo de vuelo",
      "Sensores de seguridad"
    ]
  },
  "🏡 Hogar y Confort": {
    "Aire acondicionado": [
      "Capacidad de enfriamiento",
      "Tecnología del motor",
      "Tipo de ciclo",
      "Voltaje de operación"
    ]
  },
  "📺 Electrónicos": {
    "Pantallas": [
      "Tamaño de pantalla",
      "Tipo de Panel",
      "Forma de panel",
      "Tipo de HDR",
      "Resolución",
      "Entradas de video"
    ]
  },
  "🧰 Herramientas": {
    "Desarmadores": [
      "Tipo de desarmador",
      "Tipo de punta",
      "Color"
    ],
    "Pinzas de ponchado": [
      "Tipo de ponchado",
      "Tipos de conectores compatibles"
    ]
  }
}"""

async def main():
    try:
        conn = await asyncpg.connect("postgresql://rampage@localhost:5432/gamerloot")
        data = json.loads(json_data)
        
        # 1. Collect and Inject Global Attributes
        all_attributes = set()
        for parent, subcats in data.items():
            for subcat, attrs in subcats.items():
                for attr in attrs:
                    all_attributes.add(attr.strip())
                    
        print(f"[*] Total de atributos únicos a inyectar: {len(all_attributes)}")
        
        for attr in all_attributes:
            slug = re.sub(r'[^a-z0-9]+', '_', attr.lower()).strip('_')
            try:
                await conn.execute("""
                    INSERT INTO product_attributes (name, slug, type, is_filterable, is_for_configurator)
                    VALUES ($1, $2, 'text', true, false)
                """, attr, slug)
            except asyncpg.exceptions.UniqueViolationError:
                # Ya existe, lo saltamos
                pass
                
        print("[*] Atributos globales procesados con éxito.")
        
        # 2. Process Categories and Inject Schemas
        for parent_key, subcats in data.items():
            # Extraer nombre padre limpio (sin emojis)
            parent_name = parent_key.split(' ', 1)[1].strip() if ' ' in parent_key else parent_key.strip()
            
            # Buscar categoría padre
            parent_row = await conn.fetchrow("""
                SELECT id FROM categories WHERE name ILIKE $1 AND parent_id IS NULL LIMIT 1
            """, f"%{parent_name}%")
            
            if not parent_row:
                slug = re.sub(r'[^a-z0-9]+', '-', parent_name.lower()).strip('-')
                parent_id = await conn.fetchval("""
                    INSERT INTO categories (name, slug, is_active, show_in_menu)
                    VALUES ($1, $2, true, true)
                    RETURNING id
                """, parent_name, slug)
                print(f"[+] CREADA: Categoría padre faltante -> {parent_name}")
            else:
                parent_id = parent_row['id']
                
            # Procesar subcategorías
            for subcat_name, attrs in subcats.items():
                subcat_row = await conn.fetchrow("""
                    SELECT id, parent_id FROM categories WHERE name ILIKE $1 LIMIT 1
                """, f"%{subcat_name}%")
                
                attr_json = json.dumps(attrs)
                
                if not subcat_row:
                    slug = re.sub(r'[^a-z0-9]+', '-', subcat_name.lower()).strip('-')
                    await conn.execute("""
                        INSERT INTO categories (name, slug, parent_id, attribute_schema, is_active, show_in_menu)
                        VALUES ($1, $2, $3, $4, true, true)
                    """, subcat_name, slug, parent_id, attr_json)
                    print(f"    [+] CREADA y ACTUALIZADA: Subcategoría faltante -> {subcat_name} ({len(attrs)} atributos)")
                else:
                    await conn.execute("""
                        UPDATE categories SET attribute_schema = $1, parent_id = $3 WHERE id = $2
                    """, attr_json, subcat_row['id'], parent_id)
                    print(f"    [✓] ACTUALIZADA: Subcategoría existente -> {subcat_name} ({len(attrs)} atributos)")

        await conn.close()
        print("\n[OK] Inyección de Atributos Finalizada Correctamente.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
