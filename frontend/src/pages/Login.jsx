import { useState } from "react";

export default function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal.");
      }

      localStorage.setItem("token", data.token);
      onLogin();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#AEB4BF] p-4 text-[#252525] sm:p-6">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-7xl overflow-hidden rounded-[2rem] bg-[#F6F2DF] shadow-2xl lg:grid-cols-[43%_57%]">
        <div className="relative flex flex-col px-8 py-8 sm:px-12 lg:px-16">
          <div className="mb-16">
            <div className="inline-flex rounded-full border border-black/20 px-6 py-3 text-sm font-medium">
              Nadifah
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
            <h1 className="text-center text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="mt-2 text-center text-sm text-black/60">
              Masuk ke dashboard keuangan
            </p>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 ml-5 block text-xs font-medium text-black/45">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="h-14 w-full rounded-full border-0 bg-white/90 px-6 text-sm font-medium outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#FFD84D]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 ml-5 block text-xs font-medium text-black/45">
                  Password
                </label>

                <div className="flex h-14 items-center rounded-full bg-white/90 px-6 focus-within:ring-2 focus-within:ring-[#FFD84D]">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-black/35"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-sm text-black/50"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                className="h-14 w-full rounded-full bg-[#FFD84D] text-sm font-semibold text-black shadow-lg shadow-yellow-500/20 transition hover:bg-[#FFD23C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Loading..." : "Login"}
              </button>

              <button
                type="button"
                onClick={onShowRegister}
                className="w-full rounded-full border border-black/20 py-4 text-sm font-semibold text-black/70 transition hover:bg-white/40"
              >
                Belum punya akun? Register
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
              className="absolute right-6 top-6 grid h-14 w-14 place-items-center rounded-full bg-[#F6F2DF] text-2xl text-black/70"
            >
              ×
            </button>

            <div className="absolute left-16 top-8 rounded-2xl bg-[#FFD84D] px-5 py-3 shadow-xl">
              <p className="text-xs font-bold">Catat Keuangan Harian</p>
              <p className="mt-1 text-[11px] text-black/60">
                Lebih rapi dan terkontrol
              </p>
            </div>

            <div className="absolute bottom-32 left-20 rounded-2xl bg-white px-5 py-4 shadow-xl">
              <p className="text-xs font-bold text-black">Target Dana Darurat</p>
              <p className="mt-1 text-[11px] text-black/55">
                Otomatis dari 3x gaji
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