import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.api.deps import get_current_active_user, require_permissions
from app.models.user import User
from app.services.storage import storage_service

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/avif": ".avif"
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB en bytes

@router.post("/image", summary="Sube una imagen al bucket local")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Endpoint seguro para cargar imágenes al Bucket.
    Cualquier usuario activo (logueado en el panel) puede subir imágenes (puede restringirse con RBAC).
    """
    # 1. Validar Tipo de Archivo (MIME Type y extensión)
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de archivo no soportado: {file.content_type}. Solo se permiten JPG, PNG, WEBP, AVIF, GIF y SVG."
        )
        
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_MIME_TYPES.values() and ext not in [".jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Extensión de archivo inválida: {ext}."
        )

    # 2. Validar Tamaño del Archivo (Límite 5MB)
    try:
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"El archivo excede el límite máximo de 5MB."
            )
    finally:
        # Importante: reiniciar el cursor de lectura para que el StorageService pueda leerlo
        await file.seek(0)
        
    # 3. Guardar en el Storage Service (Bucket)
    file_url = await storage_service.save_file(file, folder="images")
    
    return {"url": file_url, "filename": file.filename, "size_bytes": len(contents)}
