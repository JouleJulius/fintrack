from flask import Flask
from dotenv import load_dotenv
import os
import locale

from auth import auth_bp

from routes.dashboard import dashboard_bp
from routes.transaksi import transaksi_bp
from routes.rekening import rekening_bp
from routes.anggaran import anggaran_bp
from routes.tabungan import tabungan_bp
from routes.utang_piutang import utang_piutang_bp
from routes.export import export_bp
from routes.admin import admin_bp
from routes.pengaturan import pengaturan_bp
from routes.api_dashboard import api_dashboard_bp
from routes.api_transaksi import api_transaksi_bp
from routes.api_rekening import api_rekening_bp
from routes.api_tabungan import api_tabungan_bp
from routes.api_anggaran import api_anggaran_bp
from routes.api_utang_piutang import api_utang_piutang_bp
from routes.api_admin import api_admin_bp
from routes.api_pengaturan import api_pengaturan_bp

from utils.date_helper import format_datetime
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")

app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
)

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
)

app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(transaksi_bp)
app.register_blueprint(rekening_bp)
app.register_blueprint(anggaran_bp)
app.register_blueprint(tabungan_bp)
app.register_blueprint(utang_piutang_bp)
app.register_blueprint(export_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(pengaturan_bp)
app.register_blueprint(api_dashboard_bp)
app.register_blueprint(api_transaksi_bp)
app.register_blueprint(api_rekening_bp)
app.register_blueprint(api_tabungan_bp)
app.register_blueprint(api_anggaran_bp)
app.register_blueprint(api_utang_piutang_bp)
app.register_blueprint(api_admin_bp)
app.register_blueprint(api_pengaturan_bp)

try:
    locale.setlocale(locale.LC_TIME, "id_ID.UTF-8")
except locale.Error:
    try:
        locale.setlocale(locale.LC_TIME, "Indonesian_Indonesia.1252")
    except locale.Error:
        print("Peringatan: Locale Indonesia tidak ditemukan. Menggunakan locale default.")

app.jinja_env.filters["datetimeformat"] = format_datetime

if __name__ == "__main__":
    app.run(debug=True)