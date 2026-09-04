"""Authentication blueprint — POST /api/login."""
from flask import Blueprint, request, jsonify
from app.models.user import User
from app.extensions import limiter
from app.utils.auth_guard import generate_jwt

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
@limiter.limit("5 per minute; 20 per hour")
def login():
    """
    Authenticate an admin user with anti-brute-force rate limiting.

    Request body (JSON):
        { "username": "secretary", "password": "password123" }

    Returns:
        200  { token, user: { id, username, name, role }, id, username, name, role }
        400  Missing fields
        401  Invalid credentials
        429  Rate limit exceeded
    """
    data = request.get_json(silent=True)
    if not data or "username" not in data or "password" not in data:
        return jsonify({"error": "Please provide username and password"}), 400

    username: str = data["username"].strip().lower()
    password: str = data["password"].strip()

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        user_dict = user.to_dict()
        token = generate_jwt(user_dict)
        return jsonify({
            "token": token,
            "user": user_dict,
            "id": user_dict["id"],
            "username": user_dict["username"],
            "name": user_dict["name"],
            "role": user_dict["role"],
        }), 200

    return jsonify({"error": "Invalid credentials"}), 401
