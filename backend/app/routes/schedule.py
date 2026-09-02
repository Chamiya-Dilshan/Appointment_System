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

schedule_bp = Blueprint("schedule", __name__)

VALID_ROLES = {"Secretary", "Deputy Minister", "Minister"}


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/schedule
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.get("/")
def get_schedule():
    """
    Return all allowed booking dates grouped by officer role.

    Response shape:
        {
          "Secretary":       ["2026-09-01", ...],
          "Deputy Minister": ["2026-09-03", ...],
          "Minister":        ["2026-09-05", ...]
        }
    """
    try:
        rows = AllowedDate.query.all()

        grouped: dict = {role: [] for role in VALID_ROLES}
        for row in rows:
            if row.role in grouped:
                grouped[row.role].append(row.date)
            else:
                # Support any future roles added directly to the DB
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

@schedule_bp.post("/")
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

@schedule_bp.delete("/")
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
