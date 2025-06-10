from flask import Flask, render_template, request, redirect, url_for, send_file, Response
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
KATEGORI_PENGELUARAN = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Alokasi Dana', 'Lainnya']
KATEGORI_PEMASUKAN = ['Gaji', 'Hadiah', 'Freelance', 'Investasi', 'Lainnya']

# 4. Rute Utama (Dashboard)
@app.route('/')
def index():
    today = date.today()
    bulan_filter = request.args.get('bulan', today.month, type=int)
    tahun_filter = request.args.get('tahun', today.year, type=int)

    # --- Blok 1: Pengambilan Data Utama ---
    all_transaksi, gaji = [], 0.0
    try:
        gaji_response = supabase.table('pengaturan').select('nilai').eq('kunci', 'gaji').execute()
        gaji = float(gaji_response.data[0]['nilai']) if gaji_response.data else 0.0
        
        transaksi_response = supabase.table('transaksi').select('*').order('tanggal', desc=True).execute()
        all_transaksi = transaksi_response.data or []
    except Exception as e:
        print(f"Error fetching initial data: {e}")

    # --- Blok 2: Pengolahan Data & Perhitungan KPI ---
    total_pemasukan_all = sum(float(t.get('jumlah', 0)) for t in all_transaksi if t.get('tipe') == 'pemasukan')
    total_pengeluaran_all = sum(float(t.get('jumlah', 0)) for t in all_transaksi if t.get('tipe') == 'pengeluaran')
    total_saldo = total_pemasukan_all - total_pengeluaran_all

    DANA_AMAN_TARGET = 10000000.0
    dana_aman_terpenuhi = min(total_saldo, DANA_AMAN_TARGET)
    saldo_produktif = max(0, total_saldo - dana_aman_terpenuhi)
    
    transaksi_bulan_ini = [t for t in all_transaksi if t.get('bulan') == bulan_filter and t.get('tahun') == tahun_filter]
    pemasukan_bulan_ini = sum(float(t.get('jumlah', 0)) for t in transaksi_bulan_ini if t.get('tipe') == 'pemasukan')
    pengeluaran_bulan_ini = sum(float(t.get('jumlah', 0)) for t in transaksi_bulan_ini if t.get('tipe') == 'pengeluaran')

    # --- Blok 3: Perhitungan untuk Komponen UI Lainnya ---
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

    anggaran, anggaran_status = [], []
    try:
        anggaran_response = supabase.table('anggaran').select('*').eq('bulan', bulan_filter).eq('tahun', tahun_filter).execute()
        anggaran = anggaran_response.data or []
    except Exception as e:
        print(f"Error fetching anggaran: {e}")
    
    for a in anggaran:
        terpakai = sum(float(t.get('jumlah', 0)) for t in transaksi_bulan_ini if t.get('kategori') == a.get('kategori') and t.get('tipe') == 'pengeluaran')
        anggaran_status.append({'kategori': a.get('kategori'), 'batas': float(a.get('batas', 0)), 'terpakai': terpakai, 'sisa': float(a.get('batas', 0)) - terpakai, 'melebihi': terpakai > float(a.get('batas', 0))})
            
    # --- Blok Tabungan ---
    dana_darurat_obj, tabungan_lain = None, []
    try:
        dd_response = supabase.table('tabungan').select('id').eq('nama', 'Dana Darurat').execute()
        if not dd_response.data:
            tenggat_darurat = (date.today() + timedelta(days=365*10)).isoformat()
            supabase.table('tabungan').insert({'nama': 'Dana Darurat', 'target': gaji * 3 if gaji > 0 else 0, 'terkumpul': 0.0, 'tenggat': tenggat_darurat}).execute()
        
        tabungan_response = supabase.table('tabungan').select('*').execute()
        semua_tabungan = tabungan_response.data or []
        
        dana_darurat_obj = next((t for t in semua_tabungan if t.get('nama') == 'Dana Darurat'), None)
        
        if dana_darurat_obj:
            if dana_darurat_obj.get('target') != (gaji * 3) and gaji > 0:
                supabase.table('tabungan').update({'target': gaji * 3}).eq('nama', 'Dana Darurat').execute()
                dana_darurat_obj['target'] = gaji * 3
            
            if dana_darurat_obj.get('target', 0) > 0:
                dana_darurat_obj['terpenuhi'] = dana_darurat_obj.get('terkumpul', 0) >= dana_darurat_obj.get('target', 0)
            else:
                dana_darurat_obj['terpenuhi'] = False

        tabungan_lain = [t for t in semua_tabungan if t.get('nama') != 'Dana Darurat']

    except Exception as e:
        print(f"!!! TERJADI ERROR PADA BLOK TABUNGAN: {e} !!!")
        dana_darurat_obj, tabungan_lain = None, []

    # --- BARU: Logika Perhitungan Saldo per Rekening ---
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

    # --- Blok 4: Kirim Semua Data ke Template ---
    return render_template('index.html',
        transaksi=transaksi_bulan_ini, bulan=bulan_filter, tahun=tahun_filter,
        dana_aman_terpenuhi=dana_aman_terpenuhi, DANA_AMAN_TARGET=DANA_AMAN_TARGET,
        saldo_produktif=saldo_produktif, pemasukan_bulan_ini=pemasukan_bulan_ini,
        pengeluaran_bulan_ini=pengeluaran_bulan_ini,
        dana_darurat=dana_darurat_obj, tabungan=tabungan_lain, gaji=gaji,
        chart_data=json.dumps(chart_data), tren_data=json.dumps(tren_data), 
        anggaran_status=anggaran_status, total_tren_pemasukan=total_tren_pemasukan,
        total_tren_pengeluaran=total_tren_pengeluaran, arus_kas_bersih_tren=arus_kas_bersih_tren,
        rekening_data=rekening_dengan_saldo  # <-- Kirim data rekening ke template
    )

