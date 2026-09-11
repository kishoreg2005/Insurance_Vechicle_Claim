from backend.routers.auth_router import router as auth_router
from backend.routers.user_router import router as user_router
from backend.routers.admin_router import router as admin_router

__all__ = ["auth_router", "user_router", "admin_router"]
