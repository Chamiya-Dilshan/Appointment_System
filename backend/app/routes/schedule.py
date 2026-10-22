"""
Schedule blueprint — manages which calendar dates are open for bookings
per ministerial officer role, including handling unavailability / cancellations
of default public days (Mondays) or custom dates.

Routes
------
GET    /api/schedule                  — return all active allowed dates grouped by role
POST   /api/schedule                  — add/enable an allowed date for a role
DELETE /api/schedule?role=&date=      — disable a booking date for a role (makes public day unavailable)
GET    /api/schedule/unavailable      — return all dates marked unavailable grouped by role
POST   /api/schedule/unavailable      — explicitly mark an officer unavailable on a date
DELETE /api/schedule/unavailable      — restore officer availability for a date
"""
from __future__ import annotations

import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.allowed_date import AllowedDate
from app.models.unavailable_date import UnavailableDate
from app.models.appointment import Appointment
from app.utils.auth_guard import jwt_required

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
    plus any specially configured dates from the database,
    excluding any dates marked as unavailable.
    """
    try:
        allowed_rows = AllowedDate.query.all()
        unavailable_rows = UnavailableDate.query.all()
        upcoming_mondays = get_upcoming_public_days(weeks=12)

        # Build set of unavailable dates per role: { role: { "2026-10-26", ... } }
        unavailable_map: dict[str, set[str]] = {role: set() for role in VALID_ROLES}
        for u in unavailable_rows:
            if u.role in unavailable_map:
                unavailable_map[u.role].add(u.date)
            else:
                unavailable_map[u.role] = {u.date}

        grouped: dict[str, list[str]] = {
            role: [d for d in upcoming_mondays if d not in unavailable_map.get(role, set())]
            for role in VALID_ROLES
        }

        for row in allowed_rows:
            if row.role not in grouped:
                grouped[row.role] = []
            # Only include if not explicitly marked unavailable
            if row.date not in unavailable_map.get(row.role, set()):
                if row.date not in grouped[row.role]:
                    grouped[row.role].append(row.date)

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
    Enable a booking date for a role.
    If the date was marked unavailable, restores its availability.

    Request body (JSON):
        { "role": "Secretary", "date": "2026-09-10" }
    """
    data = request.get_json(silent=True)
    if not data or "role" not in data or "date" not in data:
        return jsonify({"error": 'Fields "role" and "date" are required'}), 400

    role: str = str(data["role"]).strip()
    date_val: str = str(data["date"]).strip()

    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"}), 400

    user_role = getattr(g, "user_role", None)
    if user_role and role != user_role:
        return jsonify({
            "error": "Forbidden",
            "message": f"Access denied: You are only authorized to manage schedule dates for your assigned role ({user_role})."
        }), 403

    try:
        # If this date was previously marked unavailable, remove the unavailability
        unavail = UnavailableDate.query.filter_by(role=role, date=date_val).first()
        if unavail:
            db.session.delete(unavail)

        # Check if the date is a default Monday
        try:
            parsed = datetime.date.fromisoformat(date_val)
            is_monday = (parsed.weekday() == 0)
        except Exception:
            is_monday = False

        existing = AllowedDate.query.filter_by(role=role, date=date_val).first()
        if existing:
            db.session.commit()
            return jsonify(existing.to_dict()), 200

        if not is_monday:
            new_entry = AllowedDate(role=role, date=date_val)
            db.session.add(new_entry)
            db.session.commit()
            return jsonify(new_entry.to_dict()), 201
        else:
            db.session.commit()
            return jsonify({"role": role, "date": date_val}), 201

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
    If it was a custom allowed date, removes it.
    If it is a default public day (Monday), marks it in unavailable_dates.

    Query parameters:
        role — officer role (e.g. Secretary)
        date — date string in YYYY-MM-DD format
        reason — optional reason for unavailability
    """
    role = request.args.get("role", "").strip()
    date_val = request.args.get("date", "").strip()
    reason = request.args.get("reason", "Officer unavailable").strip()

    if not role or not date_val:
        return jsonify({"error": 'Query parameters "role" and "date" are required'}), 400

    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"}), 400

    user_role = getattr(g, "user_role", None)
    if user_role and role != user_role:
        return jsonify({
            "error": "Forbidden",
            "message": f"Access denied: You are only authorized to manage schedule dates for your assigned role ({user_role})."
        }), 403

    try:
        entry = AllowedDate.query.filter_by(role=role, date=date_val).first()
        if entry:
            db.session.delete(entry)

        # Check if it's a Monday (default public day) or general date
        try:
            parsed = datetime.date.fromisoformat(date_val)
            is_monday = (parsed.weekday() == 0)
        except Exception:
            is_monday = False

        # Mark in unavailable_dates so it is excluded from schedule
        if is_monday or entry is None:
            unavail = UnavailableDate.query.filter_by(role=role, date=date_val).first()
            if not unavail:
                unavail = UnavailableDate(role=role, date=date_val, reason=reason)
                db.session.add(unavail)

        db.session.commit()
        return jsonify({"success": True, "role": role, "date": date_val}), 200

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/schedule/unavailable
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.route("/unavailable", methods=["GET"])
def get_unavailable_dates():
    """
    Return all dates marked unavailable grouped by officer role.
    Optional query parameter:
        role — filter by specific officer role
    """
    try:
        role_filter = request.args.get("role", "").strip()
        query = UnavailableDate.query
        if role_filter:
            query = query.filter_by(role=role_filter)
        rows = query.order_by(UnavailableDate.date.asc()).all()

        grouped: dict[str, list[dict]] = {role: [] for role in VALID_ROLES}
        for row in rows:
            if row.role in grouped:
                grouped[row.role].append(row.to_dict())
            else:
                grouped[row.role] = [row.to_dict()]

        return jsonify(grouped), 200

    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/schedule/unavailable
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.route("/unavailable", methods=["POST"])
@jwt_required
def add_unavailable_date():
    """
    Explicitly mark an officer unavailable on a date (e.g. cancelled public day).

    Request body (JSON):
        {
            "role": "Secretary",
            "date": "2026-10-26",
            "reason": "Official overseas mission / Cabinet meeting"
        }
    """
    data = request.get_json(silent=True)
    if not data or "role" not in data or "date" not in data:
        return jsonify({"error": 'Fields "role" and "date" are required'}), 400

    role: str = str(data["role"]).strip()
    date_val: str = str(data["date"]).strip()
    reason: str = str(data.get("reason", "Officer unavailable")).strip()

    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"}), 400

    user_role = getattr(g, "user_role", None)
    if user_role and role != user_role:
        return jsonify({
            "error": "Forbidden",
            "message": f"Access denied: You are only authorized to manage unavailability for your assigned role ({user_role})."
        }), 403

    try:
        # Check if already marked unavailable
        existing = UnavailableDate.query.filter_by(role=role, date=date_val).first()
        if existing:
            if reason:
                existing.reason = reason
            db.session.commit()
            record = existing.to_dict()
        else:
            new_entry = UnavailableDate(role=role, date=date_val, reason=reason)
            db.session.add(new_entry)

            # Remove from AllowedDate if it was specially allowed
            allowed_entry = AllowedDate.query.filter_by(role=role, date=date_val).first()
            if allowed_entry:
                db.session.delete(allowed_entry)

            db.session.commit()
            record = new_entry.to_dict()

        # Check existing active appointments on this date
        affected_count = Appointment.query.filter(
            Appointment.officer == role,
            Appointment.date == date_val,
            Appointment.status.in_(["Pending", "Confirmed"])
        ).count()

        record["affected_appointments"] = affected_count
        return jsonify(record), 201

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/schedule/unavailable
# ──────────────────────────────────────────────────────────────────────────────

@schedule_bp.route("/unavailable", methods=["DELETE"])
@jwt_required
def remove_unavailable_date():
    """
    Restore officer availability for a date (remove from unavailable list).

    Query parameters or JSON body:
        role — officer role (e.g. Secretary)
        date — date string in YYYY-MM-DD format
    """
    role = request.args.get("role", "").strip()
    date_val = request.args.get("date", "").strip()

    if not role or not date_val:
        data = request.get_json(silent=True) or {}
        role = str(data.get("role", "")).strip()
        date_val = str(data.get("date", "")).strip()

    if not role or not date_val:
        return jsonify({"error": 'Parameters "role" and "date" are required'}), 400

    user_role = getattr(g, "user_role", None)
    if user_role and role != user_role:
        return jsonify({
            "error": "Forbidden",
            "message": f"Access denied: You are only authorized to restore availability for your assigned role ({user_role})."
        }), 403

    try:
        entry = UnavailableDate.query.filter_by(role=role, date=date_val).first()
        if entry is None:
            return jsonify({"error": "Unavailable date mapping not found"}), 404

        db.session.delete(entry)
        db.session.commit()
        return jsonify({"success": True, "message": "Officer availability restored for this date."}), 200

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500
