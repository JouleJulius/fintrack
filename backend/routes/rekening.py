from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from utils.decorators import login_required
from repositories.rekening_repo import insert_rekening

rekening_bp = Blueprint("rekening", __name__)


def current_user_id():
    return session["user"]["id"]


@rekening_bp.route("/tambah_rekening", methods=["GET", "POST"])
@login_required
def tambah_rekening():
    user_id = current_user_id()

    if request.method == "POST":
        try:
            insert_rekening(
                request.form["nama_rekening"],
                request.form["jenis_rekening"],
                int(request.form["saldo_awal"]),
                user_id
            )

            flash("Rekening baru berhasil ditambahkan!", "success")
            return redirect(url_for("dashboard.index"))

        except Exception as e:
            flash(f"Gagal menambah rekening: {e}", "error")

    return render_template("tambah_rekening.html")