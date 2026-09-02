"""Authentication blueprint — POST /api/login."""
from flask import Blueprint, request, jsonify
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    """
    Authenticate an admin user.

    Request body (JSON):
        { "username": "secretary", "password": "password123" }

    Returns:
        200  { id, username, name, role }
        400  Missing fields
        401  Invalid credentials
    """
    data = request.get_json(silent=True)
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Please provide username and password"}), 400

    username: str = data["username"].strip().lower()
    password: str = data["password"].strip()

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        return jsonify(user.to_dict()), 200

    return jsonify({"error": "Invalid credentials"}), 401
