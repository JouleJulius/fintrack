from flask import Blueprint, render_template, request, redirect, url_for, flash
from werkzeug.security import generate_password_hash

from utils.decorators import login_required, admin_required
from repositories.base_repo import db_execute


admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin/tambah_user", methods=["GET", "POST"])
@login_required
@admin_required
def tambah_user_admin():
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        role = request.form.get("role", "user")

        if not email or not password:
            flash("Email dan password wajib diisi.", "error")
            return render_template("tambah_user.html")

        try:
            password_hash = generate_password_hash(password)

            db_execute(
                """
                INSERT INTO users (email, password_hash, role)
                VALUES (%s, %s, %s)
                """,
                (email, password_hash, role),
            )

            flash(f"User dengan email {email} berhasil dibuat!", "success")
            return redirect(url_for("admin.tambah_user_admin"))

        except Exception as e:
            flash(f"Gagal membuat user: {e}", "error")

    return render_template("tambah_user.html")