import { useState } from "react";
import { registerUser } from "../services/api";

export default function Register({ onBackToLogin }) {
  const [form, setForm] = useState({
    nama_lengkap: "",
    email: "",
    tanggal_lahir: "",
    no_wa: "",
    jenis_kelamin: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      setSuccess(false);
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await registerUser(form);

      setSuccess(true);
      setMessage("Registrasi berhasil. Akun Anda menunggu persetujuan admin.");

      setForm({
        nama_lengkap: "",
        email: "",
        tanggal_lahir: "",
        no_wa: "",
        jenis_kelamin: "",
        password: "",
        confirm_password: "",
      });
    } catch (error) {
      setSuccess(false);
      setMessage(error.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#AEB4BF] p-4 text-[#252525] sm:p-6">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-7xl overflow-hidden rounded-[2rem] bg-[#F6F2DF] shadow-2xl lg:grid-cols-[46%_54%]">
        <div className="relative flex flex-col px-6 py-6 sm:px-10 lg:px-14">
          <div className="mb-8">
            <div className="inline-flex rounded-full border border-black/20 px-6 py-3 text-sm font-medium">
              Nadifah
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
            <h1 className="text-center text-3xl font-semibold tracking-tight">
              Create an account
            </h1>

            <p className="mt-2 text-center text-sm text-black/60">
              Buat akun baru. Akun akan aktif setelah disetujui admin.
            </p>

            {message && (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  success
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <AuthInput
                label="Nama Lengkap"
                type="text"
                value={form.nama_lengkap}
                onChange={(value) => updateField("nama_lengkap", value)}
                placeholder="Masukkan nama lengkap"
              />

              <AuthInput
                label="Email Aktif"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="nama@email.com"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AuthInput
                  label="Tanggal Lahir"
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={(value) => updateField("tanggal_lahir", value)}
                />

                <div>
                  <label className="mb-2 ml-5 block text-xs font-medium text-black/45">
                    Jenis Kelamin
                  </label>

                  <select
                    value={form.jenis_kelamin}
                    onChange={(e) =>
                      updateField("jenis_kelamin", e.target.value)
                    }
                    className="h-14 w-full rounded-full border-0 bg-white/90 px-6 text-sm font-medium text-black/70 outline-none focus:ring-2 focus:ring-[#FFD84D]"
                    required
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <AuthInput
                label="Nomor WhatsApp"
                type="tel"
                value={form.no_wa}
                onChange={(value) => updateField("no_wa", value)}
                placeholder="Contoh: 081234567890"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PasswordInput
                  label="Password"
                  value={form.password}
                  onChange={(value) => updateField("password", value)}
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  placeholder="Minimal 6 karakter"
                />

                <PasswordInput
                  label="Konfirmasi Password"
                  value={form.confirm_password}
                  onChange={(value) => updateField("confirm_password", value)}
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  placeholder="Ulangi password"
                />
              </div>

              <button
                disabled={loading}
                className="h-14 w-full rounded-full bg-[#FFD84D] text-sm font-semibold text-black shadow-lg shadow-yellow-500/20 transition hover:bg-[#FFD23C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Loading..." : "Daftar"}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full rounded-full border border-black/20 py-4 text-sm font-semibold text-black/70 transition hover:bg-white/40"
              >
                Sudah punya akun? Login
              </button>
            </form>
          </div>
        </div>

        <div className="relative hidden p-6 lg:block">
          <div className="relative h-full overflow-hidden rounded-[2rem] bg-black">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80"
              alt="Team meeting"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

            <button
              type="button"
              onClick={onBackToLogin}
              className="absolute right-6 top-6 grid h-14 w-14 place-items-center rounded-full bg-[#F6F2DF] text-2xl text-black/70"
            >
              ×
            </button>

            <div className="absolute left-16 top-8 rounded-2xl bg-[#FFD84D] px-5 py-3 shadow-xl">
              <p className="text-xs font-bold">Kelola Keuangan</p>
              <p className="mt-1 text-[11px] text-black/60">
                Lebih rapi dan terkontrol
              </p>
            </div>

            <div className="absolute bottom-32 left-20 rounded-2xl bg-white px-5 py-4 shadow-xl">
              <p className="text-xs font-bold text-black">Dana Darurat</p>
              <p className="mt-1 text-[11px] text-black/55">
                Target otomatis dari gaji
              </p>
            </div>

            <div className="absolute bottom-14 left-16 right-16 rounded-3xl bg-white/20 p-5 text-white backdrop-blur-md">
              <div className="grid grid-cols-7 gap-3 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day, index) => (
                    <div key={day}>
                      <p className="text-xs text-white/70">{day}</p>
                      <p className="mt-2 text-lg font-semibold">{22 + index}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthInput({ label, type, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 ml-5 block text-xs font-medium text-black/45">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-full border-0 bg-white/90 px-6 text-sm font-medium outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#FFD84D]"
        required
      />
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-2 ml-5 block text-xs font-medium text-black/45">
        {label}
      </label>

      <div className="flex h-14 items-center rounded-full bg-white/90 px-6 focus-within:ring-2 focus-within:ring-[#FFD84D]">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-black/35"
          required
        />

        <button
          type="button"
          onClick={onToggle}
          className="text-sm text-black/50"
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}