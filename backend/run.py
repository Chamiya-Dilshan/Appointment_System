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

flask_app = create_app()

if __name__ == "__main__":
    # Attempt DB initialisation at startup so the first request is fast
    with flask_app.app_context():
        print("[*] Attempting database initialisation at startup...")
        _db_module.init_db_with_retry(flask_app)

    flask_app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False,  # Disabled to prevent double DB init with the reloader
    )
