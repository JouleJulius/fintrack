# auth.py

from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from supabase import create_client, Client
import os
from dotenv import load_dotenv  # <-- PERBAIKI BARIS INI

load_dotenv() # Baris ini sudah benar

# Inisialisasi Supabase (sekarang variabel akan terisi dengan benar)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Cek apakah variabel berhasil dimuat sebelum membuat client
if not supabase_url or not supabase_key:
    raise ValueError("Pastikan SUPABASE_URL dan SUPABASE_KEY ada di file .env Anda")

supabase: Client = create_client(supabase_url, supabase_key)

# Buat Blueprint
auth_bp = Blueprint('auth', __name__)

""" nonaktifkan route ini jika ingin menggunakan auth di index
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        try:
            print("--- Mencoba mendaftar dengan Supabase ---") # Pesan Debug 1
            response = supabase.auth.sign_up({
                "email": email,
                "password": password,
            })
            # Mencetak seluruh objek respons untuk analisis
            print(f"--- Respons dari Supabase: {response} ---") # Pesan Debug 2

            # Cek apakah ada user yang berhasil dibuat di dalam respons
            if response.user:
                print("--- Registrasi SUKSES (user object ditemukan) ---")
                flash('Registrasi berhasil! Silakan login.', 'success')
                return redirect(url_for('auth.login'))
            else:
                # Ini bisa terjadi jika user sudah ada atau input tidak valid
                print("--- Registrasi GAGAL (user object TIDAK ditemukan dalam respons) ---")
                flash('Gagal melakukan registrasi. Pengguna mungkin sudah ada atau input tidak valid.', 'error')
                return render_template('register.html')

        except Exception as e:
            # Blok ini akan menangkap error seperti masalah jaringan, URL/Key salah, dll.
            print(f"!!! TERJADI EXCEPTION SAAT REGISTRASI: {e} !!!") 
            flash(f"Gagal melakukan registrasi: Terjadi kesalahan internal.", 'error')
            return render_template('register.html')
            
    return render_template('register.html')"""

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        try:
            # 1. Lakukan proses login seperti biasa
            auth_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            # Ambil data user yang berhasil login
            user = auth_response.user

            # 2. Ambil role dari tabel 'profiles' menggunakan ID user
            profile_response = supabase.table('profiles').select('role').eq('id', user.id).single().execute()

            user_role = 'user'  # Atur peran default jika profil tidak ditemukan
            if profile_response.data:
                user_role = profile_response.data.get('role', 'user')

            # 3. Simpan semua informasi penting ke dalam session
            session['user'] = {
                'id': user.id,
                'email': user.email,
                'role': user_role  # <-- Peran dari tabel profiles sekarang disimpan
            }

            flash('Login berhasil!', 'success')
            return redirect(url_for('index')) # Arahkan ke halaman utama/dashboard

        except Exception as e:
            flash(f"Login Gagal: Pastikan email dan password benar.", "error")
            # flash(f"Login Gagal: {str(e)}", "error") # Gunakan ini untuk debugging
            return redirect(url_for('auth.login'))

    return render_template('login.html') # Nama template login Anda

@auth_bp.route('/logout')
def logout():
    session.pop('user', None) # Hapus session user
    flash('Anda telah logout.', 'info')
    return redirect(url_for('auth.login'))