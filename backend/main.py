from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings
from backend.routers.auth_router import router as auth_router
from backend.routers.user_router import router as user_router
from backend.routers.admin_router import router as admin_router
from backend.db.seed import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI-based Vehicle Damage Assessment System for Insurance Claim Verification",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static mounts for uploaded images and generated PDF reports
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")

# Include Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    print("[*] Performing database initialization and seeding...")
    try:
        seed_database()
        print("[SUCCESS] Backend startup sequence complete.")
    except Exception as e:
        print(f"[!] Warning during startup seeding: {e}")

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "operational",
        "docs": "/docs",
        "api": settings.API_V1_STR
    }

@app.get("/api/health")
def health_check():
    from backend.db.firebase_db import firebase_db
    return {
        "status": "healthy",
        "service": "SecureClaim AI Backend",
        "database": {
            "connected": bool(firebase_db.cloud_reachable),
            "url": firebase_db.base_url,
            "mode": "cloud+local" if firebase_db.cloud_reachable else "local-only",
            "error": firebase_db.cloud_error,
        },
    }
