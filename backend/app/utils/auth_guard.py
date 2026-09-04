"""Authentication guard & JWT utilities for administrative API endpoints."""
from __future__ import annotations

import datetime
from functools import wraps
from typing import Any, Callable

import jwt
from flask import current_app, g, jsonify, request


def generate_jwt(user_dict: dict[str, Any], expiry_hours: int | None = None) -> str:
    """Generate a signed HS256 JWT for the authenticated user."""
    if expiry_hours is None:
        expiry_hours = int(current_app.config.get("JWT_EXPIRY_HOURS", 8))

    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY", "secret")
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user_dict.get("id", "")),
        "username": user_dict.get("username", ""),
        "role": user_dict.get("role", ""),
        "name": user_dict.get("name", ""),
        "iat": now,
        "exp": now + datetime.timedelta(hours=expiry_hours),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_jwt(token: str) -> dict[str, Any]:
    """Decode and validate a signed JWT token."""
    secret = current_app.config.get("JWT_SECRET_KEY") or current_app.config.get("SECRET_KEY", "secret")
    return jwt.decode(token, secret, algorithms=["HS256"])


def jwt_required(fn: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator that requires a valid JWT Bearer token in the Authorization header.
    Attaches the decoded payload to flask.g.current_user and flask.g.user_role.
    """
    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        auth_header = request.headers.get("Authorization", "").strip()
        if not auth_header:
            return jsonify({
                "error": "Unauthorized",
                "message": "Missing Authorization header. Please log in.",
            }), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "error": "Unauthorized",
                "message": "Invalid Authorization header format. Expected 'Bearer <token>'.",
            }), 401

        token = parts[1]
        try:
            payload = decode_jwt(token)
            g.current_user = payload
            g.user_role = payload.get("role", "")
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Token Expired",
                "message": "Your session has expired. Please log in again.",
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Invalid Token",
                "message": "Authentication token is invalid or corrupted.",
            }), 401

        return fn(*args, **kwargs)

    return wrapper


def roles_required(*allowed_roles: str) -> Callable[..., Any]:
    """
    Decorator requiring both valid JWT and that user role is among allowed_roles.
    """
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        @jwt_required
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            user_role = getattr(g, "user_role", None)
            if allowed_roles and user_role not in allowed_roles:
                return jsonify({
                    "error": "Forbidden",
                    "message": f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
                }), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
