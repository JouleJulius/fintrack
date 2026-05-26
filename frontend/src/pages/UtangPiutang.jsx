import { useEffect, useState } from "react";
import {
  createUtangPiutang,
  deleteUtangPiutang,
  getUtangPiutang,
  payUtangPiutang,
} from "../services/api";
import PageShell from "../components/PageShell";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function UtangPiutang({ onBack }) {
  const [items, setItems] = useState([]);
  const [rekening, setRekening] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    tipe: "Utang",
    deskripsi: "",
    pihak_terkait: "",
    jumlah_total: "",
    tanggal_mulai: today(),
  });

  const [payForm, setPayForm] = useState({
    item: null,
    jumlah: "",
    rekening_id: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const result = await getUtangPiutang();
      setItems(result.items || []);
      setRekening(result.rekening || []);
      setPayForm((prev) => ({
        ...prev,
        rekening_id: result.rekening?.[0]?.id || "",
      }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setMessage("");
      await createUtangPiutang(form);
      setForm({
        tipe: "Utang",
        deskripsi: "",
        pihak_terkait: "",
        jumlah_total: "",
        tanggal_mulai: today(),
      });
      setMessage("Catatan berhasil dibuat.");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    if (!payForm.item) return;
    try {
      setMessage("");
      await payUtangPiutang(payForm.item.id, {
        jumlah: payForm.jumlah,
        rekening_id: payForm.rekening_id,
      });
      setPayForm({
        item: null,
        jumlah: "",
        rekening_id: rekening?.[0]?.id || "",
      });
      setMessage("Pembayaran berhasil dicatat.");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Yakin ingin menghapus catatan ini?");
    if (!confirmDelete) return;
    try {
      setMessage("");
      await deleteUtangPiutang(id);
      setMessage("Catatan berhasil dihapus.");
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageShell
      label="Utang Piutang"
      title="Manajemen Utang"
      description="Kelola pinjaman dan piutang Anda."
      onBack={onBack}
    >
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-0">
        
        {/* Pesan Toast Minimalis */}
        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-[#1D1D1F] shadow-sm border border-[#F3F4F6]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10B981] text-white text-[10px]">✓</div>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
          
          {/* SISI KIRI: FORM TAMBAH */}
          <aside className="space-y-6">
            <div className="rounded-[28px] border border-[#F3F4F6] bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-bold text-[#1D1D1F]">Tambah Baru</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tipe Selector (Utang / Piutang) */}
                <div className="flex gap-2 rounded-xl bg-[#F7F8FC] p-1">
                  {["Utang", "Piutang"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateField("tipe", t)}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        form.tipe === t ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#9CA3AF]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Deskripsi" 
                    value={form.deskripsi} 
                    onChange={(v) => updateField("deskripsi", v)} 
                    placeholder="Misal: Pinjam uang makan"
                  />
                  <Input 
                    label="Pihak Terkait" 
                    value={form.pihak_terkait} 
                    onChange={(v) => updateField("pihak_terkait", v)} 
                    placeholder="Nama orang / instansi"
                  />
                  <Input 
                    label="Jumlah Total" 
                    type="number" 
                    value={form.jumlah_total} 
                    onChange={(v) => updateField("jumlah_total", v)} 
                    placeholder="0"
                  />
                  <Input 
                    label="Tanggal Mulai" 
                    type="date" 
                    value={form.tanggal_mulai} 
                    onChange={(v) => updateField("tanggal_mulai", v)} 
                  />
                </div>

                <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1D1D1F] text-sm font-bold text-white transition-all hover:bg-black active:scale-95 shadow-lg shadow-gray-200">
                  <IconPlus />
                  Simpan Catatan
                </button>
              </form>
            </div>
          </aside>

          {/* SISI KANAN: DAFTAR ITEM */}
          <section className="space-y-4">
            <h2 className="px-2 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">Daftar Berjalan</h2>
            
            {loading ? (
              <div className="flex flex-col items-center py-20 opacity-50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1D1D1F] border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[#E5E7EB] py-16 text-center">
                <p className="text-sm font-medium text-[#9CA3AF]">Belum ada catatan transaksi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {items.map((item) => {
                  const sisa = Number(item.jumlah_total || 0) - Number(item.jumlah_terbayar || 0);
                  const progress = Number(item.jumlah_total || 0) > 0 
                    ? Math.min(100, (Number(item.jumlah_terbayar || 0) / Number(item.jumlah_total || 0)) * 100) 
                    : 0;
                  const isUtang = item.tipe === "Utang";

                  return (
                    <div key={item.id} className="group relative overflow-hidden rounded-[24px] border border-[#F3F4F6] bg-white p-5 transition-all hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isUtang ? "bg-rose-50 text-rose-500" : "bg-sky-50 text-sky-500"}`}>
                            {isUtang ? <IconArrowUp /> : <IconArrowDown />}
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-tight text-[#9CA3AF]">{item.pihak_terkait}</p>
                            <h3 className="text-base font-extrabold text-[#1D1D1F]">{item.deskripsi}</h3>
                            <p className="text-[11px] font-medium text-[#D1D1D6]">{item.tanggal_mulai}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Sisa Tagihan</p>
                          <p className="text-lg font-black text-[#1D1D1F]">{formatRupiah(sisa)}</p>
                        </div>
                      </div>

                      {/* Progress Bar Minimalis */}
                      <div className="mt-6">
                        <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                          <span className="text-[#86868B]">Terbayar {formatRupiah(item.jumlah_terbayar)}</span>
                          <span className={isUtang ? "text-rose-500" : "text-sky-500"}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F5F5F7]">
                          <div 
                            className={`h-full transition-all duration-1000 ${isUtang ? "bg-rose-500" : "bg-sky-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-5 flex items-center justify-between border-t border-[#F5F5F7] pt-4">
                        <div className="flex gap-2">
                          {!item.lunas && (
                            <button
                              onClick={() => setPayForm({ item, jumlah: "", rekening_id: rekening?.[0]?.id || "" })}
                              className="rounded-xl bg-[#1D1D1F] px-4 py-2 text-[11px] font-bold text-white transition-all active:scale-95"
                            >
                              Bayar Cicilan
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-xl border border-[#F3F4F6] px-4 py-2 text-[11px] font-bold text-[#FF3B30] hover:bg-rose-50 transition-all"
                          >
                            Hapus
                          </button>
                        </div>
                        {item.lunas && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#10B981]">
                            <IconCheckSmall /> Lunas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* MODAL PEMBAYARAN (Apple Style Overlay) */}
      {payForm.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D1D1F]/40 px-4 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-[#1D1D1F]">Catat Pembayaran</h2>
            <p className="mt-1 text-sm font-medium text-[#86868B]">{payForm.item.deskripsi}</p>

            <form onSubmit={handlePay} className="mt-8 space-y-5">
              <Input
                label="Jumlah Pembayaran"
                type="number"
                value={payForm.jumlah}
                onChange={(v) => setPayForm((p) => ({ ...p, jumlah: v }))}
                placeholder="0"
              />

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-[#86868B]">Gunakan Rekening</label>
                <select
                  value={payForm.rekening_id}
                  onChange={(e) => setPayForm((p) => ({ ...p, rekening_id: e.target.value }))}
                  className="h-12 w-full rounded-2xl bg-[#F7F8FC] px-4 text-sm font-bold text-[#1D1D1F] outline-none transition-all focus:ring-2 focus:ring-[#1D1D1F]/5"
                  required
                >
                  {rekening.map((rek) => (
                    <option key={rek.id} value={rek.id}>{rek.nama_rekening}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayForm({ item: null, jumlah: "", rekening_id: rekening?.[0]?.id || "" })}
                  className="flex-1 rounded-2xl border border-[#F3F4F6] py-3 text-sm font-bold text-[#86868B] transition-all active:scale-95"
                >
                  Batal
                </button>
                <button className="flex-1 rounded-2xl bg-[#1D1D1F] py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-gray-200">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ── REUSABLE UI COMPONENTS ── */

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl bg-[#F7F8FC] px-4 text-sm font-bold text-[#1D1D1F] outline-none transition-all placeholder:text-[#D1D1D6] focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#6366F1]/10"
        placeholder={placeholder}
        required
      />
    </div>
  );
}

/* ── ICONS ── */

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 7L7 17" /><polyline points="17 17 7 17 7 7" />
    </svg>
  );
}

function IconCheckSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}