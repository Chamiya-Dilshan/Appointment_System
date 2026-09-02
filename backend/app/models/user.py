"""User model."""
from __future__ import annotations

from typing import Any
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):  # type: ignore[name-defined]
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)

    def __init__(
        self,
        id: int | None = None,
        username: str = "",
        password_hash: str = "",
        name: str = "",
        role: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(**kwargs)
        if id is not None:
            self.id = id
        self.username = username
        self.password_hash = password_hash
        self.name = name
        self.role = role

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "name": self.name,
            "role": self.role,
        }
