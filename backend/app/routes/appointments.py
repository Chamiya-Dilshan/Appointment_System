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
from app.services.notification_service import (
    notify_appointment_created,
    notify_appointment_status_updated,
    is_smtp_configured,
    is_sms_configured,
    test_smtp_connection,
)

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

@appointments_bp.route("", methods=["GET"])
@appointments_bp.route("/", methods=["GET"])
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

@appointments_bp.route("", methods=["POST"])
@appointments_bp.route("/", methods=["POST"])
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

        # Asynchronously dispatch confirmation email & SMS
        appt_dict = appt.to_dict()
        notify_appointment_created(appt_dict)

        return jsonify(appt_dict), 201

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

        remark = data.get("cancellationRemark", "") if new_status == "Cancelled" else None
        appt.status = new_status
        appt.cancellationRemark = remark

        db.session.commit()

        # Asynchronously notify user about confirmation or cancellation
        appt_dict = appt.to_dict()
        notify_appointment_status_updated(appt_dict, new_status=new_status, remark=remark or "")

        return jsonify(appt_dict), 200

    except Exception as exc:  # noqa: BLE001
        db.session.rollback()
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/appointments/<id>/resend-notification
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.post("/<int:appt_id>/resend-notification")
def resend_appointment_notification(appt_id: int):
    """
    Re-dispatch email and SMS confirmation notification for an existing appointment.
    """
    try:
        appt = db.session.get(Appointment, appt_id)
        if appt is None:
            return jsonify({"error": "Appointment not found"}), 404

        appt_dict = appt.to_dict()
        if appt.status == "Confirmed":
            notify_appointment_status_updated(appt_dict, new_status="Confirmed")
        elif appt.status == "Cancelled":
            notify_appointment_status_updated(appt_dict, new_status="Cancelled", remark=appt.cancellationRemark or "")
        else:
            notify_appointment_created(appt_dict)

        return jsonify({
            "success": True,
            "message": f"Notification dispatched for appointment {appt.refNo}",
            "appointment": appt_dict,
            "isLiveEmail": is_smtp_configured(),
            "isLiveSms": is_sms_configured(),
        }), 200

    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/appointments/test-email
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.post("/test-email")
def test_email_endpoint():
    """
    Diagnostic endpoint to test live email delivery with currently configured SMTP credentials.
    Optional JSON payload: { "email": "recipient@example.com" }
    """
    data = request.get_json(silent=True) or {}
    target_email = data.get("email")
    success, msg = test_smtp_connection(target_email)
    return jsonify({
        "success": success,
        "message": msg,
        "isLiveEmail": is_smtp_configured(),
    }), (200 if success else 400)


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
