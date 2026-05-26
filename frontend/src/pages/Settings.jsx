import { useEffect, useState } from "react";
import { getPengaturan, updateGaji } from "../services/api";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function Settings({ onBack }) {
  const [form, setForm] = useState({ gaji: "" });
  const [targetDanaDarurat, setTargetDanaDarurat] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSettings() {
      try {
        const result = await getPengaturan();

        if (ignore) return;

        setForm({
          gaji: result.gaji || "",
        });

        setTargetDanaDarurat(result.target_dana_darurat || 0);
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || "Gagal memuat pengaturan.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setMessage("");

      const result = await updateGaji({
        gaji: Number(form.gaji),
      });

      setTargetDanaDarurat(result.target_dana_darurat || 0);
      setMessage("Gaji dan target Dana Darurat berhasil diperbarui.");
    } catch (error) {
      setMessage(error.message || "Gagal menyimpan pengaturan.");
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F5F7]">
        <p className="text-sm font-semibold text-[#86868B]">
          Memuat pengaturan...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-6 text-[#1D1D1F] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#86868B]">
              Pengaturan
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Atur Gaji Bulanan
            </h1>
            <p className="mt-1 text-sm text-[#86868B]">
              Gaji digunakan untuk menghitung target Dana Darurat otomatis.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#1D1D1F] shadow-sm hover:bg-slate-50"
          >
            Kembali
          </button>
        </header>

        {message && (
          <div className="mb-6 rounded-2xl bg-white p-4 text-sm font-semibold text-[#1D1D1F] shadow-sm">
            {message}
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-[1fr_280px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          >
            <label className="mb-2 block text-sm font-bold">
              Gaji Bulanan
            </label>

            <div className="flex items-center rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] px-4 py-3">
              <span className="mr-3 text-sm font-bold text-[#86868B]">
                Rp
              </span>

              <input
                type="number"
                min="0"
                value={form.gaji}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    gaji: e.target.value,
                  }))
                }
                className="w-full bg-transparent text-2xl font-black outline-none"
                placeholder="0"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-[#0071E3] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#0071E3]/20 hover:bg-[#0077ED]"
            >
              Simpan Pengaturan
            </button>
          </form>

          <div className="rounded-3xl bg-[#0071E3] p-6 text-white shadow-lg shadow-[#0071E3]/20">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              Target Dana Darurat
            </p>

            <p className="mt-3 text-3xl font-black">
              {formatRupiah(targetDanaDarurat)}
            </p>

            <p className="mt-4 text-sm font-medium text-white/80">
              Sistem menghitung target Dana Darurat sebesar 3x gaji bulanan.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}