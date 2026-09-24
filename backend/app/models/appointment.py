"""Appointment model with field-level encryption for sensitive citizen PII."""
from __future__ import annotations

from typing import Any
from app.extensions import db
from app.utils.crypto import encrypt_field, decrypt_field


class Appointment(db.Model):  # type: ignore[name-defined]
    """
    Represents a single appointment booking.
    The primary key uses BigInt to safely hold Date.now() timestamp IDs
    generated on the frontend.
    """

    __tablename__ = "appointments"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=False)
    name = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    # Enlarged to VARCHAR(255) to hold Fernet encrypted ciphertext
    phone = db.Column(db.String(255), nullable=False)
    # Enlarged to VARCHAR(255) to hold Fernet encrypted ciphertext
    email = db.Column(db.String(255), nullable=True, default="")

    # Date stored as YYYY-MM-DD string; time stored as formatted string (e.g. "10:00 AM")
    date = db.Column(db.String(10), nullable=False)
    time = db.Column(db.String(20), nullable=False)

    # Possible values: Pending | Confirmed | Cancelled | Completed
    status = db.Column(db.String(20), default="Pending", nullable=False)

    refNo = db.Column(db.String(50), unique=True, nullable=False)
    # Enlarged to VARCHAR(255) to hold Fernet encrypted ciphertext
    nic = db.Column(db.String(255), nullable=False)

    # Sri Lanka regional fields
    district = db.Column(db.String(50), nullable=False)
    province = db.Column(db.String(50), nullable=False)
    council = db.Column(db.String(100), nullable=False)
    gsDivision = db.Column(db.String(100), nullable=True, default="")
    address = db.Column(db.Text, nullable=False)
    postalCode = db.Column(db.String(20), nullable=False)

    # Which ministerial officer this appointment is with
    officer = db.Column(db.String(50), nullable=False)

    # Meeting category: 'Public Consultation' (default) or 'Official Meeting'
    meetingType = db.Column(db.String(50), default="Public Consultation", nullable=False)
    organization = db.Column(db.String(150), nullable=True, default="")
    venue = db.Column(db.String(150), nullable=True, default="")

    # Populated only when status == 'Cancelled' or 'Completed'
    cancellationRemark = db.Column(db.Text, nullable=True)
    completionRemark = db.Column(db.Text, nullable=True)

    def __init__(
        self,
        id: int | None = None,
        name: str = "",
        reason: str = "",
        phone: str = "",
        email: str = "",
        date: str = "",
        time: str = "",
        status: str = "Pending",
        refNo: str = "",
        nic: str = "",
        district: str = "",
        province: str = "",
        council: str = "",
        gsDivision: str = "",
        address: str = "",
        postalCode: str = "",
        officer: str = "",
        meetingType: str = "Public Consultation",
        organization: str = "",
        venue: str = "",
        cancellationRemark: str | None = None,
        completionRemark: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.name = name
        self.reason = reason
        self.phone = encrypt_field(phone)
        self.email = encrypt_field(email) if email else ""
        self.date = date
        self.time = time
        self.status = status
        self.refNo = refNo
        self.nic = encrypt_field(nic)
        self.district = district
        self.province = province
        self.council = council
        self.gsDivision = gsDivision
        self.address = encrypt_field(address)
        self.postalCode = postalCode
        self.officer = officer
        self.meetingType = meetingType or "Public Consultation"
        self.organization = organization or ""
        self.venue = venue or ""
        self.cancellationRemark = cancellationRemark
        self.completionRemark = encrypt_field(completionRemark) if completionRemark else None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "reason": self.reason,
            "phone": decrypt_field(self.phone),
            "email": decrypt_field(self.email) if self.email else "",
            "date": self.date,
            "time": self.time,
            "status": self.status,
            "refNo": self.refNo,
            "nic": decrypt_field(self.nic),
            "district": self.district,
            "province": self.province,
            "council": self.council,
            "gsDivision": self.gsDivision,
            "address": decrypt_field(self.address),
            "postalCode": self.postalCode,
            "officer": self.officer,
            "meetingType": getattr(self, "meetingType", "Public Consultation") or "Public Consultation",
            "organization": getattr(self, "organization", "") or "",
            "venue": getattr(self, "venue", "") or "",
            "cancellationRemark": self.cancellationRemark,
            "completionRemark": decrypt_field(self.completionRemark) if self.completionRemark else None,
        }
