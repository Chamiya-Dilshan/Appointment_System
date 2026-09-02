"""
Appointments blueprint.

Routes
------
GET    /api/appointments              — list all appointments (newest first)
POST   /api/appointments              — create a new appointment
PUT    /api/appointments/<id>/status  — update status (Pending/Confirmed/Cancelled)
DELETE /api/appointments/<id>         — permanently delete an appointment
"""
from __future__ import annotations

import datetime
import time

from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.appointment import Appointment

appointments_bp = Blueprint("appointments", __name__)

VALID_STATUSES = {"Pending", "Confirmed", "Cancelled"}

REQUIRED_FIELDS = [
    "name", "reason", "phone", "email", "date", "time",
    "refNo", "nic", "district", "province", "council",
    "gsDivision", "address", "postalCode", "officer",
]


def auto_cancel_past_pending() -> int:
    """
    Auto-cancel past appointments whose date is strictly before today (YYYY-MM-DD)
    and still in 'Pending' status, persisting the cancellation directly to MySQL.
    """
    today_str = datetime.date.today().isoformat()
    past_pending = Appointment.query.filter(
        Appointment.date < today_str,
        Appointment.status == "Pending",
    ).all()

    if past_pending:
        for appt in past_pending:
            appt.status = "Cancelled"
            if not appt.cancellationRemark:
                appt.cancellationRemark = "Auto-cancelled: Appointment date expired"
        db.session.commit()
        return len(past_pending)
    return 0


# ──────────────────────────────────────────────────────────────────────────────
# GET /api/appointments
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.get("/")
def get_appointments():
    """
    Return all appointments ordered by id descending (newest first).
    Automatically cancels any past pending appointments in the database before returning.
    """
    try:
        auto_cancel_past_pending()
        appts = Appointment.query.order_by(Appointment.id.desc()).all()
        return jsonify([a.to_dict() for a in appts]), 200
    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/appointments
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.post("/")
def create_appointment():
    """
    Create a new appointment.

    The frontend sends a `Date.now()` timestamp as `id`.  We honour that value
    if present, otherwise we generate one from the current server time.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    # Validate all required fields are present
    missing = [f for f in REQUIRED_FIELDS if f not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        appt_id: int = int(data.get("id", int(time.time() * 1000)))

        appt = Appointment(
            id=appt_id,
            name=data["name"],
            reason=data["reason"],
            phone=data["phone"],
            email=data["email"],
            date=data["date"],
            time=data["time"],
            status=data.get("status", "Pending"),
            refNo=data["refNo"],
            nic=data["nic"],
            district=data["district"],
            province=data["province"],
            council=data["council"],
            gsDivision=data["gsDivision"],
            address=data["address"],
            postalCode=data["postalCode"],
            officer=data["officer"],
        )
        db.session.add(appt)
        db.session.commit()
        return jsonify(appt.to_dict()), 201

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# PUT /api/appointments/<id>/status
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.put("/<int:appt_id>/status")
def update_appointment_status(appt_id: int):
    """
    Update the status of an existing appointment.

    Request body (JSON):
        {
          "status": "Confirmed" | "Pending" | "Cancelled",
          "cancellationRemark": "optional remark when cancelling"
        }
    """
    data = request.get_json(silent=True)
    if not data or "status" not in data:
        return jsonify({"error": 'Field "status" is required'}), 400

    new_status: str = data["status"]
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"}), 400

    try:
        appt = db.session.get(Appointment, appt_id)
        if appt is None:
            return jsonify({"error": "Appointment not found"}), 404

        appt.status = new_status
        if new_status == "Cancelled":
            appt.cancellationRemark = data.get("cancellationRemark", "")
        else:
            appt.cancellationRemark = None

        db.session.commit()
        return jsonify(appt.to_dict()), 200

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# DELETE /api/appointments/<id>
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.delete("/<int:appt_id>")
def delete_appointment(appt_id: int):
    """Permanently remove an appointment record."""
    try:
        appt = db.session.get(Appointment, appt_id)
        if appt is None:
            return jsonify({"error": "Appointment not found"}), 404

        db.session.delete(appt)
        db.session.commit()
        return jsonify({"success": True}), 200

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500
