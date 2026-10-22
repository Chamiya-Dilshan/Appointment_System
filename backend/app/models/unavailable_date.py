"""UnavailableDate model — tracks dates when an officer is unavailable for bookings (e.g. cancelled public days)."""
from __future__ import annotations

import datetime
from typing import Any
from app.extensions import db


class UnavailableDate(db.Model):  # type: ignore[name-defined]
    __tablename__ = "unavailable_dates"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Officer role this unavailability applies to: Secretary | Deputy Minister | Minister
    role = db.Column(db.String(50), nullable=False)

    # Date string in YYYY-MM-DD format
    date = db.Column(db.String(10), nullable=False)

    # Reason for unavailability (e.g., "Official Overseas Mission", "Parliament Session", "Public Holiday")
    reason = db.Column(db.String(255), nullable=True, default="")

    # When this record was created
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("role", "date", name="uq_officer_unavailable_date"),
    )

    def __init__(
        self,
        id: int | None = None,
        role: str = "",
        date: str = "",
        reason: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.role = role
        self.date = date
        self.reason = reason

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "role": self.role,
            "date": self.date,
            "reason": self.reason or "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
