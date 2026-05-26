from flask import Blueprint, jsonify, request, g
from datetime import datetime

from utils.api_decorators import api_login_required
from repositories.rekening_repo import fetch_rekening
from repositories.transaksi_repo import insert_transaksi
from repositories.utang_piutang_repo import (
    fetch_utang_piutang_all,
    insert_utang_piutang,
    get_utang_piutang_by_id,
    update_pembayaran_utang_piutang,
    delete_utang_piutang,
)


api_utang_piutang_bp = Blueprint("api_utang_piutang", __name__)


def serialize_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@api_utang_piutang_bp.route("/api/utang-piutang", methods=["GET"])
@api_login_required
def api_get_utang_piutang():
    user_id = g.user["id"]

    items = fetch_utang_piutang_all(user_id)
    rekening = fetch_rekening(user_id)

    return jsonify({
        "items": [serialize_row(item) for item in items],
        "rekening": [serialize_row(r) for r in rekening],
    })


@api_utang_piutang_bp.route("/api/utang-piutang", methods=["POST"])
@api_login_required
def api_create_utang_piutang():
    user_id = g.user["id"]
    data = request.get_json() or {}

    tipe = data.get("tipe", "").strip()
    deskripsi = data.get("deskripsi", "").strip()
    pihak_terkait = data.get("pihak_terkait", "").strip()
    jumlah_total = data.get("jumlah_total", 0)
    tanggal_mulai = data.get("tanggal_mulai")

    if tipe not in ["Utang", "Piutang"]:
        return jsonify({"message": "Tipe harus Utang atau Piutang."}), 400

    if not deskripsi:
        return jsonify({"message": "Deskripsi wajib diisi."}), 400

    if not pihak_terkait:
        return jsonify({"message": "Pihak terkait wajib diisi."}), 400

    try:
        jumlah_total = int(jumlah_total)

        if jumlah_total <= 0:
            return jsonify({
                "message": "Jumlah total harus lebih dari 0."
            }), 400

        tanggal_mulai_date = (
            datetime.strptime(tanggal_mulai, "%Y-%m-%d").date()
            if tanggal_mulai
            else datetime.now().date()
        )

        insert_utang_piutang(
            tipe,
            deskripsi,
            pihak_terkait,
            jumlah_total,
            tanggal_mulai_date,
            user_id
        )

        return jsonify({
            "message": "Catatan utang/piutang berhasil dibuat."
        }), 201

    except ValueError:
        return jsonify({
            "message": "Format jumlah atau tanggal tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal membuat catatan: {str(e)}"
        }), 500


@api_utang_piutang_bp.route("/api/utang-piutang/<int:item_id>/pay", methods=["POST"])
@api_login_required
def api_pay_utang_piutang(item_id):
    user_id = g.user["id"]
    data = request.get_json() or {}

    jumlah_bayar = data.get("jumlah", 0)
    rekening_id = data.get("rekening_id")

    try:
        jumlah_bayar = int(jumlah_bayar)
        rekening_id = int(rekening_id)

        if jumlah_bayar <= 0:
            return jsonify({
                "message": "Jumlah pembayaran harus lebih dari 0."
            }), 400

        item = get_utang_piutang_by_id(item_id, user_id)

        if not item:
            return jsonify({
                "message": "Data utang/piutang tidak ditemukan."
            }), 404

        terbayar_baru = float(item["jumlah_terbayar"]) + jumlah_bayar
        lunas_baru = terbayar_baru >= float(item["jumlah_total"])

        update_pembayaran_utang_piutang(
            item_id,
            terbayar_baru,
            lunas_baru,
            user_id
        )

        if item["tipe"] == "Utang":
            tipe_transaksi = "pengeluaran"
            kategori = "Pembayaran Utang"
            deskripsi_transaksi = f"Bayar Utang: {item['deskripsi']}"
        else:
            tipe_transaksi = "pemasukan"
            kategori = "Penerimaan Piutang"
            deskripsi_transaksi = f"Terima Piutang: {item['deskripsi']}"

        insert_transaksi(
            {
                "deskripsi": deskripsi_transaksi,
                "jumlah": jumlah_bayar,
                "tipe": tipe_transaksi,
                "kategori": kategori,
                "tanggal": datetime.now(),
                "rekening_id": rekening_id,
            },
            user_id
        )

        return jsonify({
            "message": "Pembayaran berhasil dicatat.",
            "jumlah_terbayar": terbayar_baru,
            "lunas": lunas_baru,
        })

    except ValueError:
        return jsonify({
            "message": "Jumlah pembayaran atau rekening tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal mencatat pembayaran: {str(e)}"
        }), 500


@api_utang_piutang_bp.route("/api/utang-piutang/<int:item_id>", methods=["DELETE"])
@api_login_required
def api_delete_utang_piutang(item_id):
    user_id = g.user["id"]

    try:
        delete_utang_piutang(item_id, user_id)

        return jsonify({
            "message": "Catatan berhasil dihapus."
        })

    except Exception as e:
        return jsonify({
            "message": f"Gagal menghapus catatan: {str(e)}"
        }), 500