"""
Models package — import all models here so SQLAlchemy discovers them
when create_all() is called.
"""
from app.models.user import User
from app.models.appointment import Appointment
from app.models.allowed_date import AllowedDate

__all__ = ["User", "Appointment", "AllowedDate"]
