from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from db import get_db_connection
import jwt
import os
from datetime import datetime, timedelta


auth_bp = Blueprint("auth", __name__)


def create_jwt_token(user):
    return jwt.encode(
        {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "exp": datetime.utcnow() + timedelta(days=1),
        },
        os.getenv("SECRET_KEY", "dev-secret-key"),
        algorithm="HS256",
    )


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if session.get("user"):
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT id, email, password_hash, role, status
            FROM users
            WHERE email = %s
            """,
            (email,),
        )

        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user or not check_password_hash(user["password_hash"], password):
            flash("Email atau password salah.", "error")
            return redirect(url_for("auth.login"))

        if user.get("status") != "active":
            flash("Akun Anda belum disetujui admin.", "warning")
            return redirect(url_for("auth.login"))

        session["user"] = {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"],
        }

        flash("Login berhasil!", "success")
        return redirect(url_for("dashboard.index"))

    return render_template("login.html")


@auth_bp.route("/logout")
def logout():
    session.clear()
    flash("Anda telah logout.", "info")
    return redirect(url_for("auth.login"))


@auth_bp.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, email, password_hash, role, status
        FROM users
        WHERE email = %s
        """,
        (email,),
    )

    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({
            "message": "Email atau password salah."
        }), 401

    if user.get("status") != "active":
        return jsonify({
            "message": "Akun Anda belum disetujui admin."
        }), 403

    token = create_jwt_token(user)

    return jsonify({
        "message": "Login berhasil",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"],
        },
    })


@auth_bp.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}

    nama_lengkap = data.get("nama_lengkap", "").strip()
    email = data.get("email", "").strip().lower()
    tanggal_lahir = data.get("tanggal_lahir", "").strip()
    no_wa = data.get("no_wa", "").strip()
    jenis_kelamin = data.get("jenis_kelamin", "").strip()
    password = data.get("password", "").strip()
    confirm_password = data.get("confirm_password", "").strip()

    if not nama_lengkap:
        return jsonify({"message": "Nama lengkap wajib diisi."}), 400

    if not email:
        return jsonify({"message": "Email wajib diisi."}), 400

    if not tanggal_lahir:
        return jsonify({"message": "Tanggal lahir wajib diisi."}), 400

    if not no_wa:
        return jsonify({"message": "Nomor WhatsApp wajib diisi."}), 400

    if jenis_kelamin not in ["Laki-laki", "Perempuan"]:
        return jsonify({"message": "Jenis kelamin tidak valid."}), 400

    if not password:
        return jsonify({"message": "Password wajib diisi."}), 400

    if len(password) < 6:
        return jsonify({"message": "Password minimal 6 karakter."}), 400

    if password != confirm_password:
        return jsonify({"message": "Konfirmasi password tidak cocok."}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,),
        )

        existing_user = cur.fetchone()

        if existing_user:
            return jsonify({"message": "Email sudah terdaftar."}), 409

        password_hash = generate_password_hash(password)

        cur.execute(
            """
            INSERT INTO users (
                nama_lengkap,
                email,
                tanggal_lahir,
                no_wa,
                jenis_kelamin,
                password_hash,
                role,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                nama_lengkap,
                email,
                tanggal_lahir,
                no_wa,
                jenis_kelamin,
                password_hash,
                "user",
                "pending",
            ),
        )

        conn.commit()

        return jsonify({
            "message": "Registrasi berhasil. Akun Anda menunggu persetujuan admin."
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({
            "message": f"Registrasi gagal: {str(e)}"
        }), 500

    finally:
        cur.close()
        conn.close()