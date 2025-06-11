from flask import Flask, render_template, request, redirect, url_for, flash, get_flashed_messages, send_file, Response, jsonify
from supabase import create_client, Client
from datetime import datetime, date, timedelta
import pandas as pd
from io import BytesIO
import json
import os
from dotenv import load_dotenv
from fpdf import FPDF

# 1. Inisialisasi Aplikasi Flask
app = Flask(__name__)
# Diperlukan untuk flash messages
app.secret_key = os.urandom(24) 

# 2. Muat Variabel Lingkungan dan Inisialisasi Supabase
load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL dan SUPABASE_KEY harus didefinisikan di file .env")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    raise ValueError(f"Gagal menginisialisasi klien Supabase: {str(e)}")

# 3. Variabel Global/Konstanta
KATEGORI_PENGELUARAN = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Alokasi Dana', 'Pembayaran Utang', 'Pemberian Piutang', 'Transfer', 'Lainnya']
KATEGORI_PEMASUKAN = ['Gaji', 'Hadiah', 'Freelance', 'Investasi', 'Penerimaan Piutang', 'Penerimaan Utang', 'Transfer', 'Lainnya']

# --- Helper untuk format tanggal di Jinja ---
def format_datetime(value, format='%Y-%m-%d'):
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    if hasattr(value, 'strftime'):
        return value.strftime(format)
    return value

app.jinja_env.filters['datetimeformat'] = format_datetime

