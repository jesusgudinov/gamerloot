from typing import List, Dict, Any

def calculate_virtual_parcel(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Consolida una lista de items de un carrito (u orden) en un solo paquete virtual
    para enviarlo a Mienvio.
    
    Cada item debe ser un diccionario con al menos:
    - weight_kg: float
    - length_cm: float
    - width_cm: float
    - height_cm: float
    - quantity: int
    """
    total_weight = 0.0
    max_length = 1.0 # Valores mínimos requeridos por API
    max_width = 1.0
    total_height = 0.0
    
    for item in items:
        qty = item.get('quantity', 1)
        w = item.get('weight_kg') or 0.5
        l = item.get('length_cm') or 10.0
        wi = item.get('width_cm') or 10.0
        h = item.get('height_cm') or 10.0
        
        # Algoritmo de empaquetado apilado (Naive stack)
        total_weight += (w * qty)
        total_height += (h * qty)
        if l > max_length:
            max_length = l
        if wi > max_width:
            max_width = wi

    # Prevención de valores nulos o 0 para Mienvio
    return {
        "weight": round(max(total_weight, 1.0), 2),
        "distance_unit": "CM",
        "mass_unit": "KG",
        "length": int(max(max_length, 10)),
        "width": int(max(max_width, 10)),
        "height": int(max(total_height, 10)),
    }
