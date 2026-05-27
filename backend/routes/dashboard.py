from flask import Blueprint, render_template, request, session
from datetime import datetime, timedelta

import json

from utils.decorators import login_required
from utils.constants import KATEGORI_PENGELUARAN
from utils.date_helper import parse_datetime_value

from repositories.transaksi_repo import fetch_all_transaksi
from repositories.pengaturan_repo import get_pengaturan
from repositories.anggaran_repo import fetch_anggaran
from repositories.rekening_repo import fetch_rekening
from repositories.tabungan_repo import fetch_tabungan
from repositories.utang_piutang_repo import fetch_utang_piutang_aktif


dashboard_bp = Blueprint("dashboard", __name__)


def current_user_id():
    return session["user"]["id"]


@dashboard_bp.route("/")
@login_required
def index():
    user_id = current_user_id()
    today = datetime.now()

    bulan_filter = request.args.get("bulan", default=today.month, type=int)
    tahun_filter = request.args.get("tahun", default=today.year, type=int)

    all_transaksi = fetch_all_transaksi(user_id)
    gaji = int(get_pengaturan("gaji", user_id, "0"))

    total_pemasukan_all = sum(
        int(t.get("jumlah", 0))
        for t in all_transaksi
        if t.get("tipe") == "pemasukan"
    )

    total_pengeluaran_all = sum(
        int(t.get("jumlah", 0))
        for t in all_transaksi
        if t.get("tipe") == "pengeluaran"
    )

    total_saldo_saat_ini = total_pemasukan_all - total_pengeluaran_all

    transaksi_bulan_ini = []
    for t in all_transaksi:
        tanggal = parse_datetime_value(t.get("tanggal"))

        if tanggal and tanggal.month == bulan_filter and tanggal.year == tahun_filter:
            transaksi_bulan_ini.append(t)

    pemasukan_bulan_ini = sum(
        float(t.get("jumlah", 0))
        for t in transaksi_bulan_ini
        if t.get("tipe") == "pemasukan" and t.get("kategori") != "Transfer"
    )

    pengeluaran_bulan_ini = sum(
        float(t.get("jumlah", 0))
        for t in transaksi_bulan_ini
        if t.get("tipe") == "pengeluaran" and t.get("kategori") != "Transfer"
    )

    pengeluaran_kategori = {k: 0.0 for k in KATEGORI_PENGELUARAN}

    for t in transaksi_bulan_ini:
        if t.get("tipe") == "pengeluaran" and t.get("kategori") in pengeluaran_kategori:
            pengeluaran_kategori[t["kategori"]] += float(t.get("jumlah", 0))

    chart_data = {
        "labels": list(pengeluaran_kategori.keys()),
        "data": list(pengeluaran_kategori.values()),
    }

    tren_data = {
        "labels": [],
        "pemasukan": [],
        "pengeluaran": [],
    }

    for i in range(5, -1, -1):
        target_date = today - timedelta(days=i * 30)
        bulan_tren = target_date.month
        tahun_tren = target_date.year

        transaksi_per_bulan = []

        for t in all_transaksi:
            tanggal = parse_datetime_value(t.get("tanggal"))

            if tanggal and tanggal.month == bulan_tren and tanggal.year == tahun_tren:
                transaksi_per_bulan.append(t)

        tren_pemasukan = sum(
            float(t.get("jumlah", 0))
            for t in transaksi_per_bulan
            if t.get("tipe") == "pemasukan"
        )

        tren_pengeluaran = sum(
            float(t.get("jumlah", 0))
            for t in transaksi_per_bulan
            if t.get("tipe") == "pengeluaran"
        )

        tren_data["labels"].append(f"{bulan_tren}/{tahun_tren}")
        tren_data["pemasukan"].append(tren_pemasukan)
        tren_data["pengeluaran"].append(tren_pengeluaran)

    total_tren_pemasukan = sum(tren_data["pemasukan"])
    total_tren_pengeluaran = sum(tren_data["pengeluaran"])
    arus_kas_bersih_tren = total_tren_pemasukan - total_tren_pengeluaran

    anggaran_status = []
    anggaran = fetch_anggaran(bulan_filter, tahun_filter, user_id)

    for a in anggaran:
        terpakai = sum(
            float(t.get("jumlah", 0))
            for t in transaksi_bulan_ini
            if t.get("kategori") == a.get("kategori")
            and t.get("tipe") == "pengeluaran"
        )

        batas = float(a.get("batas", 0))

        anggaran_status.append({
            "kategori": a.get("kategori"),
            "batas": batas,
            "terpakai": terpakai,
            "sisa": batas - terpakai,
            "melebihi": terpakai > batas,
        })

    semua_tabungan = fetch_tabungan(user_id)

    dana_darurat_obj_from_db = next(
        (t for t in semua_tabungan if t.get("nama") == "Dana Darurat"),
        None
    )

    tabungan_lain = [
        t for t in semua_tabungan
        if t.get("nama") != "Dana Darurat"
    ]

    DANA_AMAN_TARGET = 10000000.0
    current_waterfall_balance = total_saldo_saat_ini

    dana_aman_terpenuhi_dynamic = min(
        current_waterfall_balance,
        DANA_AMAN_TARGET
    )

    current_waterfall_balance -= dana_aman_terpenuhi_dynamic

    dana_darurat_obj = None
    dana_darurat_terpenuhi_dynamic = 0.0
    dana_darurat_target = 0.0

    if dana_darurat_obj_from_db:
        dana_darurat_target = float(
            dana_darurat_obj_from_db.get("target", 0)
        )

        dana_darurat_terpenuhi_dynamic = min(
            current_waterfall_balance,
            dana_darurat_target
        )

        current_waterfall_balance -= dana_darurat_terpenuhi_dynamic

        dana_darurat_obj = {
            "id": dana_darurat_obj_from_db["id"],
            "nama": dana_darurat_obj_from_db["nama"],
            "target": dana_darurat_target,
            "terkumpul": dana_darurat_terpenuhi_dynamic,
            "tenggat": dana_darurat_obj_from_db.get("tenggat"),
            "terpenuhi": dana_darurat_terpenuhi_dynamic >= dana_darurat_target
            if dana_darurat_target > 0
            else False,
        }

    saldo_produktif = current_waterfall_balance

    rekening_dengan_saldo = []
    rekening_list = fetch_rekening(user_id)

    for rek in rekening_list:
        tx_for_rek = [
            t for t in all_transaksi
            if t.get("rekening_id") == rek["id"]
        ]

        pemasukan_rek = sum(
            float(t["jumlah"])
            for t in tx_for_rek
            if t["tipe"] == "pemasukan"
        )

        pengeluaran_rek = sum(
            float(t["jumlah"])
            for t in tx_for_rek
            if t["tipe"] == "pengeluaran"
        )

        saldo_sekarang = (
            float(rek.get("saldo_awal", 0))
            + pemasukan_rek
            - pengeluaran_rek
        )

        rek["saldo_sekarang"] = saldo_sekarang
        rekening_dengan_saldo.append(rek)

    utang_piutang_summary = {
        "total_utang": 0.0,
        "total_piutang": 0.0,
    }

    semua_utang_piutang = fetch_utang_piutang_aktif(user_id)

    for item in semua_utang_piutang:
        sisa = (
            float(item.get("jumlah_total", 0))
            - float(item.get("jumlah_terbayar", 0))
        )

        if item.get("tipe") == "Utang":
            utang_piutang_summary["total_utang"] += sisa

        elif item.get("tipe") == "Piutang":
            utang_piutang_summary["total_piutang"] += sisa

    return render_template(
        "index.html",
        transaksi=transaksi_bulan_ini[:5],
        dana_aman_terpenuhi=dana_aman_terpenuhi_dynamic,
        DANA_AMAN_TARGET=DANA_AMAN_TARGET,
        saldo_produktif=saldo_produktif,
        pemasukan_bulan_ini=pemasukan_bulan_ini,
        pengeluaran_bulan_ini=pengeluaran_bulan_ini,
        dana_darurat=dana_darurat_obj,
        tabungan=tabungan_lain,
        gaji=gaji,
        chart_data=json.dumps(chart_data),
        tren_data=json.dumps(tren_data),
        anggaran_status=anggaran_status,
        total_tren_pemasukan=total_tren_pemasukan,
        total_tren_pengeluaran=total_tren_pengeluaran,
        arus_kas_bersih_tren=arus_kas_bersih_tren,
        rekening_data=rekening_dengan_saldo,
        utang_piutang_data=utang_piutang_summary,
        bulan=bulan_filter,
        tahun=tahun_filter,
    )