from flask import Blueprint, jsonify, request, g
from datetime import datetime

from utils.api_decorators import api_login_required
from repositories.tabungan_repo import (
    fetch_tabungan,
    insert_tabungan,
    get_tabungan_terkumpul,
    update_tabungan_terkumpul,
)

api_tabungan_bp = Blueprint("api_tabungan", __name__)


def serialize_value(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def serialize_row(row):
    return {
        key: serialize_value(value)
        for key, value in dict(row).items()
    }


@api_tabungan_bp.route("/api/tabungan", methods=["GET"])
@api_login_required
def api_get_tabungan():
    user_id = g.user["id"]
    tabungan = fetch_tabungan(user_id)

    return jsonify({
        "items": [serialize_row(t) for t in tabungan]
    })


@api_tabungan_bp.route("/api/tabungan", methods=["POST"])
@api_login_required
def api_create_tabungan():
    user_id = g.user["id"]
    data = request.get_json() or {}

    nama = data.get("nama", "").strip()
    target = data.get("target", 0)
    tenggat = data.get("tenggat")

    if not nama:
        return jsonify({"message": "Nama target wajib diisi."}), 400

    if nama.lower() == "dana darurat":
        return jsonify({
            "message": "Nama 'Dana Darurat' sudah dipakai oleh sistem."
        }), 400

    try:
        target = int(target)

        if target <= 0:
            return jsonify({
                "message": "Target dana harus lebih dari 0."
            }), 400

        tenggat_date = datetime.strptime(tenggat, "%Y-%m-%d").date()

        insert_tabungan(
            nama,
            target,
            0.0,
            tenggat_date,
            user_id
        )

        return jsonify({
            "message": "Target tabungan berhasil dibuat."
        }), 201

    except ValueError:
        return jsonify({
            "message": "Format target atau tanggal tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal membuat tabungan: {str(e)}"
        }), 500


@api_tabungan_bp.route("/api/tabungan/<int:tabungan_id>/add-fund", methods=["POST"])
@api_login_required
def api_add_fund_tabungan(tabungan_id):
    user_id = g.user["id"]
    data = request.get_json() or {}

    jumlah = data.get("jumlah", 0)

    try:
        jumlah = int(jumlah)

        if jumlah <= 0:
            return jsonify({
                "message": "Jumlah dana harus lebih dari 0."
            }), 400

        tabungan = get_tabungan_terkumpul(tabungan_id, user_id)

        if not tabungan:
            return jsonify({
                "message": "Target tabungan tidak ditemukan."
            }), 404

        terkumpul_baru = float(tabungan.get("terkumpul", 0)) + jumlah

        update_tabungan_terkumpul(
            tabungan_id,
            terkumpul_baru,
            user_id
        )

        return jsonify({
            "message": "Dana berhasil ditambahkan ke tabungan.",
            "terkumpul": terkumpul_baru
        })

    except ValueError:
        return jsonify({
            "message": "Jumlah dana tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal menambah dana tabungan: {str(e)}"
        }), 500