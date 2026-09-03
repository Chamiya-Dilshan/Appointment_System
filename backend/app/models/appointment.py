"""Appointment model."""
from __future__ import annotations

from typing import Any
from app.extensions import db


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
    phone = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False)

    # Date stored as YYYY-MM-DD string; time stored as formatted string (e.g. "10:00 AM")
    date = db.Column(db.String(10), nullable=False)
    time = db.Column(db.String(20), nullable=False)

    # Possible values: Pending | Confirmed | Cancelled
    status = db.Column(db.String(20), default="Pending", nullable=False)

    refNo = db.Column(db.String(50), unique=True, nullable=False)
    nic = db.Column(db.String(20), nullable=False)

    # Sri Lanka regional fields
    district = db.Column(db.String(50), nullable=False)
    province = db.Column(db.String(50), nullable=False)
    council = db.Column(db.String(100), nullable=False)
    gsDivision = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=False)
    postalCode = db.Column(db.String(20), nullable=False)

    # Which ministerial officer this appointment is with
    officer = db.Column(db.String(50), nullable=False)

    # Populated only when status == 'Cancelled'
    cancellationRemark = db.Column(db.Text, nullable=True)

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
        cancellationRemark: str | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.name = name
        self.reason = reason
        self.phone = phone
        self.email = email
        self.date = date
        self.time = time
        self.status = status
        self.refNo = refNo
        self.nic = nic
        self.district = district
        self.province = province
        self.council = council
        self.gsDivision = gsDivision
        self.address = address
        self.postalCode = postalCode
        self.officer = officer
        self.cancellationRemark = cancellationRemark

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "reason": self.reason,
            "phone": self.phone,
            "email": self.email,
            "date": self.date,
            "time": self.time,
            "status": self.status,
            "refNo": self.refNo,
            "nic": self.nic,
            "district": self.district,
            "province": self.province,
            "council": self.council,
            "gsDivision": self.gsDivision,
            "address": self.address,
            "postalCode": self.postalCode,
            "officer": self.officer,
            "cancellationRemark": self.cancellationRemark,
        }
