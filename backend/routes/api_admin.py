from flask import Blueprint, jsonify, request, g
from werkzeug.security import generate_password_hash

from utils.api_decorators import api_login_required
from repositories.base_repo import db_fetch_all, db_fetch_one, db_execute


api_admin_bp = Blueprint("api_admin", __name__)


def admin_required_api():
    if g.user.get("role") != "admin":
        return jsonify({
            "message": "Akses ditolak. Hanya admin."
        }), 403

    return None


def serialize_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@api_admin_bp.route("/api/admin/users", methods=["GET"])
@api_login_required
def api_get_users():
    admin_check = admin_required_api()
    if admin_check:
        return admin_check

    users = db_fetch_all("""
        SELECT
            id,
            nama_lengkap,
            email,
            no_wa,
            tanggal_lahir,
            jenis_kelamin,
            role,
            status,
            created_at
        FROM users
        ORDER BY id DESC
    """)

    return jsonify({
        "items": [serialize_row(user) for user in users]
    })


@api_admin_bp.route("/api/admin/users", methods=["POST"])
@api_login_required
def api_create_user():
    admin_check = admin_required_api()
    if admin_check:
        return admin_check

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    role = data.get("role", "user").strip()
    status = data.get("status", "active").strip()

    if not email:
        return jsonify({
            "message": "Email wajib diisi."
        }), 400

    if not password:
        return jsonify({
            "message": "Password wajib diisi."
        }), 400

    if len(password) < 6:
        return jsonify({
            "message": "Password minimal 6 karakter."
        }), 400

    if role not in ["admin", "user"]:
        return jsonify({
            "message": "Role tidak valid."
        }), 400

    if status not in ["active", "pending"]:
        return jsonify({
            "message": "Status tidak valid."
        }), 400

    existing_user = db_fetch_one(
        "SELECT id FROM users WHERE email = %s",
        (email,)
    )

    if existing_user:
        return jsonify({
            "message": "Email sudah digunakan."
        }), 409

    try:
        password_hash = generate_password_hash(password)

        db_execute("""
            INSERT INTO users (
                email,
                password_hash,
                role,
                status
            )
            VALUES (%s, %s, %s, %s)
        """, (
            email,
            password_hash,
            role,
            status
        ))

        return jsonify({
            "message": "User berhasil dibuat."
        }), 201

    except Exception as e:
        return jsonify({
            "message": f"Gagal membuat user: {str(e)}"
        }), 500


@api_admin_bp.route("/api/admin/users/<int:user_id>/approve", methods=["PATCH"])
@api_login_required
def api_approve_user(user_id):
    admin_check = admin_required_api()
    if admin_check:
        return admin_check

    user = db_fetch_one(
        "SELECT id, status FROM users WHERE id = %s",
        (user_id,)
    )

    if not user:
        return jsonify({
            "message": "User tidak ditemukan."
        }), 404

    if user["status"] == "active":
        return jsonify({
            "message": "User sudah aktif."
        })

    try:
        db_execute(
            "UPDATE users SET status = %s WHERE id = %s",
            ("active", user_id)
        )

        return jsonify({
            "message": "User berhasil disetujui."
        })

    except Exception as e:
        return jsonify({
            "message": f"Gagal menyetujui user: {str(e)}"
        }), 500


@api_admin_bp.route("/api/admin/users/<int:user_id>/reject", methods=["PATCH"])
@api_login_required
def api_reject_user(user_id):
    admin_check = admin_required_api()
    if admin_check:
        return admin_check

    if user_id == g.user["id"]:
        return jsonify({
            "message": "Tidak bisa menonaktifkan akun sendiri."
        }), 400

    user = db_fetch_one(
        "SELECT id FROM users WHERE id = %s",
        (user_id,)
    )

    if not user:
        return jsonify({
            "message": "User tidak ditemukan."
        }), 404

    try:
        db_execute(
            "UPDATE users SET status = %s WHERE id = %s",
            ("pending", user_id)
        )

        return jsonify({
            "message": "User berhasil dinonaktifkan."
        })

    except Exception as e:
        return jsonify({
            "message": f"Gagal menonaktifkan user: {str(e)}"
        }), 500


@api_admin_bp.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@api_login_required
def api_delete_user(user_id):
    admin_check = admin_required_api()
    if admin_check:
        return admin_check

    if user_id == g.user["id"]:
        return jsonify({
            "message": "Tidak bisa menghapus akun sendiri."
        }), 400

    user = db_fetch_one(
        "SELECT id FROM users WHERE id = %s",
        (user_id,)
    )

    if not user:
        return jsonify({
            "message": "User tidak ditemukan."
        }), 404

    try:
        db_execute(
            "DELETE FROM users WHERE id = %s",
            (user_id,)
        )

        return jsonify({
            "message": "User berhasil dihapus."
        })

    except Exception as e:
        return jsonify({
            "message": f"Gagal menghapus user: {str(e)}"
        }), 500