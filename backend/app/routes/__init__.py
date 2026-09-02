"""Routes package — exports all blueprints."""
from app.routes.auth import auth_bp
from app.routes.appointments import appointments_bp
from app.routes.schedule import schedule_bp

__all__ = ["auth_bp", "appointments_bp", "schedule_bp"]