# 5. Rute untuk Halaman Lainnya
@app.route('/atur_gaji', methods=['GET', 'POST'])
def atur_gaji():
    if request.method == 'POST':
        gaji = request.form.get('gaji', '0')
        supabase.table('pengaturan').upsert({'kunci': 'gaji', 'nilai': gaji}).execute()
        return redirect(url_for('index'))
    try:
        response = supabase.table('pengaturan').select('nilai').eq('kunci', 'gaji').execute()
        gaji_saat_ini = response.data[0]['nilai'] if response.data else "0"
    except Exception:
        gaji_saat_ini = "0"
    return render_template('atur_gaji.html', gaji=gaji_saat_ini)


@app.route('/tambah_transaksi', methods=['GET', 'POST'])
def tambah_transaksi():
    try:
        rekening_list = supabase.table('rekening').select('id, nama_rekening').execute().data or []
    except Exception as e:
        print(f"Error fetching rekening list: {e}")
        rekening_list = []

    if request.method == 'POST':
        try:
            tanggal_obj = datetime.strptime(request.form['tanggal'], '%Y-%m-%d').date()
            transaksi_baru = {
                'deskripsi': request.form['deskripsi'],
                'jumlah': float(request.form['jumlah']),
                'tipe': request.form['tipe'],
                'kategori': request.form['kategori'],
                'tanggal': tanggal_obj.isoformat(),
                'bulan': tanggal_obj.month,
                'tahun': tanggal_obj.year,
                'rekening_id': int(request.form['rekening_id'])
            }
            supabase.table('transaksi').insert(transaksi_baru).execute()

            # (Logika alokasi otomatis Anda yang sudah ada bisa tetap di sini)
            # ...

            return redirect(url_for('index'))
            
        except Exception as e:
            return render_template('tambah_transaksi.html', 
                                   error=str(e), 
                                   kategori_pengeluaran=KATEGORI_PENGELUARAN, 
                                   kategori_pemasukan=KATEGORI_PEMASUKAN,
                                   rekening=rekening_list)
            
    return render_template('tambah_transaksi.html', 
                           kategori_pengeluaran=KATEGORI_PENGELUARAN, 
                           kategori_pemasukan=KATEGORI_PEMASUKAN,
                           rekening=rekening_list)

