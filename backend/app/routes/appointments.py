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
import re
import time

from flask import Blueprint, request, jsonify
from app.extensions import db, limiter
from app.models.appointment import Appointment
from app.models.allowed_date import AllowedDate
from app.utils.auth_guard import jwt_required, decode_jwt
from app.utils.crypto import encrypt_field
from app.services.notification_service import (
    notify_appointment_created,
    notify_appointment_status_updated,
    is_smtp_configured,
    is_sms_configured,
    test_smtp_connection,
)

appointments_bp = Blueprint("appointments", __name__)

VALID_STATUSES = {"Pending", "Confirmed", "Cancelled", "Completed"}

REQUIRED_FIELDS = [
    "name", "reason", "phone", "date", "time",
    "refNo", "nic", "district", "province", "council",
    "address", "postalCode", "officer",
]

REQUIRED_OFFICIAL_FIELDS = [
    "name", "reason", "phone", "date", "time",
    "refNo", "officer",
]


def is_authenticated_admin() -> bool:
    """Check if the current incoming request is authenticated with a valid JWT."""
    auth_header = request.headers.get("Authorization", "").strip()
    if not auth_header:
        return False
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        try:
            decode_jwt(parts[1])
            return True
        except Exception:
            return False
    return False


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
@jwt_required
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
# GET /api/appointments/booked-slots
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.route("/booked-slots", methods=["GET"])
@limiter.limit("60 per minute")
def get_booked_slots():
    """
    Public endpoint returning active (date, time, officer) slots for conflict checking.
    Strictly excludes all citizen PII (names, phone, email, NIC, addresses).
    """
    try:
        appts = Appointment.query.filter(
            Appointment.status.in_(["Pending", "Confirmed", "Completed"])
        ).all()
        slots = [{"date": a.date, "time": a.time, "officer": a.officer} for a in appts]
        return jsonify(slots), 200
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# POST /api/appointments
# ──────────────────────────────────────────────────────────────────────────────

