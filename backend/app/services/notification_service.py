"""
Notification Service
Handles automated asynchronous dispatch of confirmation emails (SMTP) and SMS notifications
for appointment booking, confirmation, and cancellation.
"""
from __future__ import annotations

import datetime
import email.utils
import html
import json
import logging
import os
import smtplib
import threading
import urllib.error
import urllib.parse
import urllib.request
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

logger = logging.getLogger("notification_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

import re


def mask_phone(phone: str) -> str:
    """Mask phone number keeping leading and trailing digits, e.g. 077****567."""
    clean = re.sub(r"[^\d+]", "", str(phone))
    if len(clean) > 6:
        return clean[:3] + "****" + clean[-3:]
    return clean[:2] + "****"


def mask_email(email_str: str) -> str:
    """Mask email username, e.g. d****n@example.com."""
    if "@" not in email_str:
        return email_str
    user, domain = email_str.split("@", 1)
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[0] + "****" + user[-1]
    return f"{masked_user}@{domain}"


def _sanitize_log_entry(entry: str) -> str:
    """Mask PII (NIC, phone, email) before writing to persistent logs."""
    # Mask NIC occurrences (e.g. 199512345678 or 123456789V)
    sanitized = re.sub(
        r"(NIC(?:/Passport)?\s*\(?)([0-9]{9}[vVxX]|[0-9]{12})(\)?)",
        lambda m: f"{m.group(1)}{m.group(2)[:4]}****{m.group(2)[-2:]}{m.group(3)}",
        entry,
        flags=re.IGNORECASE
    )
    # Mask email addresses in log entries
    sanitized = re.sub(
        r"\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b",
        lambda m: mask_email(m.group(0)),
        sanitized
    )
    # Mask phone numbers in To: <phone>
    sanitized = re.sub(
        r"(To:\s*)([\+0-9\s\-]{7,16})(\s*(?:\||$|\n))",
        lambda m: f"{m.group(1)}{mask_phone(m.group(2))}{m.group(3)}",
        sanitized
    )
    return sanitized


def _log_notification(entry: str) -> None:
    """Append sanitized notification events to backend/logs/notifications.log."""
    try:
        log_dir = Path(__file__).resolve().parent.parent.parent / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / "notifications.log"
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        sanitized_entry = _sanitize_log_entry(entry)
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{now_str}] {sanitized_entry}\n")
    except Exception:
        pass


def _reload_env() -> None:
    """Helper to ensure the latest .env configuration is loaded into os.environ."""
    if ENV_PATH.exists():
        load_dotenv(dotenv_path=ENV_PATH, override=True)
    else:
        load_dotenv(override=True)


def is_smtp_configured() -> bool:
    """Check if live SMTP credentials are configured in environment."""
    _reload_env()
    smtp_server = os.getenv("SMTP_SERVER", "").strip()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    return bool(smtp_server and smtp_user and smtp_password)


def is_sms_configured() -> bool:
    """Check if live SMS gateway credentials are configured in environment."""
    gateway_url = os.getenv("SMS_GATEWAY_URL", "").strip()
    api_key = os.getenv("SMS_API_KEY", "").strip()
    return bool(gateway_url or api_key)


