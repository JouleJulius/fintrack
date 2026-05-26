from flask import Blueprint, jsonify, request, g
from datetime import datetime

from utils.api_decorators import api_login_required
from utils.constants import KATEGORI_PENGELUARAN, KATEGORI_PEMASUKAN

from repositories.transaksi_repo import (
    fetch_all_transaksi,
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
from repositories.base_repo import db_fetch_one, db_execute


api_transaksi_bp = Blueprint("api_transaksi", __name__)


def serialize_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@api_transaksi_bp.route("/api/transactions", methods=["GET"])
@api_login_required
def api_get_transactions():
    user_id = g.user["id"]

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 15, type=int)

    offset = (page - 1) * per_page

    total_items = count_all_transaksi(user_id)
    total_pages = (total_items + per_page - 1) // per_page

    transaksi = fetch_transaksi_paginated(
        per_page,
        offset,
        user_id
    )

    return jsonify({
        "items": [
            serialize_row(t)
            for t in transaksi
        ],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items,
            "total_pages": total_pages,
        }
    })

@api_transaksi_bp.route("/api/transactions/<int:transaction_id>", methods=["GET"])
@api_login_required
def api_get_transaction_detail(transaction_id):
    user_id = g.user["id"]

    transaksi = db_fetch_one(
        """
        SELECT
            id,
            deskripsi,
            jumlah,
            tipe,
            kategori,
            tanggal,
            rekening_id,
            user_id
        FROM transaksi
        WHERE id = %s AND user_id = %s
        """,
        (transaction_id, user_id)
    )

    if not transaksi:
        return jsonify({
            "message": "Transaksi tidak ditemukan."
        }), 404

    return jsonify({
        "item": serialize_row(transaksi)
    })

@api_transaksi_bp.route("/api/transactions/<int:transaction_id>", methods=["PUT"])
@api_login_required
def api_update_transaction(transaction_id):
    user_id = g.user["id"]
    data = request.get_json() or {}

    try:
        existing = db_fetch_one(
            """
            SELECT id
            FROM transaksi
            WHERE id = %s AND user_id = %s
            """,
            (transaction_id, user_id)
        )

        if not existing:
            return jsonify({
                "message": "Transaksi tidak ditemukan."
            }), 404

        tipe = data.get("tipe")
        jumlah = int(data.get("jumlah", 0))
        kategori = data.get("kategori", "")
        deskripsi = data.get("deskripsi", "")
        rekening_id = int(data.get("rekening_id"))
        tanggal_input = data.get("tanggal_transaksi")

        if jumlah <= 0:
            return jsonify({
                "message": "Jumlah transaksi harus lebih dari 0."
            }), 400

        if tipe not in ["pemasukan", "pengeluaran"]:
            return jsonify({
                "message": "Edit transaksi hanya mendukung pemasukan/pengeluaran."
            }), 400

        tanggal_final = (
            datetime.fromisoformat(tanggal_input)
            if tanggal_input
            else datetime.now()
        )

        db_execute(
            """
            UPDATE transaksi
            SET
                deskripsi = %s,
                jumlah = %s,
                tipe = %s,
                kategori = %s,
                tanggal = %s,
                rekening_id = %s
            WHERE id = %s AND user_id = %s
            """,
            (
                deskripsi,
                jumlah,
                tipe,
                kategori,
                tanggal_final,
                rekening_id,
                transaction_id,
                user_id,
            )
        )

        return jsonify({
            "message": "Transaksi berhasil diperbarui."
        })

    except ValueError:
        return jsonify({
            "message": "Input transaksi tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal memperbarui transaksi: {str(e)}"
        }), 500


@api_transaksi_bp.route("/api/transactions/options", methods=["GET"])
@api_login_required
def api_get_transaction_options():
    user_id = g.user["id"]

    rekening = fetch_rekening(user_id)
    tabungan = fetch_tabungan_non_dana_darurat(user_id)

    return jsonify({
        "kategori_pengeluaran": KATEGORI_PENGELUARAN,
        "kategori_pemasukan": KATEGORI_PEMASUKAN,
        "rekening": [
            serialize_row(r)
            for r in rekening
        ],
        "tabungan": [
            serialize_row(t)
            for t in tabungan
        ],
    })


@api_transaksi_bp.route("/api/transactions", methods=["POST"])
@api_login_required
def api_create_transaction():
    user_id = g.user["id"]
    data = request.get_json() or {}

    try:
        tipe = data.get("tipe")
        jumlah = int(data.get("jumlah", 0))
        deskripsi = data.get("deskripsi", "")
        kategori = data.get("kategori")
        tanggal_input = data.get("tanggal_transaksi")

        tanggal_final = (
            datetime.fromisoformat(tanggal_input)
            if tanggal_input
            else datetime.now()
        )

        if jumlah <= 0:
            return jsonify({
                "message": "Jumlah transaksi harus lebih dari 0."
            }), 400

        if tipe not in ["pemasukan", "pengeluaran", "transfer"]:
            return jsonify({
                "message": "Tipe transaksi tidak valid."
            }), 400

        if tipe == "transfer":
            rekening_sumber_id = int(data.get("rekening_sumber_id"))
            rekening_tujuan_id = int(data.get("rekening_tujuan_id"))

            if rekening_sumber_id == rekening_tujuan_id:
                return jsonify({
                    "message": "Rekening sumber dan tujuan tidak boleh sama."
                }), 400

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

            return jsonify({
                "message": "Transfer dana berhasil dicatat."
            }), 201

        rekening_id = int(data.get("rekening_id"))

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
            tabungan_id = data.get("tabungan_id")

            if tabungan_id:
                tabungan = get_tabungan_terkumpul(
                    int(tabungan_id),
                    user_id
                )

                if tabungan:
                    terkumpul_baru = (
                        float(tabungan.get("terkumpul", 0))
                        + jumlah
                    )

                    update_tabungan_terkumpul(
                        int(tabungan_id),
                        terkumpul_baru,
                        user_id
                    )

        if kategori in ["Pemberian Piutang", "Penerimaan Utang"]:
            pihak_terkait = data.get("pihak_terkait")

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

        if kategori in ["Penerimaan Piutang", "Pembayaran Utang"]:
            pihak_terkait = data.get("pihak_terkait")

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
                    terbayar_baru = (
                        float(item["jumlah_terbayar"])
                        + jumlah
                    )

                    lunas_baru = (
                        terbayar_baru
                        >= float(item["jumlah_total"])
                    )

                    update_pembayaran_utang_piutang(
                        item["id"],
                        terbayar_baru,
                        lunas_baru,
                        user_id
                    )

        return jsonify({
            "message": "Transaksi berhasil dicatat."
        }), 201

    except Exception as e:
        return jsonify({
            "message": f"Gagal mencatat transaksi: {str(e)}"
        }), 500


@api_transaksi_bp.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
@api_login_required
def api_delete_transaction(transaction_id):
    user_id = g.user["id"]

    try:
        delete_transaksi_by_id(transaction_id, user_id)

        return jsonify({
            "message": "Transaksi berhasil dihapus."
        })

    except Exception as e:
        return jsonify({
            "message": f"Gagal menghapus transaksi: {str(e)}"
        }), 500