@app.route('/hapus_transaksi/<int:id>')
def hapus_transaksi(id):
    try:
        supabase.table('transaksi').delete().eq('id', id).execute()
    except Exception as e:
        print(f"Error deleting transaksi: {e}")
    return redirect(url_for('index'))

# --- BARU: Rute untuk mengelola rekening ---
@app.route('/tambah_rekening', methods=['GET', 'POST'])
def tambah_rekening():
    if request.method == 'POST':
        try:
            rekening_baru = {
                'nama_rekening': request.form['nama_rekening'],
                'jenis_rekening': request.form['jenis_rekening'],
                'saldo_awal': float(request.form['saldo_awal'])
            }
            supabase.table('rekening').insert(rekening_baru).execute()
            return redirect(url_for('index'))
        except Exception as e:
            return render_template('tambah_rekening.html', error=str(e))
    return render_template('tambah_rekening.html')

@app.route('/hapus_rekening/<int:id>')
def hapus_rekening(id):
    try:
        supabase.table('transaksi').update({'rekening_id': None}).eq('rekening_id', id).execute()
        supabase.table('rekening').delete().eq('id', id).execute()
    except Exception as e:
        print(f"Error deleting rekening: {e}")
    return redirect(url_for('index'))

@app.route('/tambah_anggaran', methods=['GET', 'POST'])
def tambah_anggaran():
    if request.method == 'POST':
        try:
            anggaran_baru = {
                'kategori': request.form['kategori'],
                'batas': float(request.form['batas']),
                'bulan': int(request.form['bulan']),
                'tahun': int(request.form['tahun'])
            }
            supabase.table('anggaran').insert(anggaran_baru).execute()
            return redirect(url_for('index'))
        except Exception as e:
            return render_template('tambah_anggaran.html', error=str(e), kategori=KATEGORI_PENGELUARAN, current_year=datetime.now().year)
    return render_template('tambah_anggaran.html', kategori=KATEGORI_PENGELUARAN, current_year=datetime.now().year)

@app.route('/tambah_tabungan', methods=['GET', 'POST'])
def tambah_tabungan():
    if request.method == 'POST':
        try:
            tabungan_baru = {
                'nama': request.form['nama'],
                'target': float(request.form['target']),
                'terkumpul': 0.0,
                'tenggat': datetime.strptime(request.form['tenggat'], '%Y-%m-%d').date().isoformat()
            }
            supabase.table('tabungan').insert(tabungan_baru).execute()
            return redirect(url_for('index'))
        except Exception as e:
            return render_template('tambah_tabungan.html', error=str(e)) 
    return render_template('tambah_tabungan.html')


@app.route('/tambah_dana_tabungan/<int:id>', methods=['POST'])
def tambah_dana_tabungan(id):
    try:
        jumlah = float(request.form['jumlah'])
        response = supabase.table('tabungan').select('terkumpul').eq('id', id).execute()
        if response.data:
            terkumpul_sekarang = float(response.data[0]['terkumpul'])
            terkumpul_baru = terkumpul_sekarang + jumlah
            supabase.table('tabungan').update({'terkumpul': terkumpul_baru}).eq('id', id).execute()
    except Exception as e:
        print(f"Error updating tabungan: {e}")
    return redirect(url_for('index'))

# 6. Rute untuk Ekspor (Excel dan PDF - tidak berubah)
# ... (kode PDF Class, ekspor_excel, dan ekspor_pdf Anda yang sudah ada tetap di sini) ...
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