@appointments_bp.route("", methods=["POST"])
@appointments_bp.route("/", methods=["POST"])
@limiter.limit("15 per hour")
def create_appointment():
    """
    Create a new appointment.

    The frontend sends a `Date.now()` timestamp as `id`.  We honour that value
    if present, otherwise we generate one from the current server time.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    is_admin = is_authenticated_admin()
    meeting_type = data.get("meetingType", "Public Consultation")

    # Only authenticated administrators can schedule Official Meetings
    if meeting_type == "Official Meeting" and not is_admin:
        return jsonify({"error": "Official meetings can only be scheduled by ministry administrators."}), 403

    # Field validations based on appointment category
    if meeting_type == "Official Meeting":
        missing = [f for f in REQUIRED_OFFICIAL_FIELDS if f not in data or not str(data[f]).strip()]
        if missing:
            return jsonify({"error": f"Missing required fields for official meeting: {', '.join(missing)}"}), 400
    else:
        # For public citizen bookings, validate all required citizen demographic fields
        missing = [f for f in REQUIRED_FIELDS if f not in data or not str(data[f]).strip()]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        # If booking is made by a public citizen (unauthenticated), enforce Public Day (Monday)
        if not is_admin:
            date_val = str(data.get("date", "")).strip()
            try:
                parsed_date = datetime.date.fromisoformat(date_val)
            except ValueError:
                return jsonify({"error": "Invalid appointment date format. Use YYYY-MM-DD."}), 400

            today = datetime.date.today()
            if parsed_date <= today:
                return jsonify({"error": "Appointments must be booked at least 24 hours in advance."}), 400

            # Official Public Day is Monday (weekday == 0 in Python)
            is_monday = (parsed_date.weekday() == 0)
            is_explicitly_allowed = (AllowedDate.query.filter_by(role=data.get("officer"), date=date_val).first() is not None)

            if not is_monday and not is_explicitly_allowed:
                return jsonify({
                    "error": "Public citizen appointments can only be booked on designated Public Days (Every Monday)."
                }), 400

    # For Minister consultations (public citizen bookings), available for morning session only
    officer_val = str(data.get("officer", "")).strip()
    time_val = str(data.get("time", "")).strip()
    if officer_val == "Minister" and (meeting_type == "Public Consultation" or not is_admin):
        upper_time = time_val.upper()
        is_afternoon = False
        if "PM" in upper_time:
            match = re.match(r"^(\d{1,2}):(\d{2})", upper_time)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                # 12:00 PM and 12:30 PM are morning session. 01:00 PM onwards is afternoon.
                if hour != 12 or minute > 30:
                    is_afternoon = True
        elif ":" in upper_time:
            match = re.match(r"^(\d{1,2}):(\d{2})", upper_time)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                if hour > 12 or (hour == 12 and minute > 30):
                    is_afternoon = True

        if is_afternoon:
            return jsonify({
                "error": "The Hon. Minister is available for public consultations during the morning session only (09:00 AM - 12:30 PM)."
            }), 400

    # Validate phone format
    phone_val = str(data.get("phone", "")).strip()
    clean_phone = re.sub(r"[\s\-()]", "", phone_val)
    if not re.match(r"^(?:0|(?:\+94|0094|94))[1-9]\d{8}$", clean_phone) and not (is_admin and re.match(r"^\+?[0-9]{8,15}$", clean_phone)):
        return jsonify({
            "error": "Invalid phone format. Must be a valid Sri Lankan phone number (e.g. 07X XXX XXXX or +94 7X XXX XXXX)."
        }), 400

    try:
        appt_id: int = int(data.get("id", int(time.time() * 1000)))

        # For official meetings, populate safe defaults for citizen demographic columns
        nic_val = data.get("nic") or ("OFFICIAL" if meeting_type == "Official Meeting" else "")
        district_val = data.get("district") or ("N/A" if meeting_type == "Official Meeting" else "")
        province_val = data.get("province") or ("N/A" if meeting_type == "Official Meeting" else "")
        council_val = data.get("council") or data.get("districtSecretariat") or (data.get("organization") or "Ministry Headquarters")
        gs_div_val = data.get("gsDivision", "").strip() if data.get("gsDivision") else ""
        address_val = data.get("address") or data.get("permanentAddress") or (data.get("venue") or "Ministry Headquarters")
        postal_val = data.get("postalCode") or ("00100" if meeting_type == "Official Meeting" else "")
        org_val = data.get("organization") or ""
        venue_val = data.get("venue") or ("Hon. Minister's Office" if data.get("officer") == "Minister" else "Ministry Boardroom")
        initial_status = data.get("status") or ("Confirmed" if (meeting_type == "Official Meeting" and is_admin) else "Pending")

        appt = Appointment(
            id=appt_id,
            name=data["name"],
            reason=data["reason"],
            phone=phone_val,
            email=data.get("email", "").strip() if data.get("email") else "",
            date=data["date"],
            time=data["time"],
            status=initial_status,
            refNo=data["refNo"],
            nic=nic_val,
            district=district_val,
            province=province_val,
            council=council_val,
            gsDivision=gs_div_val,
            address=address_val,
            postalCode=postal_val,
            officer=data["officer"],
            meetingType=meeting_type,
            organization=org_val,
            venue=venue_val,
            completionRemark=data.get("completionRemark") or data.get("meetingNotes") or None,
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
@jwt_required
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

        # Disallow reverting a Confirmed appointment back to Pending
        if (appt.status or "").casefold() == "confirmed" and new_status.casefold() == "pending":
            return jsonify({"error": "Confirmed appointments cannot be reverted to Pending status"}), 400

        remark = None
        if new_status == "Cancelled":
            remark = data.get("cancellationRemark") or data.get("remark") or ""
            appt.cancellationRemark = remark
        elif new_status == "Completed":
            remark = data.get("completionRemark") or data.get("remark") or ""
            appt.completionRemark = encrypt_field(remark)

        appt.status = new_status
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
@jwt_required
@limiter.limit("10 per minute; 30 per hour")
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
@jwt_required
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
