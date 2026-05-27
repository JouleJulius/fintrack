from flask import Blueprint, render_template, request, redirect, url_for, flash, session

from utils.decorators import login_required
from utils.constants import KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN

from repositories.transaksi_repo import (
    insert_transaksi,
    insert_many_transaksi,
    delete_transaksi_by_id,
    count_all_transaksi,
    fetch_transaksi_paginated,
)

from repositories.rekening_repo import fetch_rekening
from repositories.tabungan_repo import (
    fetch_tabungan_non_dana_darurat,
    get_tabungan_terkumpul,
    update_tabungan_terkumpul,
)

from repositories.utang_piutang_repo import (
    insert_utang_piutang,
    find_utang_piutang_aktif,
    update_pembayaran_utang_piutang,
)

from datetime import datetime


transaksi_bp = Blueprint("transaksi", __name__)


def current_user_id():
    return session["user"]["id"]


@transaksi_bp.route("/tambah_transaksi", methods=["GET", "POST"])
@login_required
def tambah_transaksi():
    user_id = current_user_id()

    rekening_list = []
    tabungan_list = []

    try:
        rekening_list = fetch_rekening(user_id)
        tabungan_list = fetch_tabungan_non_dana_darurat(user_id)
    except Exception as e:
        flash(f"Gagal mengambil data awal: {e}", "error")

    if request.method == "POST":
        try:
            tipe = request.form["tipe"]
            jumlah = int(request.form["jumlah"])
            deskripsi = request.form.get("deskripsi", "")
            tanggal_input_str = request.form.get("tanggal_transaksi")

            tanggal_final = (
                datetime.fromisoformat(tanggal_input_str)
                if tanggal_input_str
                else datetime.now()
            )

            if tipe == "transfer":
                rekening_sumber_id = int(request.form["rekening_sumber_id"])
                rekening_tujuan_id = int(request.form["rekening_tujuan_id"])

                if rekening_sumber_id == rekening_tujuan_id:
                    flash("Rekening sumber dan tujuan tidak boleh sama.", "error")
                    return redirect(url_for("transaksi.tambah_transaksi"))

                transaksi_keluar = {
                    "deskripsi": deskripsi or "Transfer ke rekening lain",
                    "jumlah": jumlah,
                    "tipe": "pengeluaran",
                    "kategori": "Transfer",
                    "tanggal": tanggal_final,
                    "rekening_id": rekening_sumber_id,
                }

                transaksi_masuk = {
                    "deskripsi": deskripsi or "Transfer dari rekening lain",
                    "jumlah": jumlah,
                    "tipe": "pemasukan",
                    "kategori": "Transfer",
                    "tanggal": tanggal_final,
                    "rekening_id": rekening_tujuan_id,
                }

                insert_many_transaksi(
                    [transaksi_keluar, transaksi_masuk],
                    user_id
                )

                flash("Transfer dana berhasil dicatat!", "success")
                return redirect(url_for("dashboard.index"))

            kategori = request.form["kategori"]
            rekening_id = int(request.form["rekening_id"])

            insert_transaksi(
                {
                    "deskripsi": deskripsi,
                    "jumlah": jumlah,
                    "tipe": tipe,
                    "kategori": kategori,
                    "tanggal": tanggal_final,
                    "rekening_id": rekening_id,
                },
                user_id
            )

            if kategori == "Alokasi Tabungan":
                tabungan_id = int(request.form["tabungan_id"])
                tabungan = get_tabungan_terkumpul(tabungan_id, user_id)

                if tabungan:
                    terkumpul_baru = float(tabungan.get("terkumpul", 0)) + jumlah
                    update_tabungan_terkumpul(
                        tabungan_id,
                        terkumpul_baru,
                        user_id
                    )

            if kategori in ["Pemberian Piutang", "Penerimaan Utang"]:
                pihak_terkait = request.form.get("pihak_terkait")

                if pihak_terkait:
                    tipe_up = (
                        "Piutang"
                        if kategori == "Pemberian Piutang"
                        else "Utang"
                    )

                    desk_up = deskripsi or (
                        f"Piutang kepada {pihak_terkait}"
                        if tipe_up == "Piutang"
                        else f"Utang dari {pihak_terkait}"
                    )

                    insert_utang_piutang(
                        tipe_up,
                        desk_up,
                        pihak_terkait,
                        jumlah,
                        tanggal_final.date(),
                        user_id
                    )
                else:
                    flash(
                        "Peringatan: transaksi dicatat, tapi utang/piutang tidak dibuat karena pihak terkait kosong.",
                        "warning"
                    )

            if kategori in ["Penerimaan Piutang", "Pembayaran Utang"]:
                pihak_terkait = request.form.get("pihak_terkait")

                if pihak_terkait:
                    tipe_up_dicari = (
                        "Piutang"
                        if kategori == "Penerimaan Piutang"
                        else "Utang"
                    )

                    item = find_utang_piutang_aktif(
                        tipe_up_dicari,
                        pihak_terkait,
                        user_id
                    )

                    if item:
                        terbayar_baru = float(item["jumlah_terbayar"]) + jumlah
                        lunas_baru = terbayar_baru >= float(item["jumlah_total"])

                        update_pembayaran_utang_piutang(
                            item["id"],
                            terbayar_baru,
                            lunas_baru,
                            user_id
                        )
                    else:
                        flash(
                            f"Peringatan: tidak ditemukan catatan aktif untuk {pihak_terkait}.",
                            "warning"
                        )
                else:
                    flash(
                        "Peringatan: pembayaran utang/piutang tidak diperbarui karena pihak terkait kosong.",
                        "warning"
                    )

            flash("Transaksi berhasil dicatat!", "success")
            return redirect(url_for("dashboard.index"))

        except Exception as e:
            flash(f"Terjadi error saat memproses transaksi: {e}", "error")
            return render_template(
                "tambah_transaksi.html",
                kategori_pengeluaran=KATEGORI_PENGELUARAN,
                kategori_pemasukan=KATEGORI_PEMASUKAN,
                rekening=rekening_list,
                tabungan=tabungan_list,
            )

    return render_template(
        "tambah_transaksi.html",
        kategori_pengeluaran=KATEGORI_PENGELUARAN,
        kategori_pemasukan=KATEGORI_PEMASUKAN,
        rekening=rekening_list,
        tabungan=tabungan_list,
    )


@transaksi_bp.route("/hapus_transaksi/<int:id>")
@login_required
def hapus_transaksi(id):
    try:
        delete_transaksi_by_id(id, current_user_id())
        flash("Transaksi berhasil dihapus.", "success")
    except Exception as e:
        flash(f"Gagal menghapus transaksi: {e}", "error")

    return redirect(request.referrer or url_for("dashboard.index"))


@transaksi_bp.route("/transaksi")
@login_required
def semua_transaksi():
    user_id = current_user_id()

    PER_PAGE = 15
    page = request.args.get("page", 1, type=int)
    offset = (page - 1) * PER_PAGE

    try:
        total_items = count_all_transaksi(user_id)
        transaksi_list = fetch_transaksi_paginated(
            PER_PAGE,
            offset,
            user_id
        )

        total_pages = (total_items + PER_PAGE - 1) // PER_PAGE

    except Exception as e:
        flash(f"Gagal mengambil riwayat transaksi: {e}", "error")
        transaksi_list = []
        total_pages = 0

    return render_template(
        "semua_transaksi.html",
        transaksi=transaksi_list,
        current_page=page,
        total_pages=total_pages,
    )