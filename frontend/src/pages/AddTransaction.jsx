import { useEffect, useState } from "react";
import { createTransaction, getTransactionOptions } from "../services/api";
import PageShell from "../components/PageShell";

export default function AddTransaction({ onBack, onSuccess }) {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({
    tipe: "pengeluaran",
    jumlah: "",
    kategori: "",
    rekening_id: "",
    rekening_sumber_id: "",
    rekening_tujuan_id: "",
    tabungan_id: "",
    pihak_terkait: "",
    deskripsi: "",
    tanggal_transaksi: new Date().toISOString().slice(0, 16), // Default ke waktu sekarang
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      const result = await getTransactionOptions();
      setOptions(result);

      setForm((prev) => ({
        ...prev,
        kategori: result.kategori_pengeluaran[0] || "",
        rekening_id: result.rekening[0]?.id || "",
        rekening_sumber_id: result.rekening[0]?.id || "",
        rekening_tujuan_id: result.rekening[1]?.id || result.rekening[0]?.id || "",
      }));
    }
    loadOptions();
  }, []);

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleTipeChange = (tipe) => {
    const kategoriList = tipe === "pemasukan" ? options.kategori_pemasukan : options.kategori_pengeluaran;
    setForm((prev) => ({
      ...prev,
      tipe,
      kategori: tipe === "transfer" ? "Transfer" : kategoriList[0] || "",
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      await createTransaction(form);
      setMessage("Transaksi berhasil dicatat.");
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!options) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0071E3] border-t-transparent" />
          <p className="text-sm font-medium text-[#86868B]">Menyiapkan form...</p>
        </div>
      </div>
    );
  }

  const kategoriList = form.tipe === "pemasukan" ? options.kategori_pemasukan : options.kategori_pengeluaran;

  return (
    <PageShell
      label="Transaksi"
      title="Catat Aktivitas"
      description="Kelola arus kas Anda dengan detail."
      onBack={onBack}
    >
      <div className="mx-auto w-full max-w-2xl px-0 pb-24 sm:px-4">
        {/* Card Utama - Tanpa border di mobile agar lebih clean (Edge-to-edge) */}
        <div className="bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.02)] sm:rounded-[32px] sm:p-10 sm:shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          
          {message && (
            <div className="mb-6 rounded-2xl bg-[#F5F5F7] p-4 text-center text-xs font-semibold text-[#1D1D1F] animate-in fade-in zoom-in">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            
            {/* Tipe Switcher - Full width di mobile */}
            <div className="space-y-2.5">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Tipe Transaksi</label>
              <div className="flex gap-1 rounded-2xl bg-[#F5F5F7] p-1.5">
                {["pemasukan", "pengeluaran", "transfer"].map((tipe) => (
                  <button
                    key={tipe}
                    type="button"
                    onClick={() => handleTipeChange(tipe)}
                    className={`flex-1 rounded-xl py-2.5 text-[11px] font-bold capitalize transition-all active:scale-95 ${
                      form.tipe === tipe
                        ? "bg-white text-[#1D1D1F] shadow-sm"
                        : "text-[#86868B]"
                    }`}
                  >
                    {tipe}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Jumlah - Center Focus dengan Font Responsif */}
            <div className="py-2 text-center">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Nominal</label>
              <div className="relative inline-flex items-center justify-center border-b-2 border-[#F5F5F7] transition-colors focus-within:border-[#0071E3]">
                <span className="text-xl font-semibold text-[#1D1D1F] mr-1.5">Rp</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.jumlah}
                  onChange={(e) => updateField("jumlah", e.target.value)}
                  className="bg-transparent py-2 text-center text-3xl font-bold tracking-tighter text-[#1D1D1F] outline-none placeholder:text-[#D1D1D6] sm:text-5xl"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            {/* Fields Grid - Stack di mobile, Grid di desktop */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {form.tipe === "transfer" ? (
                <>
                  <SelectField
                    label="Sumber"
                    value={form.rekening_sumber_id}
                    onChange={(v) => updateField("rekening_sumber_id", v)}
                    options={options.rekening}
                  />
                  <SelectField
                    label="Tujuan"
                    value={form.rekening_tujuan_id}
                    onChange={(v) => updateField("rekening_tujuan_id", v)}
                    options={options.rekening}
                  />
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Kategori</label>
                    <div className="relative">
                      <select
                        value={form.kategori}
                        onChange={(e) => updateField("kategori", e.target.value)}
                        className="h-12 w-full appearance-none rounded-2xl bg-[#F5F5F7] px-4 text-sm font-bold text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#0071E3]/10"
                        required
                      >
                        {kategoriList.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                  <SelectField
                    label="Rekening"
                    value={form.rekening_id}
                    onChange={(v) => updateField("rekening_id", v)}
                    options={options.rekening}
                  />
                </>
              )}
            </div>

            {/* Extra Info - Divider halus */}
            <div className="space-y-5 border-t border-[#F5F5F7] pt-7">
              {form.kategori === "Alokasi Tabungan" && (
                <SelectField
                  label="Target Tabungan"
                  value={form.tabungan_id}
                  onChange={(v) => updateField("tabungan_id", v)}
                  options={options.tabungan.map(t => ({ id: t.id, nama_rekening: t.nama }))}
                />
              )}

              {[
                "Pemberian Piutang",
                "Penerimaan Utang",
                "Penerimaan Piutang",
                "Pembayaran Utang",
              ].includes(form.kategori) && (
                <InputField
                  label="Pihak Terkait"
                  value={form.pihak_terkait}
                  onChange={(v) => updateField("pihak_terkait", v)}
                  placeholder="Nama orang/instansi"
                />
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <InputField
                  label="Waktu"
                  type="datetime-local"
                  value={form.tanggal_transaksi}
                  onChange={(v) => updateField("tanggal_transaksi", v)}
                />
                <InputField
                  label="Deskripsi"
                  value={form.deskripsi}
                  onChange={(v) => updateField("deskripsi", v)}
                  placeholder="Misal: Beli kopi"
                />
              </div>
            </div>

            {/* Button - Sticky-ish feeling di mobile */}
            <button
              disabled={loading}
              className="relative h-14 w-full overflow-hidden rounded-2xl bg-[#1D1D1F] text-sm font-bold text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Proses...
                </span>
              ) : "Simpan Transaksi"}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}

/* ── HELPER COMPONENTS ── */

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[#86868B]">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-2xl bg-[#F5F5F7] px-4 text-sm font-bold text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#0071E3]/10"
          required
        >
          <option value="">Pilih</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>{item.nama_rekening}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[#86868B]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl bg-[#F5F5F7] px-4 text-sm font-bold text-[#1D1D1F] outline-none transition-all placeholder:text-[#D1D1D6] focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#0071E3]/5"
        placeholder={placeholder}
      />
    </div>
  );
}