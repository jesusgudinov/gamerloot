from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="Gamer Loot E-Commerce API",
    description="API robusta para la plataforma multi-almacén de Gamer Loot.",
    version="1.0.0"
)

# Configuración de CORS
import os

environment = os.getenv("ENVIRONMENT", "development")

if environment == "production":
    origins = [
        "https://gamerloot.com.mx",
        "https://www.gamerloot.com.mx",
    ]
else:
    origins = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if environment == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

from app.routers import auth, products, sync, catalog, marketing, sales, clients, shipping, roles, users, storefront, checkout, mapping, interactions, addresses, rma, configurator, uploads, support, invoices, stripe_payments

from app.api.deps import get_current_active_user, require_permissions
from fastapi import Depends

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Productos"])
app.include_router(catalog.router, prefix="/api/v1/catalog", tags=["Catálogo Maestro"])
app.include_router(marketing.router, prefix="/api/v1/marketing", tags=["Marketing"], dependencies=[Depends(require_permissions(["manage_marketing"]))])
app.include_router(sales.router, prefix="/api/v1/sales", tags=["Ventas y Pedidos"])
app.include_router(rma.router, prefix="/api/v1/sales/rma", tags=["RMA (Garantías)"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["Clientes"], dependencies=[Depends(require_permissions(["manage_clients"]))])
app.include_router(addresses.router, prefix="/api/v1/addresses", tags=["Direcciones"], dependencies=[Depends(get_current_active_user)])
app.include_router(sync.router, prefix="/api/v1/sync", tags=["Motor de Sincronización"], dependencies=[Depends(require_permissions(["manage_sync"]))])
app.include_router(shipping.router, prefix="/api/v1/shipping", tags=["Logística y Envíos"], dependencies=[Depends(require_permissions(["manage_shipping"]))])
app.include_router(roles.router, prefix="/api/v1/roles", tags=["Seguridad y Roles"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Usuarios y Equipo"])
app.include_router(storefront.router, prefix="/api/v1/storefront", tags=["Tienda Pública"])
app.include_router(checkout.router, prefix="/api/v1/checkout", tags=["Checkout"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Facturación"])
app.include_router(configurator.router, prefix="/api/v1/configurator", tags=["Configurador de PC"])
app.include_router(mapping.router, prefix="/api/v1/mapping", tags=["Mapeo de Taxonomías"], dependencies=[Depends(require_permissions(["manage_catalog"]))])
app.include_router(interactions.router, prefix="/api/v1/interactions", tags=["Reseñas y Q&A"])
app.include_router(support.router, prefix="/api/v1/support", tags=["Soporte y Tickets"])
app.include_router(uploads.router, prefix="/api/v1/uploads", tags=["Archivos y Bucket"])
app.include_router(stripe_payments.router, prefix="/api/v1/stripe", tags=["Pagos (Stripe)"])

from app.routers import webhooks
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])

# Servir archivos estáticos del bucket local
os.makedirs("uploads/images", exist_ok=True)
os.makedirs("media/products/techsmart", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/media", StaticFiles(directory="media"), name="media")
@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Gamer Loot"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