def test_smtp_connection(target_email: str | None = None) -> tuple[bool, str]:
    """
    Synchronously test the SMTP connection and send a test diagnostic email.
    Returns (success: bool, message: str).
    """
    _reload_env()
    smtp_server = os.getenv("SMTP_SERVER", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", smtp_user).strip() or smtp_user
    from_name = os.getenv("SMTP_FROM_NAME", "Ministry Appointment Portal").strip()
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    if not smtp_server or not smtp_user or not smtp_password:
        return False, "SMTP settings incomplete. Please check SMTP_SERVER, SMTP_USER, and SMTP_PASSWORD in backend/.env"

    recipient = target_email.strip() if target_email and "@" in target_email else smtp_user

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = Header("[Test] Ministry Appointment Portal Email Test", "utf-8").encode()
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = recipient
        msg["Reply-To"] = from_email
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com" if "gmail" in smtp_server else None)

        body_html = _get_base_email_wrapper(
            header_title="System Verification",
            header_bg="linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
            body_content=f"""
                <div class="greeting">Email Delivery Confirmed!</div>
                <div class="intro-text">
                    This test email verifies that your SMTP mailer (<strong>{html.escape(smtp_user)}</strong>)
                    is correctly configured and active.
                </div>
                <div class="alert-box alert-success">
                    <strong>Status: Operational</strong><br>
                    Real-time notifications for appointment bookings, confirmations, and cancellations are active.
                </div>
            """
        )
        msg.attach(MIMEText("This is a test notification from Ministry Appointment Portal.", "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15) as server:
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email, [recipient], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(from_email, [recipient], msg.as_string())

        success_msg = f"Test email successfully sent to {recipient}"
        print(f"\n[OK] {success_msg}\n", flush=True)
        return True, success_msg

    except Exception as exc:
        err_msg = f"SMTP Test failed: {exc}"
        print(f"\n[ERROR] {err_msg}\n", flush=True)
        return False, err_msg


# ──────────────────────────────────────────────────────────────────────────────
# Core Asynchronous Dispatchers
# ──────────────────────────────────────────────────────────────────────────────

def send_email_async(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
) -> None:
    """
    Send an email via SMTP in a separate daemon thread to keep API responses instantaneous.
    Falls back safely to console logging if SMTP settings are not configured.
    """
    if not to_email or "@" not in to_email:
        logger.warning("Skipping email: invalid recipient email address '%s'", to_email)
        return

    def _worker():
        _reload_env()
        smtp_server = os.getenv("SMTP_SERVER", "").strip()
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "").strip()
        smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
        # IMPORTANT: For Gmail, from_email MUST exactly match the authenticated smtp_user.
        # Any mismatch causes Gmail to spam-flag or reject the message.
        from_email = smtp_user
        from_name = os.getenv("SMTP_FROM_NAME", "Appointment Notification").strip()
        use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

        # If SMTP is not configured, simulate by logging to terminal
        if not smtp_server or not smtp_user or not smtp_password:
            sim_msg = (
                f"\n[SIMULATED EMAIL DISPATCH]\n"
                f"  To: {mask_email(to_email)}\n"
                f"  Subject: {subject}\n"
                f"  (To send live emails, configure SMTP_SERVER, SMTP_USER, and SMTP_PASSWORD in .env)\n"
            )
            print(sim_msg, flush=True)
            logger.info(sim_msg)
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = Header(subject, "utf-8").encode()
            # formataddr ensures RFC-5322 compliant From header — critical for spam filters
            msg["From"] = email.utils.formataddr((from_name, from_email))
            msg["To"] = to_email
            msg["Reply-To"] = from_email
            msg["Date"] = email.utils.formatdate(localtime=True)
            msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
            # Anti-spam headers: tell Gmail this is a single transactional email, not bulk
            msg["Precedence"] = "transactional"
            msg["Auto-Submitted"] = "auto-generated"
            msg["X-Auto-Response-Suppress"] = "OOF, AutoReply"
            msg["X-Mailer"] = "AppointmentPortal/1.0"
            msg["X-Priority"] = "3"
            msg["MIME-Version"] = "1.0"

            # IMPORTANT: plain-text part MUST come before HTML part.
            # Emails with only HTML (no text fallback) score higher on spam filters.
            fallback_text = text_content or (
                f"You have received an appointment notification.\n"
                f"Subject: {subject}\n\n"
                f"Please view this email in an HTML-capable client for full details.\n"
                f"-- Ministry Appointment Portal"
            )
            msg.attach(MIMEText(fallback_text, "plain", "utf-8"))
            msg.attach(MIMEText(html_content, "html", "utf-8"))

            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15) as server:
                    server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(from_email, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
                    server.ehlo()
                    if use_tls:
                        server.starttls()
                        server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(from_email, [to_email], msg.as_string())

            success_log = f"[EMAIL SENT] To: {mask_email(to_email)} | From: {from_email} | Subject: '{subject}'"
            print(f"\n{success_log}\n", flush=True)
            logger.info(success_log)
            _log_notification(f"[LIVE EMAIL SENT] To: {to_email} | From: {from_email} | Subject: '{subject}'")
        except Exception as exc:
            import traceback
            err_log = f"[EMAIL DISPATCH ERROR] Failed to send to {mask_email(to_email)}: {exc}\n{traceback.format_exc()}"
            print(f"\n{err_log}\n", flush=True)
            logger.error(err_log)
            _log_notification(f"[EMAIL FAILED] To: {to_email} | Error: {exc}")

    thread = threading.Thread(target=_worker, daemon=False)
    thread.start()


def send_sms_async(phone: str, message: str) -> None:
    """
    Send an SMS message via configured SMS Gateway (HTTP API / Webhook) in a background thread.
    Falls back safely to console logging if no SMS Gateway is configured.
    """
    if not phone or not phone.strip():
        logger.warning("Skipping SMS: phone number is empty.")
        return

    cleaned_phone = phone.strip()

    def _worker():
        _reload_env()
        gateway_url = os.getenv("SMS_GATEWAY_URL", "").strip()
        api_key = os.getenv("SMS_API_KEY", "").strip()
        user_id = os.getenv("SMS_USER_ID", "").strip()
        sender_id = os.getenv("SMS_SENDER_ID", "AppointSys").strip()

        # If SMS gateway is not configured, simulate by logging to terminal
        if not gateway_url and not api_key:
            logger.info(
                "[SIMULATED SMS DISPATCH]\n"
                "  To: %s\n"
                "  Message: %s\n"
                "  (To send live SMS, configure SMS_GATEWAY_URL / SMS_API_KEY in .env)",
                mask_phone(cleaned_phone),
                message,
            )
            _log_notification(f"[SIMULATED SMS] To: {cleaned_phone} | Msg: {message}")
            return

        try:
            # Check for Notify.lk or custom JSON / Form POST gateways
            target_url = gateway_url or "https://app.notify.lk/api/v1/send"
            payload = {
                "user_id": user_id,
                "api_key": api_key,
                "sender_id": sender_id,
                "to": cleaned_phone,
                "message": message,
            }
            data_bytes = urllib.parse.urlencode(payload).encode("utf-8")
            req = urllib.request.Request(
                target_url,
                data=data_bytes,
                headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "AppointmentPortal/1.0"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.getcode()
                response_text = resp.read().decode("utf-8", errors="ignore")
                logger.info("SMS dispatched to %s (Status %s): %s", mask_phone(cleaned_phone), status_code, response_text[:100])
                _log_notification(f"[LIVE SMS SENT] To: {cleaned_phone} | Status: {status_code}")
        except Exception as exc:
            logger.error("Failed to send SMS to %s: %s", mask_phone(cleaned_phone), exc)
            _log_notification(f"[SMS FAILED] To: {cleaned_phone} | Error: {exc}")

    thread = threading.Thread(target=_worker, daemon=False)
    thread.start()


# ──────────────────────────────────────────────────────────────────────────────
# HTML Email Templates
# ──────────────────────────────────────────────────────────────────────────────

def _get_base_email_wrapper(header_title: str, header_bg: str, body_content: str) -> str:
    """Generate clean, mobile-friendly HTML email template wrapper."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(header_title)}</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 15px;
      box-sizing: border-box;
    }}
    .card {{
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      background: {header_bg};
      color: #ffffff;
      padding: 30px 24px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }}
    .header p {{
      margin: 0;
      font-size: 13px;
      opacity: 0.92;
      letter-spacing: 0.3px;
    }}
    .content {{
      padding: 28px 24px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }}
    .intro-text {{
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 20px;
    }}
    .info-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }}
    .info-table tr {{
      border-bottom: 1px solid #e2e8f0;
    }}
    .info-table tr:last-child {{
      border-bottom: none;
    }}
    .info-table td {{
      padding: 12px 16px;
      font-size: 13px;
    }}
    .label {{
      color: #64748b;
      font-weight: 600;
      width: 38%;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }}
    .value {{
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }}
    .badge-ref {{ background-color: #e0e7ff; color: #4338ca; }}
    .badge-pending {{ background-color: #fef3c7; color: #92400e; }}
    .badge-confirmed {{ background-color: #d1fae5; color: #065f46; }}
    .badge-cancelled {{ background-color: #fee2e2; color: #991b1b; }}
    .alert-box {{
      padding: 14px 16px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.5;
      margin-top: 20px;
    }}
    .alert-info {{
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }}
    .alert-success {{
      background-color: #ecfdf5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }}
    .alert-danger {{
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }}
    .footer {{
      background-color: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>{html.escape(header_title)}</h1>
        <p>Official Ministry Appointment Management Portal</p>
      </div>
      <div class="content">
        {body_content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 4px 0;">This is an automated ministerial dispatch. Please do not reply directly to this email.</p>
        <p style="margin: 0;">&copy; Ministry Appointment Portal. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>"""


def build_booking_received_email(appt: dict[str, Any]) -> tuple[str, str, str]:
    """Return (subject, html_content, text_content) for a newly registered appointment."""
    subject = f"Appointment Request Received - Ref: {appt.get('refNo', '')}"
    name = html.escape(str(appt.get("name", "Valued Citizen")))
    ref_no = html.escape(str(appt.get("refNo", "")))
    officer = html.escape(str(appt.get("officer", "Secretary")))
    date_str = html.escape(str(appt.get("date", "")))
    time_str = html.escape(str(appt.get("time", "")))
    reason = html.escape(str(appt.get("reason", "Consultation")))
    status = html.escape(str(appt.get("status", "Pending")))
    nic = html.escape(str(appt.get("nic", "N/A")))
    district = html.escape(str(appt.get("district", "")))
    province = html.escape(str(appt.get("province", "")))

    body = f"""
      <div class="greeting">Dear {name},</div>
      <div class="intro-text">
        Your appointment request has been successfully received and registered in our scheduling portal.
        Your booking is currently under review by the ministerial office.
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Reference No</td>
          <td class="value"><span class="badge badge-ref">{ref_no}</span></td>
        </tr>
        <tr>
          <td class="label">Status</td>
          <td class="value"><span class="badge badge-pending">{status}</span></td>
        </tr>
        <tr>
          <td class="label">Officer</td>
          <td class="value">{officer}</td>
        </tr>
        <tr>
          <td class="label">Scheduled Date</td>
          <td class="value">{date_str}</td>
        </tr>
        <tr>
          <td class="label">Time Slot</td>
          <td class="value">{time_str}</td>
        </tr>
        <tr>
          <td class="label">Subject / Purpose</td>
          <td class="value">{reason}</td>
        </tr>
        <tr>
          <td class="label">NIC / Passport</td>
          <td class="value">{nic}</td>
        </tr>
        <tr>
          <td class="label">Region</td>
          <td class="value">{district}, {province}</td>
        </tr>
      </table>

      <div class="alert-box alert-info">
        <strong>📌 What happens next?</strong><br>
        Our secretarial team is reviewing the agenda. You will receive an official SMS and confirmation email once your session is approved. Please retain your Reference Number (<strong>{ref_no}</strong>) for inquiries.
      </div>
    """

    html_email = _get_base_email_wrapper(
      header_title="Appointment Request Received",
      header_bg="linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)",
      body_content=body,
    )

    text_email = (
        f"Dear {appt.get('name')},\n\n"
        f"Your appointment request has been received.\n"
        f"Reference No: {appt.get('refNo')}\n"
        f"Officer: {appt.get('officer')}\n"
        f"Date: {appt.get('date')} at {appt.get('time')}\n"
        f"Reason: {appt.get('reason')}\n"
        f"Status: {appt.get('status', 'Pending')}\n\n"
        f"You will receive an update once approved.\nMinistry Appointment Portal"
    )

    return subject, html_email, text_email


def build_confirmation_email(appt: dict[str, Any]) -> tuple[str, str, str]:
    """Return (subject, html_content, text_content) for an approved/confirmed appointment."""
    subject = f"Appointment Confirmed - Ref: {appt.get('refNo', '')}"
    name = html.escape(str(appt.get("name", "Valued Citizen")))
    ref_no = html.escape(str(appt.get("refNo", "")))
    officer = html.escape(str(appt.get("officer", "Secretary")))
    date_str = html.escape(str(appt.get("date", "")))
    time_str = html.escape(str(appt.get("time", "")))
    reason = html.escape(str(appt.get("reason", "Consultation")))
    nic = html.escape(str(appt.get("nic", "N/A")))
    address = html.escape(str(appt.get("address", "Ministry Headquarters")))

    body = f"""
      <div class="greeting">Dear {name},</div>
      <div class="intro-text">
        We are pleased to inform you that your appointment with the <strong>{officer}</strong> has been <strong>officially confirmed</strong>.
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Reference No</td>
          <td class="value"><span class="badge badge-ref">{ref_no}</span></td>
        </tr>
        <tr>
          <td class="label">Status</td>
          <td class="value"><span class="badge badge-confirmed">Confirmed</span></td>
        </tr>
        <tr>
          <td class="label">Official / Officer</td>
          <td class="value">{officer}</td>
        </tr>
        <tr>
          <td class="label">Confirmed Date</td>
          <td class="value"><strong>{date_str}</strong></td>
        </tr>
        <tr>
          <td class="label">Confirmed Time</td>
          <td class="value"><strong>{time_str}</strong></td>
        </tr>
        <tr>
          <td class="label">Purpose</td>
          <td class="value">{reason}</td>
        </tr>
        <tr>
          <td class="label">NIC / Passport</td>
          <td class="value">{nic}</td>
        </tr>
      </table>

      <div class="alert-box alert-success">
        <strong>✅ Instructions for your visit:</strong>
        <ul style="margin: 6px 0 0 0; padding-left: 20px;">
          <li>Please arrive at least <strong>10 minutes before</strong> your scheduled time slot.</li>
          <li>Carry your original Identification Document (NIC / Passport: <strong>{nic}</strong>).</li>
          <li>Show your Reference Code <strong>{ref_no}</strong> at the security desk upon arrival.</li>
        </ul>
      </div>
    """

    html_email = _get_base_email_wrapper(
      header_title="Appointment Confirmed",
      header_bg="linear-gradient(135deg, #059669 0%, #10b981 100%)",
      body_content=body,
    )

    text_email = (
        f"Dear {appt.get('name')},\n\n"
        f"Your appointment has been CONFIRMED.\n"
        f"Reference No: {appt.get('refNo')}\n"
        f"Officer: {appt.get('officer')}\n"
        f"Date: {appt.get('date')} at {appt.get('time')}\n"
        f"Reason: {appt.get('reason')}\n\n"
        f"Please arrive 10 minutes early with your NIC/Passport ({appt.get('nic')}).\n"
        f"Ministry Appointment Portal"
    )

    return subject, html_email, text_email


def build_cancellation_email(appt: dict[str, Any], remark: str = "") -> tuple[str, str, str]:
    """Return (subject, html_content, text_content) for a cancelled appointment."""
    subject = f"Appointment Cancelled - Ref: {appt.get('refNo', '')}"
    name = html.escape(str(appt.get("name", "Valued Citizen")))
    ref_no = html.escape(str(appt.get("refNo", "")))
    officer = html.escape(str(appt.get("officer", "Secretary")))
    date_str = html.escape(str(appt.get("date", "")))
    time_str = html.escape(str(appt.get("time", "")))
    reason = html.escape(str(appt.get("reason", "Consultation")))
    cancellation_reason = html.escape(remark or appt.get("cancellationRemark") or "Schedule adjustment / Unavailable slot")

    body = f"""
      <div class="greeting">Dear {name},</div>
      <div class="intro-text">
        This is an official notice that your appointment session scheduled with <strong>{officer}</strong> has been <strong>cancelled</strong>.
      </div>

      <table class="info-table">
        <tr>
          <td class="label">Reference No</td>
          <td class="value"><span class="badge badge-ref">{ref_no}</span></td>
        </tr>
        <tr>
          <td class="label">Status</td>
          <td class="value"><span class="badge badge-cancelled">Cancelled</span></td>
        </tr>
        <tr>
          <td class="label">Officer</td>
          <td class="value">{officer}</td>
        </tr>
        <tr>
          <td class="label">Original Date & Time</td>
          <td class="value">{date_str} at {time_str}</td>
        </tr>
        <tr>
          <td class="label">Cancellation Reason</td>
          <td class="value" style="color: #b91c1c;">{cancellation_reason}</td>
        </tr>
      </table>

      <div class="alert-box alert-danger">
        <strong>Need to reschedule?</strong><br>
        You are welcome to submit a new appointment request through the portal for an alternate available date.
      </div>
    """

    html_email = _get_base_email_wrapper(
      header_title="Appointment Cancelled",
      header_bg="linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
      body_content=body,
    )

    text_email = (
        f"Dear {appt.get('name')},\n\n"
        f"Your appointment (Ref: {appt.get('refNo')}) with {appt.get('officer')} on {appt.get('date')} has been CANCELLED.\n"
        f"Reason: {cancellation_reason}\n\n"
        f"You may submit a new request through the portal.\nMinistry Appointment Portal"
    )

    return subject, html_email, text_email


# ──────────────────────────────────────────────────────────────────────────────
# SMS Message Builders
# ──────────────────────────────────────────────────────────────────────────────

def build_booking_received_sms(appt: dict[str, Any]) -> str:
    return (
        f"Appointment request received. Ref: {appt.get('refNo')}. "
        f"Officer: {appt.get('officer')}, Date: {appt.get('date')} {appt.get('time')}. "
        f"Status: Pending review. - Ministry Portal"
    )


def build_confirmation_sms(appt: dict[str, Any]) -> str:
    return (
        f"Appointment CONFIRMED. Ref: {appt.get('refNo')}. "
        f"With: {appt.get('officer')} on {appt.get('date')} at {appt.get('time')}. "
        f"Please bring your NIC/Passport ({appt.get('nic')}) and arrive 10m early. - Ministry Portal"
    )


def build_cancellation_sms(appt: dict[str, Any], remark: str = "") -> str:
    reason_str = remark or appt.get("cancellationRemark") or "Schedule adjustment"
    return (
        f"Appointment CANCELLED. Ref: {appt.get('refNo')} on {appt.get('date')}. "
        f"Reason: {reason_str}. You may book a new slot via the portal. - Ministry Portal"
    )


# ──────────────────────────────────────────────────────────────────────────────
# High-Level Event Handlers
# ──────────────────────────────────────────────────────────────────────────────

def notify_appointment_created(appt_data: dict[str, Any]) -> None:
    """Trigger notifications when a new appointment is registered."""
    status = appt_data.get("status", "Pending")

    if status == "Confirmed":
        subject, html_email, text_email = build_confirmation_email(appt_data)
        sms_text = build_confirmation_sms(appt_data)
    else:
        subject, html_email, text_email = build_booking_received_email(appt_data)
        sms_text = build_booking_received_sms(appt_data)

    if appt_data.get("email"):
        send_email_async(appt_data["email"], subject, html_email, text_email)

    if appt_data.get("phone"):
        send_sms_async(appt_data["phone"], sms_text)


def notify_appointment_status_updated(
    appt_data: dict[str, Any],
    new_status: str,
    remark: str = "",
) -> None:
    """Trigger notifications when appointment status transitions to Confirmed or Cancelled."""
    if new_status == "Confirmed":
        subject, html_email, text_email = build_confirmation_email(appt_data)
        sms_text = build_confirmation_sms(appt_data)
    elif new_status == "Cancelled":
        subject, html_email, text_email = build_cancellation_email(appt_data, remark)
        sms_text = build_cancellation_sms(appt_data, remark)
    else:
        # For Pending or other statuses, no separate update broadcast is needed
        return

    if appt_data.get("email"):
        send_email_async(appt_data["email"], subject, html_email, text_email)

    if appt_data.get("phone"):
        send_sms_async(appt_data["phone"], sms_text)
