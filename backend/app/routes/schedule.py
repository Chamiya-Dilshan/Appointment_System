"""
Schedule blueprint — manages which calendar dates are open for bookings
per ministerial officer role.

Routes
------
GET    /api/schedule              — return all dates grouped by role
POST   /api/schedule              — add an allowed date for a role
DELETE /api/schedule?role=&date=  — remove an allowed date for a role
"""
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.allowed_date import AllowedDate
from app.utils.auth_guard import jwt_required
import datetime

schedule_bp = Blueprint("schedule", __name__)

VALID_ROLES = {"Secretary", "Deputy Minister", "Minister"}


def get_upcoming_public_days(weeks: int = 12) -> list[str]:
    """Return ISO date strings of upcoming Mondays (official Public Days for Secretary & Minister)."""
    today = datetime.date.today()
    public_days = []
    # Monday is weekday == 0 in Python
    days_ahead = (0 - today.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    start_date = today + datetime.timedelta(days=days_ahead)
    for i in range(weeks):
        d = start_date + datetime.timedelta(weeks=i)
        public_days.append(d.isoformat())
    return public_days


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/schedule
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.route("", methods=["GET"])
@schedule_bp.route("/", methods=["GET"])
def get_schedule():
    """
    Return all allowed booking dates grouped by officer role.
    Automatically includes all upcoming official Public Days (Mondays)
    plus any specially configured dates from the database.
    """
    try:
        rows = AllowedDate.query.all()
        upcoming_mondays = get_upcoming_public_days(weeks=12)

        grouped: dict = {role: list(upcoming_mondays) for role in VALID_ROLES}
        for row in rows:
            if row.role in grouped:
                if row.date not in grouped[row.role]:
                    grouped[row.role].append(row.date)
            else:
                grouped[row.role] = [row.date]

        # Sort each role's dates chronologically
        for role in grouped:
            grouped[role].sort()

        return jsonify(grouped), 200

    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/schedule
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.route("", methods=["POST"])
@schedule_bp.route("/", methods=["POST"])
@jwt_required
def add_allowed_date():
    """
    Enable a new booking date for a role.

    Request body (JSON):
        { "role": "Secretary", "date": "2026-09-10" }
    """
    data = request.get_json(silent=True)
    if not data or "role" not in data or "date" not in data:
        return jsonify({"error": 'Fields "role" and "date" are required'}), 400

    role: str = data["role"]
    date_val: str = data["date"]

    try:
        # Prevent duplicate entries for the same role + date combination
        existing = AllowedDate.query.filter_by(role=role, date=date_val).first()
        if existing:
            return jsonify({"error": "Date is already enabled for this role"}), 400

        new_entry = AllowedDate(role=role, date=date_val)
        db.session.add(new_entry)
        db.session.commit()
        return jsonify(new_entry.to_dict()), 201

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/schedule?role=Secretary&date=2026-09-10
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.route("", methods=["DELETE"])
@schedule_bp.route("/", methods=["DELETE"])
@jwt_required
def remove_allowed_date():
    """
    Disable a booking date for a role.

    Query parameters:
        role — officer role (e.g. Secretary)
        date — date string in YYYY-MM-DD format
    """
    role = request.args.get("role", "").strip()
    date_val = request.args.get("date", "").strip()

    if not role or not date_val:
        return jsonify({"error": 'Query parameters "role" and "date" are required'}), 400

    try:
        entry = AllowedDate.query.filter_by(role=role, date=date_val).first()
        if entry is None:
            return jsonify({"error": "Allowed date mapping not found"}), 404

        db.session.delete(entry)
        db.session.commit()
        return jsonify({"success": True}), 200

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500
