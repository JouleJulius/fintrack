from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from datetime import date, timedelta

from utils.decorators import login_required
from repositories.pengaturan_repo import get_pengaturan, upsert_pengaturan
from repositories.tabungan_repo import (
    get_dana_darurat,
    update_target_dana_darurat,
    insert_dana_darurat,
)

pengaturan_bp = Blueprint("pengaturan", __name__)


def current_user_id():
    return session["user"]["id"]


@pengaturan_bp.route("/atur_gaji", methods=["GET", "POST"])
@login_required
def atur_gaji():
    user_id = current_user_id()

    if request.method == "POST":
        try:
            gaji_str = request.form.get("gaji", "0")
            gaji_numerik = int(gaji_str)

            upsert_pengaturan("gaji", gaji_str, user_id)

            target_baru_dd = gaji_numerik * 3
            dana_darurat = get_dana_darurat(user_id)

            if dana_darurat:
                update_target_dana_darurat(target_baru_dd, user_id)
                flash("Gaji dan target Dana Darurat berhasil diperbarui!", "success")
            else:
                tenggat_default = (date.today() + timedelta(days=365 * 10)).isoformat()
                insert_dana_darurat(target_baru_dd, tenggat_default, user_id)
                flash("Gaji berhasil diatur dan target Dana Darurat telah dibuat!", "success")

            return redirect(url_for("dashboard.index"))

        except Exception as e:
            flash(f"Terjadi kesalahan saat memproses gaji: {e}", "error")

    gaji_saat_ini = get_pengaturan("gaji", user_id, "0")
    return render_template("atur_gaji.html", gaji=gaji_saat_ini)