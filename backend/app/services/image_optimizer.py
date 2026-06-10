import os
from PIL import Image

class ImageOptimizer:
    TARGET_SIZE = (1000, 1000)
    
    @staticmethod
    def has_transparency(img: Image.Image) -> bool:
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Check if there are actually transparent pixels
            if img.mode == 'P':
                img = img.convert('RGBA')
            extrema = img.getextrema()
            if len(extrema) == 4:
                if extrema[3][0] < 255:
                    return True
        return False

    @classmethod
    def optimize_image(cls, file_path: str) -> str:
        """
        Lee una imagen, la redimensiona a 1000x1000 (manteniendo proporción),
        agrega padding transparente o blanco según corresponda, y guarda como WEBP.
        Retorna la ruta del nuevo archivo WEBP.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")
            
        with Image.open(file_path) as img:
            # Detectar transparencia
            is_transparent = cls.has_transparency(img)
            
            if is_transparent:
                img = img.convert("RGBA")
                bg_color = (255, 255, 255, 0) # Transparente
            else:
                img = img.convert("RGB")
                bg_color = (255, 255, 255) # Blanco puro
                
            # Calcular nuevas dimensiones manteniendo la proporción
            img.thumbnail(cls.TARGET_SIZE, Image.Resampling.LANCZOS)
            
            # Crear lienzo de 1000x1000
            new_img = Image.new(img.mode, cls.TARGET_SIZE, bg_color)
            
            # Pegar en el centro
            paste_x = (cls.TARGET_SIZE[0] - img.size[0]) // 2
            paste_y = (cls.TARGET_SIZE[1] - img.size[1]) // 2
            
            if is_transparent:
                # Si es transparente, usamos el canal alfa como máscara para pegar
                new_img.paste(img, (paste_x, paste_y), img)
            else:
                new_img.paste(img, (paste_x, paste_y))
                
            # Generar nombre de salida .webp
            dir_name = os.path.dirname(file_path)
            base_name = os.path.basename(file_path)
            name_without_ext = os.path.splitext(base_name)[0]
            out_filename = f"{name_without_ext}.webp"
            out_filepath = os.path.join(dir_name, out_filename)
            
            # Guardar como WEBP
            # optimize=True is standard for webp
            # quality 80 es buen balance de peso y calidad visual
            new_img.save(out_filepath, "WEBP", quality=80, method=6)
            
            return out_filepath
