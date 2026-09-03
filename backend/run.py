"""
Entry point for the Appointment System backend.

Run with:
    python run.py

The server starts on http://0.0.0.0:5000 and attempts to connect to
MySQL immediately.  If MySQL is offline at startup the server still
starts; it will retry the connection on incoming requests.
"""
from app import create_app
from app import database as _db_module
import os

flask_app = create_app()

if __name__ == "__main__":
    # Attempt DB initialisation at startup (only on main worker in reloader mode)
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not flask_app.debug:
        with flask_app.app_context():
            print("[*] Attempting database initialisation at startup...")
            _db_module.init_db_with_retry(flask_app)

    flask_app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=True,
    )
