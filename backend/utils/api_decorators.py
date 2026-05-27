import jwt
import os
from functools import wraps
from flask import request, jsonify, g


def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "message": "Token tidak ditemukan."
            }), 401

        token = auth_header.replace("Bearer ", "")

        try:
            payload = jwt.decode(
                token,
                os.getenv("SECRET_KEY", "dev-secret-key"),
                algorithms=["HS256"]
            )

            g.user = {
                "id": payload["id"],
                "email": payload["email"],
                "role": payload["role"]
            }

        except jwt.ExpiredSignatureError:
            return jsonify({
                "message": "Token sudah expired. Silakan login ulang."
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "message": "Token tidak valid."
            }), 401

        return f(*args, **kwargs)

    return decorated_function