# 4. Rute Utama (Dashboard)
@app.route('/')
def index():
    # --- Bagian 1: Pengambilan Data Awal ---
    today = date.today()
    bulan_filter = request.args.get('bulan', today.month, type=int)
    tahun_filter = request.args.get('tahun', today.year, type=int)

    all_transaksi, gaji = [], 0.0
    try:
        gaji_response = supabase.table('pengaturan').select('nilai').eq('kunci', 'gaji').execute()
        gaji = float(gaji_response.data[0]['nilai']) if gaji_response.data else 0.0
        transaksi_response = supabase.table('transaksi').select('*').order('tanggal', desc=True).execute()
        all_transaksi = transaksi_response.data or []
    except Exception as e:
        print(f"Error fetching initial data: {e}")
        flash(f"Gagal mengambil data awal: {e}", "error")

    # --- Bagian 2: Perhitungan Umum & Data Chart ---
    total_pemasukan_all = sum(float(t.get('jumlah', 0)) for t in all_transaksi if t.get('tipe') == 'pemasukan')
    total_pengeluaran_all = sum(float(t.get('jumlah', 0)) for t in all_transaksi if t.get('tipe') == 'pengeluaran')
    total_saldo = total_pemasukan_all - total_pengeluaran_all
    
    transaksi_bulan_ini = [t for t in all_transaksi if t.get('bulan') == bulan_filter and t.get('tahun') == tahun_filter]
    pemasukan_bulan_ini = sum(float(t.get('jumlah', 0)) for t in transaksi_bulan_ini if t.get('tipe') == 'pemasukan' and t.get('kategori') != 'Transfer')
    pengeluaran_bulan_ini = sum(float(t.get('jumlah', 0)) for t in transaksi_bulan_ini if t.get('tipe') == 'pengeluaran' and t.get('kategori') != 'Transfer')
    
    pengeluaran_kategori = {k: 0.0 for k in KATEGORI_PENGELUARAN}
    for t in transaksi_bulan_ini:
        if t.get('tipe') == 'pengeluaran' and t.get('kategori') in pengeluaran_kategori:
            pengeluaran_kategori[t['kategori']] += float(t.get('jumlah', 0))
    chart_data = {'labels': list(pengeluaran_kategori.keys()), 'data': list(pengeluaran_kategori.values())}

    tren_data = {'labels': [], 'pemasukan': [], 'pengeluaran': []}
    for i in range(5, -1, -1):
        target_date = today - timedelta(days=i*30)
        bulan_tren, tahun_tren = target_date.month, target_date.year
        transaksi_per_bulan = [t for t in all_transaksi if t.get('bulan') == bulan_tren and t.get('tahun') == tahun_tren]
        tren_pemasukan = sum(float(t.get('jumlah', 0)) for t in transaksi_per_bulan if t.get('tipe') == 'pemasukan')
        tren_pengeluaran = sum(float(t.get('jumlah', 0)) for t in transaksi_per_bulan if t.get('tipe') == 'pengeluaran')
        tren_data['labels'].append(f"{bulan_tren}/{tahun_tren}")
        tren_data['pemasukan'].append(tren_pemasukan)
        tren_data['pengeluaran'].append(tren_pengeluaran)
    total_tren_pemasukan = sum(tren_data['pemasukan'])
    total_tren_pengeluaran = sum(tren_data['pengeluaran'])
    arus_kas_bersih_tren = total_tren_pemasukan - total_tren_pengeluaran

    # --- Bagian 3: Logika Anggaran ---
    anggaran_status = []
    try:
        anggaran = supabase.table('anggaran').select('*').eq('bulan', bulan_filter).eq('tahun', tahun_filter).execute().data or []
        for a in anggaran:
            terpakai = sum(float(t.get('jumlah', 0)) for t in transaksi_bulan_ini if t.get('kategori') == a.get('kategori') and t.get('tipe') == 'pengeluaran')
            anggaran_status.append({'kategori': a.get('kategori'), 'batas': float(a.get('batas', 0)), 'terpakai': terpakai, 'sisa': float(a.get('batas', 0)) - terpakai, 'melebihi': terpakai > float(a.get('batas', 0))})
    except Exception as e:
        print(f"Error fetching anggaran: {e}")

    # --- Bagian 4: Logika Dana Darurat & Tabungan (Final) ---
    # (Penting: Blok ini harus ada SEBELUM logika waterfall)
    dana_darurat_obj, tabungan_lain = None, []
    try:
        dd_response = supabase.table('tabungan').select('id, target, terkumpul').eq('nama', 'Dana Darurat').maybe_single().execute()
        if not dd_response.data:
            tenggat_darurat = (date.today() + timedelta(days=365*10)).isoformat()
            supabase.table('tabungan').insert({
                'nama': 'Dana Darurat', 'target': gaji * 3 if gaji > 0 else 0, 'terkumpul': 0.0, 'tenggat': tenggat_darurat
            }).execute()
        else:
            current_target = float(dd_response.data.get('target', 0))
            new_target = gaji * 3
            if current_target != new_target and gaji > 0:
                supabase.table('tabungan').update({'target': new_target}).eq('nama', 'Dana Darurat').execute()
        
        semua_tabungan = supabase.table('tabungan').select('*').order('id').execute().data or []
        dana_darurat_obj = next((t for t in semua_tabungan if t.get('nama') == 'Dana Darurat'), None)
        tabungan_lain = [t for t in semua_tabungan if t.get('nama') != 'Dana Darurat']
    except Exception as e:
        print(f"!!! TERJADI ERROR PADA BLOK TABUNGAN: {e} !!!")

    # --- Bagian 5: LOGIKA WATERFALL (Final) ---
    DANA_AMAN_TARGET = 10000000.0
    dana_aman_terpenuhi = 0.0
    saldo_produktif = 0.0
    
    if not dana_darurat_obj:
        dana_darurat_obj = {'target': gaji * 3, 'terkumpul': 0.0, 'terpenuhi': False}

    dana_darurat_terkumpul_saat_ini = float(dana_darurat_obj.get('terkumpul', 0))
    dana_darurat_target = float(dana_darurat_obj.get('target', 0))

    sisa_uang = total_saldo
    dana_aman_terpenuhi = min(sisa_uang, DANA_AMAN_TARGET)
    sisa_uang_setelah_aman = sisa_uang - dana_aman_terpenuhi
    
    kebutuhan_dana_darurat = max(0, dana_darurat_target - dana_darurat_terkumpul_saat_ini)
    alokasi_ke_dana_darurat = min(sisa_uang_setelah_aman, kebutuhan_dana_darurat)
    
    dana_darurat_obj['terkumpul'] = dana_darurat_terkumpul_saat_ini + alokasi_ke_dana_darurat
    dana_darurat_obj['terpenuhi'] = dana_darurat_obj['terkumpul'] >= dana_darurat_target if dana_darurat_target > 0 else True
    
    sisa_uang_setelah_darurat = sisa_uang_setelah_aman - alokasi_ke_dana_darurat
    saldo_produktif = sisa_uang_setelah_darurat

    # --- Bagian 6: Logika Saldo Rekening ---
    rekening_dengan_saldo = []
    try:
        rekening_list = supabase.table('rekening').select('*').order('id').execute().data or []
        for rek in rekening_list:
            tx_for_rek = [t for t in all_transaksi if t.get('rekening_id') == rek['id']]
            pemasukan = sum(float(t['jumlah']) for t in tx_for_rek if t['tipe'] == 'pemasukan')
            pengeluaran = sum(float(t['jumlah']) for t in tx_for_rek if t['tipe'] == 'pengeluaran')
            saldo_sekarang = float(rek['saldo_awal']) + pemasukan - pengeluaran
            rek_info = rek.copy()
            rek_info['saldo_sekarang'] = saldo_sekarang
            rekening_dengan_saldo.append(rek_info)
    except Exception as e:
        print(f"Error calculating rekening balances: {e}")

    # --- Bagian 7: Logika Utang Piutang ---
    utang_piutang_summary = {'total_utang': 0.0, 'total_piutang': 0.0}
    try:
        semua_utang_piutang = supabase.table('utang_piutang').select('*').eq('lunas', False).execute().data or []
        for item in semua_utang_piutang:
            sisa = float(item.get('jumlah_total', 0)) - float(item.get('jumlah_terbayar', 0))
            if item.get('tipe') == 'Utang':
                utang_piutang_summary['total_utang'] += sisa
            elif item.get('tipe') == 'Piutang':
                utang_piutang_summary['total_piutang'] += sisa
    except Exception as e:
        print(f"Error fetching utang_piutang data: {e}")

    # --- Bagian 8: Final Render ---
    return render_template('index.html',
        transaksi=transaksi_bulan_ini[:5],
        dana_aman_terpenuhi=dana_aman_terpenuhi, DANA_AMAN_TARGET=DANA_AMAN_TARGET,
        saldo_produktif=saldo_produktif, pemasukan_bulan_ini=pemasukan_bulan_ini,
        pengeluaran_bulan_ini=pengeluaran_bulan_ini,
        dana_darurat=dana_darurat_obj, tabungan=tabungan_lain, gaji=gaji,
        chart_data=json.dumps(chart_data), tren_data=json.dumps(tren_data), 
        anggaran_status=anggaran_status, total_tren_pemasukan=total_tren_pemasukan,
        total_tren_pengeluaran=total_tren_pengeluaran, arus_kas_bersih_tren=arus_kas_bersih_tren,
        rekening_data=rekening_dengan_saldo,
        utang_piutang_data=utang_piutang_summary
    )

