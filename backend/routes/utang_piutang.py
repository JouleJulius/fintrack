from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from datetime import datetime

from utils.decorators import login_required
from repositories.rekening_repo import fetch_rekening
from repositories.transaksi_repo import insert_transaksi
from repositories.utang_piutang_repo import (
    fetch_utang_piutang_all,
    get_utang_piutang_by_id,
    update_pembayaran_utang_piutang,
    delete_utang_piutang,
)

utang_piutang_bp = Blueprint("utang_piutang", __name__)


def current_user_id():
    return session["user"]["id"]


@utang_piutang_bp.route("/utang_piutang")
@login_required
def utang_piutang():
    user_id = current_user_id()

    try:
        items = fetch_utang_piutang_all(user_id)
        rekening_list = fetch_rekening(user_id)

    except Exception as e:
        flash(f"Gagal mengambil data utang/piutang: {e}", "error")
        items = []
        rekening_list = []

    return render_template(
        "utang_piutang.html",
        items=items,
        rekening_list=rekening_list,
    )


@utang_piutang_bp.route("/bayar_cicilan", methods=["POST"])
@login_required
def bayar_cicilan():
    user_id = current_user_id()

    try:
        utang_piutang_id = int(request.form["utang_piutang_id"])
        tipe_up = request.form["tipe_utang_piutang"]
        jumlah_bayar = int(request.form["jumlah"])
        rekening_id = int(request.form["rekening_id"])
        tanggal_bayar = datetime.now()

        item = get_utang_piutang_by_id(utang_piutang_id, user_id)

        if not item:
            flash("Data utang/piutang tidak ditemukan.", "error")
            return redirect(url_for("utang_piutang.utang_piutang"))

        terbayar_baru = float(item["jumlah_terbayar"]) + jumlah_bayar
        lunas_baru = terbayar_baru >= float(item["jumlah_total"])

        update_pembayaran_utang_piutang(
            utang_piutang_id,
            terbayar_baru,
            lunas_baru,
            user_id
        )

        if tipe_up == "Utang":
            tipe_transaksi = "pengeluaran"
            kategori = "Pembayaran Utang"
            desk_auto = f"Bayar Utang: {item['deskripsi']}"
        else:
            tipe_transaksi = "pemasukan"
            kategori = "Penerimaan Piutang"
            desk_auto = f"Terima Piutang: {item['deskripsi']}"

        insert_transaksi(
            {
                "deskripsi": desk_auto,
                "jumlah": jumlah_bayar,
                "tipe": tipe_transaksi,
                "kategori": kategori,
                "tanggal": tanggal_bayar,
                "rekening_id": rekening_id,
            },
            user_id
        )

        flash(
            f"Pembayaran sejumlah Rp {jumlah_bayar:,.2f} berhasil dicatat!",
            "success"
        )

    except Exception as e:
        flash(f"Error saat mencatat pembayaran: {e}", "error")

    return redirect(url_for("utang_piutang.utang_piutang"))


@utang_piutang_bp.route("/hapus_utang_piutang/<int:id>")
@login_required
def hapus_utang_piutang(id):
    try:
        delete_utang_piutang(id, current_user_id())
        flash("Catatan utang/piutang berhasil dihapus.", "success")

    except Exception as e:
        flash(f"Gagal menghapus catatan: {e}", "error")

    return redirect(url_for("utang_piutang.utang_piutang"))