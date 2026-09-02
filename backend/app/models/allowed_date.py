"""AllowedDate model — maps a booking date to a ministerial role."""
from __future__ import annotations

from typing import Any
from app.extensions import db


class AllowedDate(db.Model):  # type: ignore[name-defined]
    __tablename__ = "allowed_dates"

    id = db.Column(db.Integer, primary_key=True)

    # Officer role this date applies to: Secretary | Deputy Minister | Minister
    role = db.Column(db.String(50), nullable=False)

    # Date string in YYYY-MM-DD format
    date = db.Column(db.String(10), nullable=False)

    def __init__(
        self,
        id: int | None = None,
        role: str = "",
        date: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.role = role
        self.date = date

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "role": self.role,
            "date": self.date,
        }
