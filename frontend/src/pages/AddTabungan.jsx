import { useState } from "react";
import { createTabungan } from "../services/api";
import PageShell from "../components/PageShell";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getDefaultDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split("T")[0];
}

function formatRupiah(value) {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

function hitungSisaHari(tenggat) {
  if (!tenggat) return null;
  const selisih = new Date(tenggat) - new Date();
  return Math.ceil(selisih / (1000 * 60 * 60 * 24));
}

function hitungTabunganPerBulan(target, tenggat) {
  const sisaHari = hitungSisaHari(tenggat);
  if (!target || !sisaHari || sisaHari <= 0) return null;
  const sisaBulan = Math.max(1, Math.ceil(sisaHari / 30));
  return Math.ceil(Number(target) / sisaBulan);
}

const PRESET_NAMA = [
  "Dana Liburan",
  "DP Rumah",
  "Laptop Baru",
  "Dana Darurat",
  "Kendaraan",
  "Pendidikan",
];

const PRESET_TARGET = [
  { label: "5 jt", value: 5_000_000 },
  { label: "10 jt", value: 10_000_000 },
  { label: "25 jt", value: 25_000_000 },
  { label: "50 jt", value: 50_000_000 },
];

export default function AddTabungan({ onBack, onSuccess }) {
  const [form, setForm] = useState({
    nama: "",
    target: "",
    tenggat: getDefaultDate(),
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      await createTabungan(form);
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const sisaHari = hitungSisaHari(form.tenggat);
  const perBulan = hitungTabunganPerBulan(form.target, form.tenggat);
  const sisaBulan = sisaHari ? Math.max(1, Math.ceil(sisaHari / 30)) : null;

  const tenggatDisplay = form.tenggat
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(form.tenggat))
    : "-";

  return (
    <PageShell
      label="Tabungan"
      title="Buat Target Tabungan"
      description="Tentukan tujuan finansial dan pantau progresnya."
      onBack={onBack}
    >
      <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-2 sm:px-0">

        {/* Hero card */}
        <div className="mb-4 overflow-hidden rounded-2xl bg-[#6366F1] p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <IconTarget />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-200">Target baru</p>
              <p className="text-sm font-extrabold text-white">
                {form.nama || "Nama target tabungan"}
              </p>
            </div>
          </div>

          {/* Nominal target */}
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
            Target dana
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-indigo-200">Rp</span>
            <input
              type="number"
              value={form.target}
              onChange={(e) => updateField("target", e.target.value)}
              className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-white outline-none placeholder:text-indigo-300 sm:text-5xl"
              placeholder="0"
              inputMode="numeric"
              required
            />
          </div>
          {form.target && (
            <p className="mt-1 text-sm font-medium text-indigo-200">
              Rp {formatRupiah(form.target)}
            </p>
          )}

          {/* Preset nominal */}
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESET_TARGET.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => updateField("target", p.value)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                  Number(form.target) === p.value
                    ? "bg-white text-[#6366F1]"
                    : "bg-indigo-500/40 text-indigo-100 hover:bg-indigo-500/60"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Insight otomatis */}
          {perBulan && (
            <div className="mt-5 rounded-xl bg-white/10 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                Estimasi tabungan rutin
              </p>
              <p className="mt-1 text-lg font-extrabold text-white">
                Rp {formatRupiah(perBulan)}{" "}
                <span className="text-sm font-semibold text-indigo-200">/ bulan</span>
              </p>
              <p className="mt-0.5 text-xs text-indigo-200">
                Selama {sisaBulan} bulan · Selesai {tenggatDisplay}
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nama target */}
          <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
            <label className="mb-2 block text-xs font-semibold text-[#374151]">
              Nama target
            </label>
            <input
              value={form.nama}
              onChange={(e) => updateField("nama", e.target.value)}
              className="h-11 w-full rounded-xl bg-[#F7F8FC] px-4 text-sm font-semibold text-[#111827] outline-none transition-colors focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#6366F1]/20"
              placeholder="Contoh: DP Rumah, Laptop Baru..."
              required
            />

            {/* Preset nama */}
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESET_NAMA.map((nama) => (
                <button
                  key={nama}
                  type="button"
                  onClick={() => updateField("nama", nama)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all active:scale-95 ${
                    form.nama === nama
                      ? "border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]"
                      : "border-[#E5E7EB] text-[#6B7280] hover:border-[#6366F1]/40 hover:text-[#6366F1]"
                  }`}
                >
                  {nama}
                </button>
              ))}
            </div>
          </div>

          {/* Tenggat waktu */}
          <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
            <label className="mb-2 block text-xs font-semibold text-[#374151]">
              Tenggat waktu
            </label>
            <input
              type="date"
              value={form.tenggat}
              min={getToday()}
              onChange={(e) => updateField("tenggat", e.target.value)}
              className="h-11 w-full rounded-xl bg-[#F7F8FC] px-4 text-sm font-semibold text-[#111827] outline-none transition-colors focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#6366F1]/20"
              required
            />

            {/* Info sisa hari */}
            {sisaHari !== null && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7F8FC] px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#6366F1]">
                  <IconClock />
                </div>
                <div>
                  {sisaHari > 0 ? (
                    <>
                      <p className="text-xs font-bold text-[#111827]">
                        {sisaHari} hari lagi
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        ≈ {sisaBulan} bulan · {tenggatDisplay}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-[#E11D48]">
                      Tanggal sudah lewat
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFF1F2] px-4 py-3 text-xs font-semibold text-[#E11D48]">
              <IconAlert />
              {message}
            </div>
          )}

          {/* Submit */}
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
                Simpan Target Tabungan
              </>
            )}
          </button>

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}