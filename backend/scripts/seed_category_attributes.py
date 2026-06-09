import asyncio
import sys
import os
import re

sys.path.append(os.getcwd())

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
import app.models.role
import app.models.user
import app.models.inventory
import app.models.marketing
import app.models.sales
from app.models.product import Category, ProductAttribute

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

CATEGORIES_DATA = {
    "Desktops": ["Tipo de computadora", "Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema operativo", "Iluminación"],
    "Laptops": ["Tipo de laptop", "Tamaño de pantalla", "Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema operativo", "Iluminación", "Color"],
    "Servidores": ["Tipo de servidor", "Familia de procesador", "Memoria RAM", "Capacidad"],
    "Workstations": ["Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema operativo"],
    "Tablets": ["Tamaño de pantalla", "Familia de procesador", "Memoria RAM", "Capacidad", "Color"],
    "Procesadores": ["Familia de procesador", "Socket", "Cantidad de núcleos", "Gráficos integrados", "Incluye disipador", "TDP"],
    "Tarjetas Madre": ["Socket", "Factor de Forma", "Tecnología RAM", "Velocidad (MT/s)", "Soporte de Almacenamiento", "Chipset", "Capacidad de memoria RAM", "Iluminación", "TDP"],
    "Tarjetas de Video": ["Poner la familia del chip gráfico", "Memoria de Video", "Tipo de Ventilación", "Interfaz PCI-e", "Salidas de video", "Fuente recomendada"],
    "Memorias RAM": ["Capacidad de Memoria RAM", "Tecnología RAM", "Velocidad (MT/s)", "Solución Térmica", "Perfiles OC", "Presentación RAM", "Iluminación", "TDP"],
    "SSD": ["Capacidad", "Interfaz", "Solución Térmica", "Iluminación", "TDP"],
    "Discos Duros": ["Tipo de uso HDD", "Capacidad", "Interfaz", "Memoria cache", "Velocidad (RPM)", "TDP"],
    "Enfriamiento Líquido": ["Socket", "Tamaño del radiador", "Tamaño del ventilador", "Tipo de enfriamiento", "Ventiladores incluidos", "Iluminación", "TDP"],
    "Enfriamientos Líquidos": ["Socket", "Tamaño del radiador", "Tamaño del ventilador", "Tipo de enfriamiento", "Ventiladores incluidos", "Iluminación", "TDP"],
    "Enfriamientos Liquidos": ["Socket", "Tamaño del radiador", "Tamaño del ventilador", "Tipo de enfriamiento", "Ventiladores incluidos", "Iluminación", "TDP"],
    "Enfriamientos líquidos": ["Socket", "Tamaño del radiador", "Tamaño del ventilador", "Tipo de enfriamiento", "Ventiladores incluidos", "Iluminación", "TDP"],
    "Enfriamientos liquidos": ["Socket", "Tamaño del radiador", "Tamaño del ventilador", "Tipo de enfriamiento", "Ventiladores incluidos", "Iluminación", "TDP"],
    "Disipadores": ["Socket", "Tamaño de Disipador", "Tamaño del ventilador", "Tipo de disipador", "Ventiladores incluidos", "Iluminación", "TDP"],
    "Gabinetes": ["Tamaño de gabinete", "Fuente integrada", "Factor de Forma", "Ventiladores incluidos", "Tamaño del ventilador", "Soporte enfriamiento (líquido)", "Iluminación", "Tipo de ventana", "Color", "Formato de fuente"],
    "Fuentes de poder": ["Gestión de cables", "Potencia en Watts", "Certificación", "Tamaño del ventilador", "Iluminación", "Formato de fuente"],
    "Ventiladores": ["Tamaño del ventilador", "Tipo de ventilador", "Presentación del ventilador", "Velocidad (RPM)", "Iluminación", "TDP"],
    "Pastas térmicas": ["Presentación de pasta", "Color"],
    "Mouse": ["Tipo de Mouse", "Diseño del mouse", "Conectividad", "Cantidad de DPIs", "Cantidad de botones", "Tipo de sensor", "Iluminación", "Color"],
    "Teclado": ["Tipo de teclado", "Tamaño del teclado", "Tipo de teclas", "Conectividad", "Idioma", "Iluminación", "Color"],
    "Kit de accesorios": ["Tipo de kit", "Conectividad", "Iluminación", "Color"],
    "Mouse Pad": ["Tamaño del mousepad", "Tipo de mousepad", "Bordado del mousepad", "Iluminación", "Color"],
    "Game Pad": ["Compatibilidad del gamepad", "Conectividad", "Sistema de vibración", "Color"],
    "Mochilas": ["Tipo de mochila", "Tamaño de laptop soportado", "Color"],
    "Reposamuñecas": ["Tamaño del reposamuñecas", "Material", "Iluminación", "Color"],
    "Hubs": ["Cantidad de puertos", "Conectividad"],
    "Cables": ["Tipo de cable", "Tamaño", "Color"],
    "Adaptadores": ["Tipo de adaptador"],
    "Bases para laptop": ["Tamaño de laptop soportado", "Ventiladores incluidos", "Niveles ajustables", "Iluminación"],
    "Bocinas": ["Calidad del audio", "Conectividad", "Iluminación", "Color"],
    "Barras de Sonido": ["Calidad de audio", "Conectividad", "Iluminación", "Color"],
    "Headsets": ["Tipo de headset", "Calidad del audio", "Conectividad", "Cancelación de ruido", "Plataforma compatible", "Iluminación", "Color"],
    "Auriculares": ["Tipo de audífonos", "Calidad del audio", "Conectividad", "Cancelación de ruido", "Manos libres", "Plataforma compatible", "Color"],
    "Bases para headset": ["Color", "Iluminación"],
    "Discos Duros Externos": ["Capacidad", "Interfaz", "Protecciones", "Plataforma compatible", "Color"],
    "SSD Externo": ["Capacidad", "Interfaz", "Protecciones", "Plataforma compatible", "Color"],
    "Memorias USB": ["Diseño de memoria", "Capacidad", "Interfaz", "Color"],
    "Memorias SD": ["Capacidad", "Clase de velocidad", "Tipo de uso SD"],
    "Memorias MicroSD": ["Capacidad", "Clase de velocidad", "Tipo de uso SD"],
    "NAS": ["Bahías para discos", "Almacenamiento compatible", "Capacidad máxima", "Procesador interno", "Memoria RAM interna", "Funciones integradas", "Sistema operativo NAS", "Plataforma compatible"],
    "Enclosure": ["Almacenamiento compatible", "Interfaz", "Capacidad máxima", "Plataforma compatible", "Color"],
    "Monitores de escritorio": ["Tipo de monitor", "Tipo de Panel", "Tipo de HDR", "Tamaño de pantalla", "Resolución del Monitor", "Velocidad de Actualización", "Tecnología de sincronización", "Forma de panel", "Tiempo de respuesta", "Entradas del monitor", "Bocinas integradas", "Iluminación"],
    "Monitores Portátiles": ["Tipo de monitor", "Tipo de Panel", "Tipo de HDR", "Tamaño de pantalla", "Resolución del Monitor", "Velocidad de Actualización", "Tecnología de sincronización", "Forma de panel", "Tiempo de respuesta", "Entradas del monitor", "Bocinas integradas", "Iluminación"],
    "Proyectores": ["Tipo de proyector", "Brillo del proyector", "Resolución del monitor", "Altavoces del proyector", "Conexiones del proyector"],
    "Soportes para monitor": ["Tamaño de monitor soportado", "Cantidad de monitores", "Peso máximo soportado", "Compatibilidad VESA", "Tipo de instalación", "Ajustes de movimiento"],
    "Cámaras web": ["Resolución de la cámara", "Conectividad", "Velocidad de la cámara", "Iluminación"],
    "Micrófonos": ["Tipo de micrófono", "Conectividad", "Iluminación", "Patrón polar", "Plataforma compatible", "Color"],
    "Teclados para streaming": ["Número de teclas", "Plataforma compatible", "Conectividad", "Color"],
    "Capturadora de video": ["Tipo de capturadora", "Resolución de captura", "Conectividad", "Plataforma compatible"],
    "Paneles acústicos": ["Tipo de panel acústico", "Nivel de absorción", "Tamaño", "Diseño", "Formato de venta", "Color"],
    "Iluminación": ["Tipo de iluminación", "Temperatura de color", "Control de la luz", "Tipo de montaje", "Plataforma compatible"],
    "Pantallas verdes": ["Tipo de pantalla verde", "Tamaño", "Material", "Tipo de montaje"],
    "Brazos para micrófono": ["Tipo de brazo", "Rango de movimiento", "Tipo de montaje", "Material", "Color"],
    "Teleprompter": ["Marca"],
    "MacBook Pro": ["Tamaño de pantalla", "Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "MacBook Air": ["Tamaño de pantalla", "Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "iMac": ["Tamaño de pantalla", "Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "MacBook Neo": ["Tamaño de pantalla", "Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "Mac mini": ["Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema Operativo"],
    "Mac Studio": ["Familia de procesador", "Tarjeta de video", "Memoria RAM", "Capacidad", "Sistema Operativo"],
    "iPad": ["Tamaño de pantalla", "Familia de procesador", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "iPad mini": ["Tamaño de pantalla", "Familia de procesador", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "iPad Air": ["Tamaño de pantalla", "Familia de procesador", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "iPad Pro": ["Tamaño de pantalla", "Familia de procesador", "Memoria RAM", "Capacidad", "Sistema Operativo", "Color"],
    "Impresoras": ["Tipo de impresora", "Tipo de impresión", "Tecnología de impresora", "Conectividad", "Tipo de consumible"],
    "Multifuncionales": ["Tipo de Multifuncional", "Tipo de impresión", "Tecnología de impresora", "Conectividad", "Tipo de consumible"],
    "Plotters": ["Tipo de plotter", "Ancho de impresión máximo"],
    "Consumibles": ["Tipo de consumible", "Color"],
    "Sillas": ["Tipo de silla", "Material de la silla", "Tipo de descansabrazos", "Material de la estrella", "Clase de pistón", "Peso soportado", "Iluminación", "Color"],
    "Sillones": ["Material de la silla", "Peso soportado", "Iluminación", "Color"],
    "Escritorios": ["Forma del escritorio", "Material de fabricación", "Altura ajustable"],
    "Tapetes para silla": ["Tamaño del tapete", "Material del tapete", "Color"],
    "Multicontactos": ["Cantidad de contactos", "Largo del cable"],
    "Reguladores": ["Cantidad de contactos", "Contactos supresores", "Watts Soportados", "Cantidad de VA"],
    "No breaks": ["Tiempo de respaldo", "Cantidad de contactos", "Contactos supresores", "Contactos de Respaldo", "Watts Soportados", "Cantidad de VA"],
    "Power Banks": ["Capacidad (mAh)", "Puertos de salida", "Tecnología de carga", "Color"],
    "Cargadores": ["Tipo de cargador", "Cantidad de entradas", "Conectividad", "Color"],
    "Compensadores": ["Carga máxima"],
    "Access point": ["Tipo de access point", "Estándar WiFi", "Velocidad (Mbps)", "Puertos de red", "Modo de operación", "Usuarios conectados", "Tipo de Seguridad"],
    "Adaptadores WiFi": ["Tipo de adaptador WiFi (interno, externo)", "Estándar WiFi", "Velocidad (Mbps)", "Banda de frecuencia", "Cantidad de antenas", "Conectividad", "Plataforma compatible", "Bluetooth Integrado"],
    "Routers": ["Tipo de router", "Estándar WiFi", "Puertos de red", "Banda de frecuencia", "Velocidad (Mbps)", "Cantidad de antenas", "Modo de operación"],
    "Switches": ["Tipo de Switch", "Puertos de red", "PoE", "Puertos SFP"],
    "Cajón de dinero": ["Tipo de apertura", "Conectividad", "Espacios para billetes", "Color"],
    "Impresora térmica": ["Tipo de impresora", "Ancho de impresión", "Resolución de impresión", "Metodo de corte", "Conectividad", "Plataforma compatible"],
    "Lector de codigo de barras": ["Tipo de lector de códigos", "Tecnología de escaneo", "Códigos soportados", "Conectividad", "Plataforma compatible"],
    "Alarmas": ["Tipo de sistema", "Conectividad", "Zonas soportadas"],
    "Cámaras de seguridad": ["Tipo de cámara", "Resolución de la cámara", "Conectividad", "Visión nocturna", "Tecnología compatible", "Protecciones", "Audio integrado"],
    "DVRs": ["Canales de video", "Tecnología compatible", "Resolución de video", "Capacidad máxima", "Funciones inteligentes"],
    "Kits de videovigilancia": ["Tipo de sistema", "Resolución de video", "Conectividad", "Visión nocturna", "Protecciones", "Audio integrado", "Capacidad máxima", "Funciones inteligentes"],
    "NVRs": ["Canales de video", "Puertos PoE", "Tecnología compatible", "Resolución de video", "Capacidad máxima", "Funciones inteligentes"],
    "Sensores": ["Tipo de sensor de alarma", "Conectividad", "Tipo de notificación"],
    "Videoporteros": ["Tipo de videoportero", "Tamaño de pantalla", "Resolución de video", "Conectividad", "Compatibilidad con cerradura"],
    "Sistemas operativos": ["Versión del sistema", "Tipo de licencia", "Idioma"],
    "Antivirus": ["Plataforma compatible", "Tipo de protección", "Tipo de licencia", "Cantidad de dispositivos"],
    "Software de facturación": ["Tipo de facturación", "Tipo de contribuyente", "Plataforma compatible", "Tipo de licencia", "Cantidad de timbres"],
    "Software de ofimática": ["Versión de suite", "Tipo de licencia", "Cantidad de dispositivos", "Plataforma compatible", "Idioma"],
    "Software de punto de venta": ["Tipo de negocio", "Plataforma compatible", "Tipo de licencia", "Cantidad de productos", "Usuarios simultáneos"],
    "Rack para site": ["Tipo rack", "Cantidad de unidades", "Cantidad de postes", "Peso soportado"],
    "Gabinete para site": ["Tipo de gabinete (Piso, Pared, exterior)", "Certificacion IP", "Cantidad de unidades", "Peso soportado", "Tipo de ventana"],
    "Cable de red": ["Categoría del cable", "Largo del cable", "Color"],
    "Plugs": ["Categoria del plug (CAT5, CAT5e, CAT6, CAT6A)"],
    "Jacks": ["Categoria de jack (CAT5, CAT5e, CAT6, CAT6A)"],
    "Charolas": ["Tipo de charola", "Cantidad de unidades", "Peso soportado"],
    "Organizadores": ["Tipo de organizador", "Cantidad de unidades"],
    "Patch Panel": ["Categoria de panel (CAT5, CAT5e, CAT6, CAT6A)", "Cantidad de Puertos", "Cantidad de unidades"],
    "Panel ciego": []
}

async def seed_category_attributes():
    async with AsyncSessionLocal() as session:
        try:
            # Primero nos aseguramos de que todos los atributos existen a nivel global
            all_attributes = set()
            for attrs in CATEGORIES_DATA.values():
                for attr in attrs:
                    all_attributes.add(attr)
                    
            for attr_name in all_attributes:
                slug = slugify(attr_name)
                # Revisar si ya existe por nombre o por slug
                result = await session.execute(
                    select(ProductAttribute).where(
                        (ProductAttribute.slug == slug) | (ProductAttribute.name.ilike(attr_name))
                    )
                )
                existing = result.scalars().first()
                if not existing:
                    new_attr = ProductAttribute(
                        name=attr_name,
                        slug=slug,
                        type="text",
                        is_filterable=True,
                        is_for_configurator=False
                    )
                    session.add(new_attr)
                    try:
                        await session.flush()
                    except Exception as e:
                        await session.rollback()
                        print(f"Saltando atributo duplicado u omitido: {attr_name}")
                    
            await session.commit()
            print(f"✅ Atributos globales procesados: {len(all_attributes)} únicos.")
            
            # Ahora iteramos por las categorías y les asignamos el esquema
            categories_updated = 0
            for cat_name, attrs in CATEGORIES_DATA.items():
                result = await session.execute(select(Category).where(Category.name.ilike(cat_name)))
                category = result.scalars().first()
                if category:
                    category.attribute_schema = attrs
                    session.add(category)
                    categories_updated += 1
                else:
                    print(f"⚠️ Categoría no encontrada en BD: {cat_name}")
                    
            await session.commit()
            print(f"✅ Se actualizaron {categories_updated} categorías con su attribute_schema.")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error durante el seeding: {e}")

if __name__ == "__main__":
    asyncio.run(seed_category_attributes())