# --- SEMUA FUNGSI HALAMAN LAINNYA ---
@app.route('/atur_gaji', methods=['GET', 'POST'])
def atur_gaji():
    if request.method == 'POST':
        gaji = request.form.get('gaji', '0')
        supabase.table('pengaturan').upsert({'kunci': 'gaji', 'nilai': gaji}).execute()
        flash('Gaji berhasil diperbarui!', 'success')
        return redirect(url_for('index'))
    gaji_saat_ini = "0"
    try:
        response = supabase.table('pengaturan').select('nilai').eq('kunci', 'gaji').execute()
        if response.data:
            gaji_saat_ini = response.data[0]['nilai']
    except Exception:
        pass
    return render_template('atur_gaji.html', gaji=gaji_saat_ini)

# GANTI FUNGSI LAMA INI DENGAN VERSI BARU YANG MENGIRIM SALDO REKENING
@app.route('/tambah_transaksi', methods=['GET', 'POST'])
def tambah_transaksi():
    rekening_dengan_saldo = []
    try:
        # Bagian ini penting: menghitung saldo terkini untuk setiap rekening
        transaksi_response = supabase.table('transaksi').select('*').order('tanggal', desc=True).execute()
        all_transaksi = transaksi_response.data or []
        rekening_list = supabase.table('rekening').select('*').order('id').execute().data or []
        for rek in rekening_list:
            tx_for_rek = [t for t in all_transaksi if t.get('rekening_id') == rek['id']]
            # Modifikasi: Jangan hitung 'Transfer' dalam perhitungan pemasukan/pengeluaran umum rekening
            pemasukan = sum(float(t['jumlah']) for t in tx_for_rek if t['tipe'] == 'pemasukan' and t.get('kategori') != 'Transfer')
            pengeluaran = sum(float(t['jumlah']) for t in tx_for_rek if t['tipe'] == 'pengeluaran' and t.get('kategori') != 'Transfer')
            saldo_sekarang = float(rek['saldo_awal']) + pemasukan - pengeluaran
            rek_info = rek.copy()
            rek_info['saldo_sekarang'] = saldo_sekarang
            rekening_dengan_saldo.append(rek_info)
    except Exception as e:
        flash(f"Gagal mengambil daftar rekening: {e}", "error")

    if request.method == 'POST':
        # ... (Seluruh logika POST Anda tidak perlu diubah) ...
        try:
            tipe = request.form['tipe']
            jumlah = float(request.form['jumlah'])
            tanggal_str = request.form['tanggal']
            tanggal_obj = datetime.strptime(tanggal_str, '%Y-%m-%d').date()
            deskripsi = request.form.get('deskripsi', '')

            if tipe == 'transfer':
                rekening_sumber_id = int(request.form['rekening_sumber_id'])
                rekening_tujuan_id = int(request.form['rekening_tujuan_id'])

                if rekening_sumber_id == rekening_tujuan_id:
                    flash("Rekening sumber dan tujuan tidak boleh sama.", "error")
                    return redirect(url_for('tambah_transaksi'))

                transaksi_keluar = {
                    'deskripsi': deskripsi or f"Transfer ke rekening lain", 'jumlah': jumlah, 'tipe': 'pengeluaran', 'kategori': 'Transfer',
                    'tanggal': tanggal_obj.isoformat(), 'bulan': tanggal_obj.month, 'tahun': tanggal_obj.year, 'rekening_id': rekening_sumber_id
                }
                transaksi_masuk = {
                    'deskripsi': deskripsi or f"Transfer dari rekening lain", 'jumlah': jumlah, 'tipe': 'pemasukan', 'kategori': 'Transfer',
                    'tanggal': tanggal_obj.isoformat(), 'bulan': tanggal_obj.month, 'tahun': tanggal_obj.year, 'rekening_id': rekening_tujuan_id
                }
                supabase.table('transaksi').insert([transaksi_keluar, transaksi_masuk]).execute()
                flash('Transfer dana berhasil dicatat!', 'success')
            else:
                kategori = request.form['kategori']
                rekening_id = int(request.form['rekening_id'])
                pihak_terkait = request.form.get('pihak_terkait')

                supabase.table('transaksi').insert({
                    'deskripsi': deskripsi, 'jumlah': jumlah, 'tipe': tipe, 'kategori': kategori,
                    'tanggal': tanggal_obj.isoformat(), 'bulan': tanggal_obj.month, 'tahun': tanggal_obj.year,
                    'rekening_id': rekening_id
                }).execute()
                
                if kategori == 'Pemberian Piutang' and pihak_terkait:
                    # ... (logika utang/piutang) ...
                    pass
                elif kategori == 'Penerimaan Utang' and pihak_terkait:
                    # ... (logika utang/piutang) ...
                    pass
                flash('Transaksi berhasil ditambahkan!', 'success')

            return redirect(url_for('index'))
        
        except Exception as e:
            flash(f"Terjadi error: {e}", "error")
            
    # Pastikan mengirim 'rekening_dengan_saldo' ke template
    return render_template('tambah_transaksi.html', kategori_pengeluaran=KATEGORI_PENGELUARAN, kategori_pemasukan=KATEGORI_PEMASUKAN, rekening=rekening_dengan_saldo)

