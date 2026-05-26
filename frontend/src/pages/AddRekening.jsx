import { useState } from "react";
import { createRekening } from "../services/api";
import PageShell from "../components/PageShell";

const JENIS_OPTIONS = [
  {
    value: "Bank",
    label: "Bank",
    desc: "BCA, Mandiri, BRI, dll",
    icon: <IconBank />,
    color: "bg-[#EEF2FF] text-[#6366F1]",
    active: "ring-2 ring-[#6366F1] bg-[#EEF2FF]",
  },
  {
    value: "E-Wallet",
    label: "E-Wallet",
    desc: "GoPay, OVO, Dana, dll",
    icon: <IconWallet />,
    color: "bg-[#ECFDF5] text-[#10B981]",
    active: "ring-2 ring-[#10B981] bg-[#ECFDF5]",
  },
  {
    value: "Tunai",
    label: "Tunai",
    desc: "Uang fisik / cash",
    icon: <IconCash />,
    color: "bg-[#FFFBEB] text-[#F59E0B]",
    active: "ring-2 ring-[#F59E0B] bg-[#FFFBEB]",
  },
  {
    value: "Lainnya",
    label: "Lainnya",
    desc: "Investasi, dll",
    icon: <IconMore />,
    color: "bg-[#F7F8FC] text-[#6B7280]",
    active: "ring-2 ring-[#9CA3AF] bg-[#F7F8FC]",
  },
];

function formatRupiah(value) {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function AddRekening({ onBack, onSuccess }) {
  const [form, setForm] = useState({
    nama_rekening: "",
    jenis_rekening: "Bank",
    saldo_awal: "",
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
      await createRekening(form);
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const selected = JENIS_OPTIONS.find((o) => o.value === form.jenis_rekening);

  return (
    <PageShell
      label="Rekening"
      title="Tambah Rekening"
      description="Tambahkan rekening bank, e-wallet, atau tunai."
      onBack={onBack}
    >
      <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-2 sm:px-0">

        {/* Hero saldo card */}
        <div
          className="mb-4 overflow-hidden rounded-2xl p-6 sm:p-8 transition-colors duration-300"
          style={{ background: getAccentBg(form.jenis_rekening) }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.25)", color: getAccentText(form.jenis_rekening) }}
            >
              {selected?.icon}
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: getAccentText(form.jenis_rekening, 0.7) }}>
                {form.jenis_rekening || "Rekening baru"}
              </p>
              <p className="text-sm font-extrabold" style={{ color: getAccentText(form.jenis_rekening) }}>
                {form.nama_rekening || "Nama rekening"}
              </p>
            </div>
          </div>

          <p
            className="mb-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: getAccentText(form.jenis_rekening, 0.65) }}
          >
            Saldo awal
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold" style={{ color: getAccentText(form.jenis_rekening, 0.7) }}>
              Rp
            </span>
            <input
              type="number"
              value={form.saldo_awal}
              onChange={(e) => updateField("saldo_awal", e.target.value)}
              className="w-full bg-transparent text-4xl font-extrabold tracking-tight outline-none placeholder:opacity-40 sm:text-5xl"
              style={{ color: getAccentText(form.jenis_rekening) }}
              placeholder="0"
              inputMode="numeric"
              required
            />
          </div>
          {form.saldo_awal ? (
            <p className="mt-1 text-sm font-medium" style={{ color: getAccentText(form.jenis_rekening, 0.7) }}>
              Rp {formatRupiah(form.saldo_awal)}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Jenis rekening — card selector */}
          <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
            <label className="mb-3 block text-xs font-semibold text-[#374151]">
              Jenis rekening
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {JENIS_OPTIONS.map((opt) => {
                const isActive = form.jenis_rekening === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField("jenis_rekening", opt.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border border-transparent p-3 text-center transition-all active:scale-95 ${
                      isActive ? opt.active : "bg-[#F7F8FC] hover:bg-[#F3F4F6]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isActive ? opt.color : "bg-white text-[#9CA3AF]"
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isActive ? "text-[#111827]" : "text-[#6B7280]"}`}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#9CA3AF] leading-tight hidden sm:block">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nama rekening */}
          <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
            <label className="mb-2 block text-xs font-semibold text-[#374151]">
              Nama rekening
            </label>
            <input
              value={form.nama_rekening}
              onChange={(e) => updateField("nama_rekening", e.target.value)}
              className="h-11 w-full rounded-xl bg-[#F7F8FC] px-4 text-sm font-semibold text-[#111827] outline-none transition-colors focus:bg-[#EEF2FF] focus:ring-2 focus:ring-[#6366F1]/20"
              placeholder={
                form.jenis_rekening === "Bank"
                  ? "Contoh: BCA Tabungan"
                  : form.jenis_rekening === "E-Wallet"
                  ? "Contoh: GoPay Utama"
                  : form.jenis_rekening === "Tunai"
                  ? "Contoh: Dompet Harian"
                  : "Nama rekening"
              }
              required
            />

            {/* Preview card mini */}
            {form.nama_rekening && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#F7F8FC] p-3">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${selected?.color}`}>
                  {selected?.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#111827]">{form.nama_rekening}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{form.jenis_rekening}</p>
                </div>
                <p className="text-xs font-extrabold text-[#6366F1]">
                  {form.saldo_awal ? `Rp ${formatRupiah(form.saldo_awal)}` : "Rp 0"}
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {message && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFF1F2] px-4 py-3 text-xs font-semibold text-[#E11D48]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
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
                Simpan Rekening
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

/* ── Helpers warna dinamis per jenis ── */
function getAccentBg(jenis) {
  const map = {
    Bank: "#6366F1",
    "E-Wallet": "#10B981",
    Tunai: "#F59E0B",
    Lainnya: "#6B7280",
  };
  return map[jenis] || "#6366F1";
}

function getAccentText(jenis, opacity = 1) {
  const base = "255,255,255";
  return `rgba(${base},${opacity})`;
}

/* ── Icons ── */
function IconBank() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4z" />
      <path d="M20 12a2 2 0 0 0-2-2h-2a2 2 0 0 0 0 4h2a2 2 0 0 0 2-2z" />
    </svg>
  );
}

function IconCash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
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