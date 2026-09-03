"""
Application factory.

Usage
-----
    from app import create_app
    flask_app = create_app()        # uses 'development' config by default
"""
from __future__ import annotations

import os
import time

from flask import Flask, jsonify

from app.config import config_map, Config
from app.extensions import db, cors


def create_app(env: str | None = None) -> Flask:
    """
    Create and configure a Flask application instance.

    Parameters
    ----------
    env : str, optional
        Name of the environment key in ``config_map`` ('development' or
        'production').  Defaults to the ``FLASK_ENV`` environment variable,
        or 'development' if that is not set.
    """
    if env is None:
        env = os.getenv("FLASK_ENV", "development")

    flask_app = Flask(__name__)
    flask_app.url_map.strict_slashes = False

    # ── Load config ──────────────────────────────────────────────────────────
    cfg_class = config_map.get(env, config_map["development"])
    cfg_instance = cfg_class()

    flask_app.config.from_object(cfg_instance)

    # Expose raw DB connection params so database.py can use them directly
    flask_app.config["DB_USER"] = cfg_instance.DB_USER
    flask_app.config["DB_PASSWORD"] = cfg_instance.DB_PASSWORD
    flask_app.config["DB_HOST"] = cfg_instance.DB_HOST
    flask_app.config["DB_PORT"] = cfg_instance.DB_PORT
    flask_app.config["DB_NAME"] = cfg_instance.DB_NAME

    # The SQLALCHEMY_DATABASE_URI is a @property on the config class, so we
    # need to evaluate it explicitly and store it under the expected key.
    flask_app.config["SQLALCHEMY_DATABASE_URI"] = cfg_instance.SQLALCHEMY_DATABASE_URI

    # ── Initialise extensions ────────────────────────────────────────────────
    db.init_app(flask_app)
    cors.init_app(flask_app, resources={r"/api/*": {"origins": "*"}})  # type: ignore[arg-type]

    # ── Register blueprints ──────────────────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.appointments import appointments_bp
    from app.routes.schedule import schedule_bp

    flask_app.register_blueprint(auth_bp,          url_prefix="/api")
    flask_app.register_blueprint(appointments_bp,  url_prefix="/api/appointments")
    flask_app.register_blueprint(schedule_bp,      url_prefix="/api/schedule")

    # ── Database connectivity guard ──────────────────────────────────────────
    from app import database as _db_module

    _last_retry: dict = {"t": 0.0}

    @flask_app.before_request
    def ensure_db_ready():  # type: ignore[return]
        """
        On every incoming request, check whether the database is connected.
        If not, attempt a reconnect at most once every RETRY_INTERVAL seconds
        to avoid per-request blocking on Windows.
        Returns a 503 JSON response if the database is still unreachable.
        """
        if _db_module.db_connected:
            return  # Fast path — already connected

        now = time.time()
        if now - _last_retry["t"] >= _db_module.RETRY_INTERVAL:
            _last_retry["t"] = now
            with flask_app.app_context():
                _db_module.init_db_with_retry(flask_app)

        if not _db_module.db_connected:
            return jsonify({
                "error": "Database Offline",
                "message": (
                    "Unable to connect to the MySQL database server. "
                    "Please ensure MySQL is running and configured correctly in backend/.env"
                ),
                "details": _db_module.db_connection_error,
            }), 503

    return flask_app
