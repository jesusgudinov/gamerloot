import os
import uuid
import shutil
from abc import ABC, abstractmethod
from fastapi import UploadFile, HTTPException
from typing import Optional

class StorageService(ABC):
    @abstractmethod
    async def save_file(self, file: UploadFile, folder: str = "images") -> str:
        """Guarda un archivo y retorna su URL pública"""
        pass
    
    @abstractmethod
    async def delete_file(self, file_url: str) -> bool:
        """Elimina un archivo dado su URL pública"""
        pass

class LocalStorageService(StorageService):
    def __init__(self, base_upload_dir: str = "uploads", base_url: str = "/uploads"):
        self.base_upload_dir = base_upload_dir
        self.base_url = base_url
        
        # Asegurar que el directorio base exista
        os.makedirs(self.base_upload_dir, exist_ok=True)
        os.makedirs(os.path.join(self.base_upload_dir, "images"), exist_ok=True)

    async def save_file(self, file: UploadFile, folder: str = "images") -> str:
        # Generar un nombre único para evitar colisiones
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        target_dir = os.path.join(self.base_upload_dir, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        file_path = os.path.join(target_dir, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al guardar el archivo: {str(e)}")
        finally:
            file.file.close()
            
        # Retorna la ruta relativa que StaticFiles interceptará
        return f"{self.base_url}/{folder}/{unique_filename}"

    async def delete_file(self, file_url: str) -> bool:
        # Extraer la ruta local desde la URL (Ej: /uploads/images/abc.jpg -> uploads/images/abc.jpg)
        if file_url.startswith(self.base_url):
            relative_path = file_url[len(self.base_url):].lstrip('/')
            file_path = os.path.join(self.base_upload_dir, relative_path)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        return False

# Inyección de dependencias para el servicio de almacenamiento
# Cuando se pase a producción (AWS S3), simplemente se cambiará esta instancia
storage_service = LocalStorageService()
