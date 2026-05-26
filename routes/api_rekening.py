from flask import Blueprint, jsonify, request, g

from utils.api_decorators import api_login_required
from repositories.rekening_repo import fetch_rekening, insert_rekening


api_rekening_bp = Blueprint("api_rekening", __name__)


def serialize_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@api_rekening_bp.route("/api/rekening", methods=["GET"])
@api_login_required
def api_get_rekening():
    user_id = g.user["id"]
    rekening = fetch_rekening(user_id)

    return jsonify({
        "items": [serialize_row(r) for r in rekening]
    })


@api_rekening_bp.route("/api/rekening", methods=["POST"])
@api_login_required
def api_create_rekening():
    user_id = g.user["id"]
    data = request.get_json() or {}

    nama_rekening = data.get("nama_rekening", "").strip()
    jenis_rekening = data.get("jenis_rekening", "").strip()
    saldo_awal = data.get("saldo_awal", 0)

    if not nama_rekening:
        return jsonify({"message": "Nama rekening wajib diisi."}), 400

    if not jenis_rekening:
        return jsonify({"message": "Jenis rekening wajib diisi."}), 400

    try:
        insert_rekening(
            nama_rekening,
            jenis_rekening,
            int(saldo_awal),
            user_id
        )

        return jsonify({
            "message": "Rekening berhasil ditambahkan."
        }), 201

    except Exception as e:
        return jsonify({
            "message": f"Gagal menambah rekening: {str(e)}"
        }), 500