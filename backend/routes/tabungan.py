from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from datetime import datetime
from utils.decorators import login_required
from repositories.tabungan_repo import (
    insert_tabungan,
    get_tabungan_terkumpul,
    update_tabungan_terkumpul,
)

tabungan_bp = Blueprint("tabungan", __name__)


def current_user_id():
    return session["user"]["id"]


@tabungan_bp.route("/tambah_tabungan", methods=["GET", "POST"])
@login_required
def tambah_tabungan():
    user_id = current_user_id()

    if request.method == "POST":
        try:
            nama_tabungan = request.form["nama"]

            if nama_tabungan.lower() == "dana darurat":
                return render_template(
                    "tambah_tabungan.html",
                    error="Nama 'Dana Darurat' sudah dipakai oleh sistem. Silakan gunakan nama lain."
                )

            insert_tabungan(
                nama_tabungan,
                int(request.form["target"]),
                0.0,
                datetime.strptime(request.form["tenggat"], "%Y-%m-%d").date(),
                user_id
            )

            flash("Target tabungan baru berhasil dibuat!", "success")
            return redirect(url_for("dashboard.index"))

        except Exception as e:
            return render_template("tambah_tabungan.html", error=str(e))

    return render_template("tambah_tabungan.html")


@tabungan_bp.route("/tambah_dana_tabungan/<int:id>", methods=["POST"])
@login_required
def tambah_dana_tabungan(id):
    user_id = current_user_id()

    try:
        jumlah = int(request.form["jumlah"])
        tabungan = get_tabungan_terkumpul(id, user_id)

        if tabungan:
            terkumpul_baru = float(tabungan.get("terkumpul", 0)) + jumlah
            update_tabungan_terkumpul(id, terkumpul_baru, user_id)
            flash(f"Dana sebesar Rp {jumlah:,.2f} berhasil ditambahkan ke tabungan!", "success")
        else:
            flash(f"Error: Target tabungan dengan ID {id} tidak ditemukan.", "error")

    except Exception as e:
        flash(f"Error saat menambah dana tabungan: {e}", "error")

    return redirect(url_for("dashboard.index"))