from flask import Blueprint, jsonify, request, g
from datetime import datetime

from utils.api_decorators import api_login_required
from utils.constants import KATEGORI_PENGELUARAN
from repositories.anggaran_repo import fetch_anggaran, insert_anggaran

api_anggaran_bp = Blueprint("api_anggaran", __name__)


def serialize_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@api_anggaran_bp.route("/api/anggaran", methods=["GET"])
@api_login_required
def api_get_anggaran():
    user_id = g.user["id"]

    today = datetime.now()
    bulan = request.args.get("bulan", default=today.month, type=int)
    tahun = request.args.get("tahun", default=today.year, type=int)

    anggaran = fetch_anggaran(bulan, tahun, user_id)

    return jsonify({
        "items": [serialize_row(a) for a in anggaran],
        "kategori": KATEGORI_PENGELUARAN,
        "filter": {
            "bulan": bulan,
            "tahun": tahun,
        }
    })


@api_anggaran_bp.route("/api/anggaran", methods=["POST"])
@api_login_required
def api_create_anggaran():
    user_id = g.user["id"]
    data = request.get_json() or {}

    kategori = data.get("kategori", "").strip()
    batas = data.get("batas", 0)
    bulan = data.get("bulan")
    tahun = data.get("tahun")

    if not kategori:
        return jsonify({"message": "Kategori wajib dipilih."}), 400

    try:
        batas = int(batas)
        bulan = int(bulan)
        tahun = int(tahun)

        if batas <= 0:
            return jsonify({"message": "Batas anggaran harus lebih dari 0."}), 400

        if bulan < 1 or bulan > 12:
            return jsonify({"message": "Bulan tidak valid."}), 400

        insert_anggaran(kategori, batas, bulan, tahun, user_id)

        return jsonify({
            "message": "Anggaran berhasil ditambahkan."
        }), 201

    except ValueError:
        return jsonify({
            "message": "Input anggaran tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal menambah anggaran: {str(e)}"
        }), 500