import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import json

from app.models.sales import Order, OrderItem
from app.models.product import Product
from app.models.inventory import InventoryStock, Warehouse

from app.services.email_service import EmailService
from app.core.packaging import calculate_virtual_parcel

async def process_order_fulfillment(order_id: int, db: AsyncSession):
    """
    Procesa un pedido pagado:
    1. Divide la orden por bodega de origen (Warehouse).
    2. Compra la guía en Skydropx.
    3. Guarda los números de guía en la BD.
    4. Envía correos a clientes y proveedores.
    """
    try:
        # 1. Obtener la orden con sus items
        query = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        
        if not order:
            print(f"Fulfillment: Orden {order_id} no encontrada.")
            return

        print(f"Fulfillment: Iniciando proceso para orden {order.folio} (ID: {order.id})")

        # 2. Agrupar items por origen de bodega
        origin_groups = {}

        # Mapear carrier para saber si es express o estándar
        carrier = order.carrier or ""
        shipping_method = "express" if "Express" in carrier else "standard"

        for item in order.items:
            # Buscamos el producto con su categoría cargada ansiosamente
            from sqlalchemy.orm import joinedload
            res = await db.execute(select(Product).options(joinedload(Product.category)).where(Product.id == item.product_id))
            product = res.scalar_one_or_none()
            if not product:
                print(f"Alerta: Producto {item.product_id} no encontrado")
                continue

            # Obtener el warehouse que tiene stock
            wh_query = select(Warehouse).join(InventoryStock).where(
                InventoryStock.product_id == item.product_id,
                InventoryStock.quantity >= item.quantity
            ).limit(1)
            wh_res = await db.execute(wh_query)
            warehouse = wh_res.scalar_one_or_none()
            
            origin_zip = warehouse.zip_code if warehouse and warehouse.zip_code else "06700"
            origin_state = warehouse.state if warehouse else "Ciudad de México"
            origin_city = warehouse.city if warehouse else "Cuauhtémoc"
            origin_address = warehouse.address if warehouse and warehouse.address else "Centro"

            if origin_zip not in origin_groups:
                origin_groups[origin_zip] = {
                    "warehouse": {
                        "zip": origin_zip,
                        "state": origin_state,
                        "city": origin_city,
                        "address": origin_address
                    },
                    "items": []
                }
            
            # Usamos un dict simulando la estructura esperada por calculate_virtual_parcel
            # calculate_virtual_parcel espera dicts con product_id, quantity, etc.
            # Sin embargo, como calculate_virtual_parcel en el backend actual usa weight/dims del Product,
            # pero el item no tiene dims directas, asumiremos que calculate_virtual_parcel resuelve esto
            # Ojo: la implementación real de calculate_virtual_parcel en el backend recibe items (dicts)
            # Para estar seguros, lo envolvemos
            # Extraer sat_code y category_name
            comp_type = product.component_type
            cat_name = product.category.name if product.category else ""
            sat_code = product.category.sat_code if product.category and product.category.sat_code else "43211507"

            origin_groups[origin_zip]["items"].append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "weight_kg": product.weight_kg,
                "length_cm": product.length_cm,
                "width_cm": product.width_cm,
                "height_cm": product.height_cm,
                "component_type": comp_type,
                "category_name": cat_name,
                "sat_code": sat_code
            })

        # 3. Procesar un único envío con Skydropx
        from app.services.skydropx_service import SkydropxService
        skydropx = SkydropxService()
        shipments_data = []

        # Extraer el breakdown de la orden (que guardamos en checkout)
        order_breakdown = order.shipments_data if isinstance(order.shipments_data, list) else []
        # El breakdown ahora tiene 1 solo elemento consolidado
        rate_info = order_breakdown[0] if order_breakdown else {}
        final_origin_zip = rate_info.get("origin_zip", "45403")
        rate_id = rate_info.get("rate_id")
        
        # Juntar todos los items en un solo paquete virtual
        all_items = []
        for group in origin_groups.values():
            all_items.extend(group["items"])

        # Tomamos el primer item como representativo
        main_item = all_items[0] if all_items else {}
        parcel = calculate_virtual_parcel(all_items)
        
        # Mapeo de colonias (street2)
        WAREHOUSE_NEIGHBORHOODS = {
            "45403": "Infonavit la Soledad",
            "02300": "Industrial Vallejo",
            "44790": "La Aurora",
            "15540": "Venustiano Carranza",
            "45235": "Agua Blanca Sur",
            "97100": "Itzimná",
            "72193": "Heroica Puebla de Zaragoza",
            "44900": "Jardines de la Victoria"
        }
        colonia_origen = WAREHOUSE_NEIGHBORHOODS.get(final_origin_zip, "Centro")

        address_from = {
            "name": "Bodega Proveedor" if final_origin_zip != "45403" else "Gamer Loot",
            "company": "Gamer Loot Dropshipping",
            "street1": "Bodega Unificada",
            "street2": colonia_origen,
            "city": "Ciudad", # Skydropx V2 usually infers city/state from zip, but providing defaults
            "province": "Estado",
            "zip": str(final_origin_zip).strip(),
            "country": "MX",
            "phone": "3326491386",
            "email": "contacto@gamerloot.com.mx"
        }

        colonia_cliente = order.address_references if order.address_references else "Colonia no especificada"

        address_to = {
            "name": order.customer_name,
            "company": order.company_name or "Particular",
            "street1": order.address[:45] if order.address else "N/A",
            "street2": colonia_cliente[:45],
            "city": order.city,
            "province": order.state,
            "zip": str(order.zip_code),
            "country": "MX",
            "phone": order.customer_phone or "5555555555",
            "email": order.customer_email,
            "reference": "Entregar a cliente"
        }

        print(f"Fulfillment: Creando envío desde {final_origin_zip} hacia {order.zip_code}")
        
        res = await skydropx.create_shipment(
            order_id=str(order.id),
            address_from=address_from,
            address_to=address_to,
            parcels=[parcel],
            rate_id=rate_id
        )

        shipment_info = {
            "origin_zip": final_origin_zip,
            "status": "Generando Guía",
            "carrier": rate_info.get("provider", "Pendiente"),
            "tracking_number": None,
            "label_url": None
        }

        if res.get("success"):
            data = res.get("data", {})
            # Estructura devuelta por Skydropx V2: Suele ser un arreglo o dict con 'data' como arreglo
            shipment_list = data.get("data", data) if isinstance(data, dict) else data
            
            # Tomamos el primer envío generado
            first_shipment = shipment_list[0] if isinstance(shipment_list, list) and len(shipment_list) > 0 else shipment_list
            attrs = first_shipment.get("attributes", first_shipment) if isinstance(first_shipment, dict) else {}
            
            # En V2 la URL de la etiqueta suele venir en included o en label_url directamente
            label_url = attrs.get("label_url", attrs.get("pdf_url"))
            # A veces en V2 las etiquetas vienen en un arreglo de 'labels'
            if not label_url and isinstance(attrs.get("labels"), list) and len(attrs.get("labels")) > 0:
                label_url = attrs["labels"][0].get("pdf_url", attrs["labels"][0].get("url"))

            shipment_info["status"] = "Guía Generada"
            shipment_info["carrier"] = attrs.get("carrier_name", attrs.get("provider", attrs.get("carrier", "Desconocido")))
            shipment_info["tracking_number"] = attrs.get("tracking_number", attrs.get("tracking_code"))
            shipment_info["label_url"] = label_url
            print(f"Fulfillment: Envío creado exitosamente. Tracking: {shipment_info['tracking_number']}")
        else:
            print(f"Fulfillment: Error creando envío con Skydropx: {res.get('detail')}")
            shipment_info["status"] = "Error en Guía"

        shipments_data.append(shipment_info)

        # 4. Guardar datos en la base de datos
        order.shipments_data = shipments_data
        
        # Si al menos un envío fue exitoso, podríamos cambiar el status general de la orden y llenar campos base
        first_successful = next((s for s in shipments_data if s.get("tracking_number")), None)
        if first_successful:
            order.status = "Procesando Envío"
            order.tracking_number = first_successful["tracking_number"]
            order.carrier = first_successful["carrier"]
            order.shipping_label_url = first_successful["label_url"]
            
        await db.commit()
        
        # 5. Enviar correo al cliente
        email_service = EmailService()
        email_service.send_fulfillment_email(
            order_folio=order.folio,
            customer_email=order.customer_email,
            customer_name=order.customer_name,
            shipments_data=shipments_data
        )

        # 6. Enviar correo al admin para distribuir guías a proveedores
        email_service.send_admin_supplier_email(
            order_folio=order.folio,
            shipments_data=shipments_data
        )

        print(f"Fulfillment: Proceso completado para orden {order.folio}.")

    except Exception as e:
        print(f"Fulfillment Error: {e}")
