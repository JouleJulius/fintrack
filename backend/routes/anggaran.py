from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from datetime import datetime
from utils.decorators import login_required
from utils.constants import KATEGORI_PENGELUARAN
from repositories.anggaran_repo import insert_anggaran

anggaran_bp = Blueprint("anggaran", __name__)


def current_user_id():
    return session["user"]["id"]


@anggaran_bp.route("/tambah_anggaran", methods=["GET", "POST"])
@login_required
def tambah_anggaran():
    user_id = current_user_id()

    if request.method == "POST":
        try:
            insert_anggaran(
                request.form["kategori"],
                int(request.form["batas"]),
                int(request.form["bulan"]),
                int(request.form["tahun"]),
                user_id
            )

            flash("Anggaran berhasil ditambahkan!", "success")
            return redirect(url_for("dashboard.index"))

        except Exception as e:
            flash(f"Gagal menambah anggaran: {e}", "error")

    return render_template(
        "tambah_anggaran.html",
        kategori=KATEGORI_PENGELUARAN,
        current_year=datetime.now().year
    )