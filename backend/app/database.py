"""
Database initialisation, connectivity check, and seed data.

Separated from the app factory so this logic is easy to test
and reason about independently.
"""
from __future__ import annotations

import socket
import time

import pymysql
from werkzeug.security import generate_password_hash

# These are imported lazily (inside functions) to avoid circular imports
# at module-import time.


# ──────────────────────────────────────────────────────────────────────────────
# Connection state (module-level singletons)
# ──────────────────────────────────────────────────────────────────────────────

db_connected: bool = False
db_connection_error: str | None = None
_last_retry_time: float = 0.0
RETRY_INTERVAL: int = 10  # seconds between reconnect attempts


# ──────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────────

def _can_reach_mysql(host: str, port: int) -> bool:
    """
    Quick TCP port check with a hard 3-second timeout.
    Prevents pymysql from hanging indefinitely on Windows when MySQL is down.
    """
    try:
        sock = socket.create_connection((host, port), timeout=3)
        sock.close()
        return True
    except OSError:
        return False


def _ensure_database_exists(host: str, user: str, password: str, port: int, db_name: str) -> None:
    """Connect to MySQL without a target DB and CREATE DATABASE IF NOT EXISTS."""
    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        port=port,
        connect_timeout=3,
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}`")
        conn.commit()
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def init_db_with_retry(app) -> bool:  # type: ignore[type-arg]
    """
    Attempt to connect to MySQL, create the database if missing, create all
    tables, and seed initial data.  Updates module-level state flags so the
    before_request hook can respond without retrying on every request.

    Returns True on success, False on failure.
    """
    global db_connected, db_connection_error

    if db_connected:
        return True

    # Resolve config values from the Flask app
    cfg = app.config

    # Parse the DB URI to extract host/port/user/password/name
    db_user: str = cfg.get("DB_USER", "root")
    db_password: str = cfg.get("DB_PASSWORD", "")
    db_host: str = cfg.get("DB_HOST", "localhost")
    db_port: int = int(cfg.get("DB_PORT", 3306))
    db_name: str = cfg.get("DB_NAME", "appointment_system")

    try:
        # Fast TCP check first — avoids pymysql hanging on Windows
        if not _can_reach_mysql(db_host, db_port):
            raise ConnectionRefusedError(
                f"Cannot reach MySQL at {db_host}:{db_port}. Is MySQL running?"
            )

        # Make sure the target database exists
        _ensure_database_exists(db_host, db_user, db_password, db_port, db_name)

        # Import here to avoid circular imports at module level
        from app.extensions import db
        import app.models  # noqa: F401  — registers all models with SQLAlchemy

        # Create tables for all registered models
        db.create_all()

        # Ensure appointments.id is BIGINT and gsDivision is nullable in MySQL
        try:
            from sqlalchemy import text
            db.session.execute(text("ALTER TABLE appointments MODIFY COLUMN id BIGINT NOT NULL;"))
            db.session.execute(text("ALTER TABLE appointments MODIFY COLUMN gsDivision VARCHAR(100) NULL;"))
            db.session.commit()
        except Exception:
            db.session.rollback()

        # Ensure completionRemark column exists in MySQL
        try:
            from sqlalchemy import text
            db.session.execute(text("ALTER TABLE appointments ADD COLUMN completionRemark TEXT NULL;"))
            db.session.commit()
        except Exception:
            db.session.rollback()

        # Populate with initial mock data (no-op if data already exists)
        seed_database()

        # Auto-cancel any past pending appointments in the DB on startup
        from app.routes.appointments import auto_cancel_past_pending
        auto_cancel_past_pending()

        db_connected = True
        db_connection_error = None
        print("[OK] Database connected and initialised successfully.")
        return True

    except Exception as exc:  # noqa: BLE001
        db_connection_error = str(exc)
        db_connected = False
        print(f"[WARN] Database connection failed: {exc}")
        return False


def seed_database() -> None:
    """
    Populate the database with initial mock users, appointments, and
    allowed booking dates.  Runs only when the users table is empty.
    """
    from app.extensions import db
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.allowed_date import AllowedDate

    if User.query.first() is not None:
        return  # Already seeded

    print("[*] Seeding database with initial mock data...")

    # ── Users ────────────────────────────────────────────────────────────────
    users = [
        User(
            username="secretary",
            name="Secretary of Ministry",
            role="Secretary",
            password_hash=generate_password_hash("password123"),
        ),
        User(
            username="deputy_minister",
            name="Deputy Minister",
            role="Deputy Minister",
            password_hash=generate_password_hash("password123"),
        ),
        User(
            username="minister",
            name="Hon. Minister",
            role="Minister",
            password_hash=generate_password_hash("password123"),
        ),
    ]
    db.session.add_all(users)

    # ── Appointments ─────────────────────────────────────────────────────────
    appointments = [
        # Secretary appointments
        Appointment(id=1, name="Sarah Connor", reason="General Consultation", date="2026-08-24",
                    time="10:00 AM", status="Confirmed", phone="+1 555-0199",
                    email="sarah.c@cyberdyne.com", refNo="APPT-5B9C2D", nic="198412345678",
                    district="Colombo", province="Western", council="Colombo Municipal Council",
                    gsDivision="Fort", address="Cyberdyne HQ, Colombo", postalCode="00100",
                    officer="Secretary"),
        Appointment(id=2, name="John Doe", reason="Dental Cleaning", date="2026-08-24",
                    time="11:30 AM", status="Pending", phone="+1 555-0143",
                    email="john.doe@gmail.com", refNo="APPT-9X4E1F", nic="199098765432",
                    district="Kandy", province="Central", council="Kandy Municipal Council",
                    gsDivision="Katugastota", address="45, Peradeniya Rd, Kandy", postalCode="20000",
                    officer="Secretary"),
        Appointment(id=3, name="Bruce Wayne", reason="Therapy Session", date="2026-08-25",
                    time="03:00 PM", status="Confirmed", phone="+1 555-0100",
                    email="bruce@waynecorp.com", refNo="APPT-2A7D8K", nic="197544332211",
                    district="Galle", province="Southern", council="Galle Municipal Council",
                    gsDivision="Fort", address="Wayne Manor, Galle", postalCode="80000",
                    officer="Secretary"),
        Appointment(id=4, name="Clark Kent", reason="Eye Examination", date="2026-08-23",
                    time="09:00 AM", status="Cancelled", phone="+1 555-0112",
                    email="clark.k@dailyplanet.com", refNo="APPT-3H8J9P", nic="198088776655",
                    district="Gampaha", province="Western", council="Gampaha Municipal Council",
                    gsDivision="Kadawatha", address="32, Kandy Rd, Kadawatha", postalCode="11850",
                    officer="Secretary",
                    cancellationRemark="Urgent assignment at the Daily Planet"),
        Appointment(id=5, name="Diana Prince", reason="Cardiology Check", date="2026-08-25",
                    time="02:00 PM", status="Pending", phone="+1 555-0125",
                    email="diana@themyscira.gov", refNo="APPT-4Y9L0Q", nic="198555443322",
                    district="Jaffna", province="Northern", council="Jaffna Municipal Council",
                    gsDivision="Nallur", address="Temple Rd, Nallur, Jaffna", postalCode="40000",
                    officer="Secretary"),
        # Deputy Minister appointments
        Appointment(id=6, name="Arthur Dent", reason="Sandwich Making consultation",
                    date="2026-08-27", time="09:30 AM", status="Confirmed",
                    phone="+44 7700 900077", email="arthur.dent@prefect.com",
                    refNo="APPT-6F8G9H", nic="197943210987", district="Colombo",
                    province="Western", council="Colombo Municipal Council",
                    gsDivision="Kollupitiya", address="12, Galle Rd, Colombo", postalCode="00300",
                    officer="Deputy Minister"),
        Appointment(id=7, name="Tricia McMillan", reason="Astrophysics Discussion",
                    date="2026-08-28", time="11:00 AM", status="Pending",
                    phone="+44 7700 900088", email="trillian@heartofgold.org",
                    refNo="APPT-7I9J0K", nic="198112345098", district="Kandy",
                    province="Central", council="Kandy Municipal Council",
                    gsDivision="Peradeniya", address="Royal Botanic Gardens, Kandy",
                    postalCode="20400", officer="Deputy Minister"),
        # Minister appointments
        Appointment(id=8, name="Ford Prefect", reason="Guide Entry Updates",
                    date="2026-08-28", time="02:00 PM", status="Confirmed",
                    phone="+1 555-4242", email="ford@hitchhikers.guide",
                    refNo="APPT-8L0M1N", nic="197822446688", district="Galle",
                    province="Southern", council="Galle Municipal Council",
                    gsDivision="Fort", address="Light House Street, Galle Fort",
                    postalCode="80000", officer="Minister"),
        Appointment(id=9, name="Zaphod Beeblebrox", reason="Ego Boost Interview",
                    date="2026-08-31", time="04:00 PM", status="Pending",
                    phone="+1 555-9999", email="president@galaxy.gov",
                    refNo="APPT-9O1P2Q", nic="197011335577", district="Jaffna",
                    province="Northern", council="Jaffna Municipal Council",
                    gsDivision="Chunnakam", address="Kankesanthurai Rd, Jaffna",
                    postalCode="40000", officer="Minister"),
    ]
    db.session.add_all(appointments)

    # ── Allowed Booking Dates ────────────────────────────────────────────────
    default_dates: dict[str, list[str]] = {
        "Secretary":       ["2026-08-26", "2026-08-27", "2026-08-28", "2026-09-01", "2026-09-02"],
        "Deputy Minister": ["2026-08-27", "2026-08-28", "2026-08-29", "2026-09-03", "2026-09-04"],
        "Minister":        ["2026-08-28", "2026-08-31", "2026-09-02", "2026-09-05", "2026-09-06"],
    }
    for role, dates in default_dates.items():
        for d in dates:
            db.session.add(AllowedDate(role=role, date=d))

    db.session.commit()
    print("[OK] Database seeding complete.")
