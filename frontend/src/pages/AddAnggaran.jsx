import { useEffect, useState } from "react";
import { createAnggaran, getAnggaran } from "../services/api";
import PageShell from "../components/PageShell";

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const BULAN_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatRupiah(value) {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function AddAnggaran({ onBack, onSuccess }) {
  const now = new Date();
  const [kategori, setKategori] = useState([]);
  const [form, setForm] = useState({
    kategori: "",
    batas: "",
    bulan: now.getMonth() + 1,
    tahun: now.getFullYear(),
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingKategori, setLoadingKategori] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadKategori() {
      try {
        setLoadingKategori(true);
        const result = await getAnggaran({ bulan: form.bulan, tahun: form.tahun });
        if (!cancelled) {
          setKategori(result.kategori || []);
          setForm((prev) => ({ ...prev, kategori: result.kategori?.[0] || "" }));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingKategori(false);
      }
    }
    loadKategori();
    return () => { cancelled = true; };
  }, []);

  const updateField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      await createAnggaran(form);
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const nominalDisplay = form.batas ? formatRupiah(form.batas) : "";

  return (
    <PageShell
      label="Anggaran"
      title="Atur Budget"
      description="Kelola pengeluaran dengan presisi."
      onBack={onBack}
    >
      <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-2 sm:px-0">

        {/* Nominal Input Card — hero element */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-[#6366F1] p-6 sm:p-8">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
            Nominal batas anggaran
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-indigo-200">Rp</span>
            <input
              type="number"
              value={form.batas}
              onChange={(e) => updateField("batas", e.target.value)}
              className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-white outline-none placeholder:text-indigo-300 sm:text-5xl"
              placeholder="0"
              required
              inputMode="numeric"
            />
          </div>
          {nominalDisplay && (
            <p className="mt-2 text-sm font-medium text-indigo-200">
              Rp {nominalDisplay}
            </p>
          )}

          {/* Bulan Pill Selector */}
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-200">
              Pilih bulan
            </p>
            <div className="flex flex-wrap gap-2">
              {BULAN_SHORT.map((nama, i) => {
                const val = i + 1;
                const active = form.bulan === val;
                return (
                  <button
                    key={nama}
                    type="button"
                    onClick={() => updateField("bulan", val)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                      active
                        ? "bg-white text-[#6366F1]"
                        : "bg-indigo-500/40 text-indigo-100 hover:bg-indigo-500/60"
                    }`}
                  >
                    {nama}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Form Card */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">

            {/* Kategori */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Kategori pengeluaran
              </label>
              {loadingKategori ? (
                <div className="h-11 w-full animate-pulse rounded-xl bg-[#F3F4F6]" />
              ) : (
                <div className="relative">
                  <select
                    value={form.kategori}
                    onChange={(e) => updateField("kategori", e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl bg-[#F7F8FC] px-4 text-sm font-semibold text-[#111827] outline-none transition-colors focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#6366F1]/20"
                    required
                  >
                    {kategori.length === 0 && (
                      <option value="">Tidak ada kategori</option>
                    )}
                    {kategori.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Tahun */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Tahun
              </label>
              <input
                type="number"
                value={form.tahun}
                onChange={(e) => updateField("tahun", e.target.value)}
                className="h-11 w-full rounded-xl bg-[#F7F8FC] px-4 text-sm font-semibold text-[#111827] outline-none transition-colors focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#6366F1]/20"
              />
            </div>

            {/* Summary preview */}
            {form.batas && form.kategori && (
              <div className="mt-4 rounded-xl bg-[#F7F8FC] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  Ringkasan anggaran
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#6366F1]">
                      <IconTarget />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{form.kategori}</p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {BULAN_NAMA[(form.bulan || 1) - 1]} {form.tahun}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-extrabold text-[#6366F1]">
                    Rp {formatRupiah(form.batas)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFF1F2] px-4 py-3 text-xs font-semibold text-[#E11D48]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6366F1] text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-[#4F46E5] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <IconSave />
                Simpan Anggaran
              </>
            )}
          </button>

          {/* Back link mobile-friendly */}
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#F7F8FC] active:scale-[0.98]"
          >
            Batal
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}