"""
Flask extensions — instantiated here so they can be imported
anywhere without triggering circular imports.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db: SQLAlchemy = SQLAlchemy()
cors: CORS = CORS()
