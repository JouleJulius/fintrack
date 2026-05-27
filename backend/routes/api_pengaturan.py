from flask import Blueprint, jsonify, request, g
from datetime import date, timedelta

from utils.api_decorators import api_login_required
from repositories.pengaturan_repo import get_pengaturan, upsert_pengaturan
from repositories.tabungan_repo import (
    get_dana_darurat,
    update_target_dana_darurat,
    insert_dana_darurat,
)

api_pengaturan_bp = Blueprint("api_pengaturan", __name__)


@api_pengaturan_bp.route("/api/pengaturan", methods=["GET"])
@api_login_required
def api_get_pengaturan():
    user_id = g.user["id"]

    gaji = get_pengaturan("gaji", user_id, "0")
    dana_darurat = get_dana_darurat(user_id)

    return jsonify({
        "gaji": int(gaji or 0),
        "target_dana_darurat": float(dana_darurat["target"]) if dana_darurat else 0,
        "dana_darurat": dict(dana_darurat) if dana_darurat else None,
    })


@api_pengaturan_bp.route("/api/pengaturan/gaji", methods=["PUT"])
@api_login_required
def api_update_gaji():
    user_id = g.user["id"]
    data = request.get_json() or {}

    try:
        gaji = int(data.get("gaji", 0))

        if gaji <= 0:
            return jsonify({
                "message": "Gaji harus lebih dari 0."
            }), 400

        upsert_pengaturan("gaji", str(gaji), user_id)

        target_dana_darurat = gaji * 3
        dana_darurat = get_dana_darurat(user_id)

        if dana_darurat:
            update_target_dana_darurat(target_dana_darurat, user_id)
        else:
            tenggat_default = (date.today() + timedelta(days=365 * 10)).isoformat()
            insert_dana_darurat(target_dana_darurat, tenggat_default, user_id)

        return jsonify({
            "message": "Gaji dan target Dana Darurat berhasil diperbarui.",
            "gaji": gaji,
            "target_dana_darurat": target_dana_darurat,
        })

    except ValueError:
        return jsonify({
            "message": "Format gaji tidak valid."
        }), 400

    except Exception as e:
        return jsonify({
            "message": f"Gagal memperbarui gaji: {str(e)}"
        }), 500