@app.route('/hapus_transaksi/<int:id>')
def hapus_transaksi(id):
    try:
        supabase.table('transaksi').delete().eq('id', id).execute()
        flash('Transaksi berhasil dihapus.', 'success')
    except Exception as e:
        flash(f"Gagal menghapus transaksi: {e}", "error")
    return redirect(url_for('index'))

@app.route('/tambah_rekening', methods=['GET', 'POST'])
def tambah_rekening():
    if request.method == 'POST':
        try:
            supabase.table('rekening').insert({
                'nama_rekening': request.form['nama_rekening'],
                'jenis_rekening': request.form['jenis_rekening'],
                'saldo_awal': float(request.form['saldo_awal'])
            }).execute()
            flash('Rekening baru berhasil ditambahkan!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            flash(f"Gagal menambah rekening: {e}", "error")
    return render_template('tambah_rekening.html')

@app.route('/tambah_anggaran', methods=['GET', 'POST'])
def tambah_anggaran():
    if request.method == 'POST':
        try:
            supabase.table('anggaran').insert({
                'kategori': request.form['kategori'], 'batas': float(request.form['batas']),
                'bulan': int(request.form['bulan']), 'tahun': int(request.form['tahun'])
            }).execute()
            flash('Anggaran berhasil ditambahkan!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            flash(f"Gagal menambah anggaran: {e}", "error")
    return render_template('tambah_anggaran.html', kategori=KATEGORI_PENGELUARAN, current_year=datetime.now().year)

@app.route('/tambah_tabungan', methods=['GET', 'POST'])
def tambah_tabungan():
    if request.method == 'POST':
        try:
            nama_tabungan = request.form['nama']
            if nama_tabungan.lower() == 'dana darurat':
                return render_template('tambah_tabungan.html', error="Nama 'Dana Darurat' sudah dipakai oleh sistem. Silakan gunakan nama lain.")
            supabase.table('tabungan').insert({
                'nama': nama_tabungan, 'target': float(request.form['target']), 'terkumpul': 0.0,
                'tenggat': datetime.strptime(request.form['tenggat'], '%Y-%m-%d').date().isoformat()
            }).execute()
            flash('Target tabungan baru berhasil dibuat!', 'success')
            return redirect(url_for('index'))
        except Exception as e:
            return render_template('tambah_tabungan.html', error=str(e))
    return render_template('tambah_tabungan.html')

@app.route('/tambah_dana_tabungan/<int:id>', methods=['POST'])
def tambah_dana_tabungan(id):
    try:
        jumlah = float(request.form['jumlah'])
        response = supabase.table('tabungan').select('terkumpul').eq('id', id).single().execute()
        if response.data:
            terkumpul_sekarang = float(response.data.get('terkumpul', 0))
            terkumpul_baru = terkumpul_sekarang + jumlah
            supabase.table('tabungan').update({'terkumpul': terkumpul_baru}).eq('id', id).execute()
            flash(f'Dana sebesar Rp {jumlah:,.2f} berhasil ditambahkan ke tabungan!', 'success')
        else:
            flash(f'Error: Target tabungan dengan ID {id} tidak ditemukan.', 'error')
    except Exception as e:
        flash(f"Error saat menambah dana tabungan: {e}", "error")
    return redirect(url_for('index'))

# --- RUTE UNTUK FITUR UTANG PIUTANG ---
@app.route('/utang_piutang')
def utang_piutang():
    items, rekening_list = [], []
    try:
        response = supabase.table('utang_piutang').select('*').order('lunas').order('tanggal_jatuh_tempo').execute()
        items = response.data or []
        rekening_list = supabase.table('rekening').select('id, nama_rekening').execute().data or []
    except Exception as e:
        flash(f"Gagal mengambil data utang/piutang: {e}", "error")
    return render_template('utang_piutang.html', items=items, rekening_list=rekening_list)

@app.route('/bayar_cicilan', methods=['POST'])
def bayar_cicilan():
    try:
        utang_piutang_id = int(request.form['utang_piutang_id'])
        tipe_up = request.form['tipe_utang_piutang']
        jumlah_bayar = float(request.form['jumlah'])
        tanggal_obj = datetime.strptime(request.form['tanggal'], '%Y-%m-%d').date()
        rekening_id = int(request.form['rekening_id'])
        item_response = supabase.table('utang_piutang').select('*').eq('id', utang_piutang_id).single().execute()
        item = item_response.data
        terbayar_baru = float(item['jumlah_terbayar']) + jumlah_bayar
        lunas_baru = terbayar_baru >= float(item['jumlah_total'])
        supabase.table('utang_piutang').update({
            'jumlah_terbayar': terbayar_baru, 'lunas': lunas_baru
        }).eq('id', utang_piutang_id).execute()
        if tipe_up == 'Utang':
            tipe_transaksi, kategori = 'pengeluaran', 'Pembayaran Utang'
            desk_auto = f"Bayar Utang: {item['deskripsi']}"
        else:
            tipe_transaksi, kategori = 'pemasukan', 'Penerimaan Piutang'
            desk_auto = f"Terima Piutang: {item['deskripsi']}"
        supabase.table('transaksi').insert({
            'deskripsi': desk_auto, 'jumlah': jumlah_bayar, 'tipe': tipe_transaksi,
            'kategori': kategori, 'tanggal': tanggal_obj.isoformat(),
            'bulan': tanggal_obj.month, 'tahun': tanggal_obj.year, 'rekening_id': rekening_id
        }).execute()
        flash(f"Pembayaran sejumlah Rp {jumlah_bayar:,.2f} berhasil dicatat!", "success")
    except Exception as e:
        flash(f"Error saat mencatat pembayaran: {e}", "error")
    return redirect(url_for('utang_piutang'))

@app.route('/hapus_utang_piutang/<int:id>')
def hapus_utang_piutang(id):
    try:
        supabase.table('utang_piutang').delete().eq('id', id).execute()
        flash('Catatan utang/piutang berhasil dihapus.', 'success')
    except Exception as e:
        flash(f"Gagal menghapus catatan: {e}", "error")
    return redirect(url_for('utang_piutang'))

@app.route('/transaksi')
def semua_transaksi():
    # Tentukan jumlah item per halaman
    PER_PAGE = 15 
    
    # Ambil nomor halaman dari URL, default-nya adalah halaman 1
    page = request.args.get('page', 1, type=int)
    
    # Hitung offset untuk query database
    offset = (page - 1) * PER_PAGE
    
    try:
        # Ambil total jumlah transaksi untuk menghitung total halaman
        count_response = supabase.table('transaksi').select('id', count='exact').execute()
        total_items = count_response.count
        
        # Ambil data transaksi sesuai halaman saat ini
        transaksi_response = supabase.table('transaksi').select('*').order('tanggal', desc=True).limit(PER_PAGE).offset(offset).execute()
        transaksi_list = transaksi_response.data or []
        
        # Hitung total halaman
        total_pages = (total_items + PER_PAGE - 1) // PER_PAGE

    except Exception as e:
        flash(f"Gagal mengambil riwayat transaksi: {e}", "error")
        transaksi_list = []
        total_pages = 0

    return render_template(
        'semua_transaksi.html', 
        transaksi=transaksi_list,
        current_page=page,
        total_pages=total_pages
    )
# ===============================================

# --- Kode Ekspor (Tidak diubah) ---
class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Laporan Keuangan Pribadi', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Halaman {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(5)

    def fancy_table(self, header, data):
        self.set_fill_color(230, 230, 230)
        self.set_text_color(0)
        self.set_draw_color(128)
        self.set_line_width(0.3)
        self.set_font('', 'B')
        col_widths = [25, 105, 30, 25, 25]
        for i, h in enumerate(header):
            self.cell(col_widths[i], 7, h, 1, 0, 'C', 1)
        self.ln()
        self.set_font('')
        fill = False
        for row in data:
            self.cell(col_widths[0], 6, str(row.get('tanggal', '')), 'LR', 0, 'L', fill)
            self.cell(col_widths[1], 6, str(row.get('deskripsi', '')), 'LR', 0, 'L', fill)
            self.cell(col_widths[2], 6, "Rp {:,.2f}".format(float(row.get('jumlah', 0.0))), 'LR', 0, 'R', fill)
            self.cell(col_widths[3], 6, str(row.get('tipe', '')), 'LR', 0, 'L', fill)
            self.cell(col_widths[4], 6, str(row.get('kategori', '')), 'LR', 0, 'L', fill)
            self.ln()
            fill = not fill
        self.cell(sum(col_widths), 0, '', 'T')

    def summary_section(self, total_pemasukan, total_pengeluaran, sisa_uang):
        self.add_page()
        self.chapter_title('Ringkasan Keuangan')
        self.set_font('Arial', '', 12)
        self.cell(50, 10, 'Total Pemasukan:', 0, 0)
        self.set_font('', 'B')
        self.cell(0, 10, "Rp {:,.2f}".format(total_pemasukan), 0, 1)
        self.set_font('')
        self.cell(50, 10, 'Total Pengeluaran:', 0, 0)
        self.set_font('', 'B')
        self.cell(0, 10, "Rp {:,.2f}".format(total_pengeluaran), 0, 1)
        self.set_font('')
        self.line(self.get_x(), self.get_y(), self.get_x() + 100, self.get_y())
        self.ln(5)
        self.cell(50, 10, 'Sisa Uang:', 0, 0)
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, "Rp {:,.2f}".format(sisa_uang), 0, 1)

@app.route('/ekspor_excel')
def ekspor_excel():
    try:
        response = supabase.table('transaksi').select('*').order('tanggal', desc=True).execute()
        transaksi = response.data or []
        if not transaksi:
            df_empty = pd.DataFrame()
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df_empty.to_excel(writer, index=False, sheet_name='Ringkasan')
            output.seek(0)
            return send_file(output, download_name='laporan_keuangan_kosong.xlsx', as_attachment=True)
        df = pd.DataFrame(transaksi)
        df['jumlah'] = pd.to_numeric(df['jumlah'], errors='coerce').fillna(0)
        df_pemasukan = df[df['tipe'] == 'pemasukan'].copy()
        df_pengeluaran = df[df['tipe'] == 'pengeluaran'].copy()
        total_pemasukan = df_pemasukan['jumlah'].sum()
        total_pengeluaran = df_pengeluaran['jumlah'].sum()
        sisa_uang = total_pemasukan - total_pengeluaran
        summary_data = {'Deskripsi': ['Total Pemasukan', 'Total Pengeluaran', 'Sisa Uang'], 'Jumlah': [total_pemasukan, total_pengeluaran, sisa_uang]}
        df_summary = pd.DataFrame(summary_data)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_summary.to_excel(writer, index=False, sheet_name='Ringkasan')
            df_pemasukan.to_excel(writer, index=False, sheet_name='Pemasukan')
            df_pengeluaran.to_excel(writer, index=False, sheet_name='Pengeluaran')
        output.seek(0)
        return send_file(output, download_name='laporan_keuangan.xlsx', as_attachment=True, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        print(f"Error exporting to Excel: {e}")
        return redirect(url_for('index'))

@app.route('/ekspor_csv')
def ekspor_csv():
    try:
        response = supabase.table('transaksi').select('*').order('tanggal', desc=True).execute()
        transaksi = response.data or []
        df = pd.DataFrame(transaksi)
        output = BytesIO()
        output.write(df.to_csv(index=False, encoding='utf-8').encode('utf-8'))
        output.seek(0)
        return Response(output, mimetype="text/csv", headers={"Content-Disposition": "attachment;filename=laporan_transaksi.csv"})
    except Exception as e:
        print(f"Error exporting to CSV: {e}")
        return redirect(url_for('index'))

@app.route('/ekspor_pdf')
def ekspor_pdf():
    try:
        response = supabase.table('transaksi').select('*').order('tanggal', desc=True).execute()
        transaksi = response.data or []
        pemasukan_data = [t for t in transaksi if t['tipe'] == 'pemasukan']
        pengeluaran_data = [t for t in transaksi if t['tipe'] == 'pengeluaran']
        total_pemasukan = sum(float(t.get('jumlah', 0)) for t in pemasukan_data)
        total_pengeluaran = sum(float(t.get('jumlah', 0)) for t in pengeluaran_data)
        sisa_uang = total_pemasukan - total_pengeluaran
        pdf = PDF('L', 'mm', 'A4')
        header = ['Tanggal', 'Deskripsi', 'Jumlah', 'Tipe', 'Kategori']
        pdf.add_page()
        pdf.chapter_title('Laporan Pemasukan')
        pdf.fancy_table(header, pemasukan_data)
        pdf.add_page()
        pdf.chapter_title('Laporan Pengeluaran')
        pdf.fancy_table(header, pengeluaran_data)
        pdf.summary_section(total_pemasukan, total_pengeluaran, sisa_uang)
        return Response(pdf.output(dest='S').encode('latin-1'), mimetype='application/pdf', headers={'Content-Disposition': 'attachment;filename=laporan_keuangan.pdf'})
    except Exception as e:
        print(f"Error exporting to PDF: {e}")
        return redirect(url_for('index'))

# 7. Menjalankan Aplikasi
if __name__ == '__main__':
    app.run(debug=True)