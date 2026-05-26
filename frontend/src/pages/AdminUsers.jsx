import { useCallback, useEffect, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  approveAdminUser,
} from "../services/api";
import PageShell from "../components/PageShell";

function formatTanggal(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTanggalLahir(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID");
}

export default function AdminUsers({ onBack }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "user",
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const result = await getAdminUsers();
      setUsers(result.items || []);
    } catch (error) {
      setMessage(error.message || "Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchUsers() {
      try {
        const result = await getAdminUsers();

        if (ignore) return;

        setUsers(result.items || []);
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || "Gagal memuat data user.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, []);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setMessage("");

      await createAdminUser(form);

      setForm({
        email: "",
        password: "",
        role: "user",
      });

      setMessage("User berhasil dibuat.");
      await loadUsers();
    } catch (error) {
      setMessage(error.message || "Gagal membuat user.");
    }
  }

  async function handleApprove(id) {
    try {
      setMessage("");

      await approveAdminUser(id);

      setMessage("User berhasil disetujui.");
      await loadUsers();
    } catch (error) {
      setMessage(error.message || "Gagal menyetujui user.");
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Yakin ingin menghapus user ini?");

    if (!confirmDelete) return;

    try {
      setMessage("");

      await deleteAdminUser(id);

      setMessage("User berhasil dihapus.");
      await loadUsers();
    } catch (error) {
      setMessage(error.message || "Gagal menghapus user.");
    }
  }

  return (
    <PageShell
      label="Admin"
      title="Manajemen User"
      description="Kelola akun, status persetujuan, dan hak akses pengguna."
      onBack={onBack}
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
          <aside>
            <div className="sticky top-6 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Tambah Akun
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  User Baru
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Buat akun manual untuk user atau admin.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <InputField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                  placeholder="nama@email.com"
                />

                <InputField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(v) => updateField("password", v)}
                  placeholder="Min. 6 karakter"
                />

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Role
                  </label>

                  <select
                    value={form.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 active:scale-[0.98]"
                >
                  Simpan User
                </button>
              </form>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Daftar Pengguna
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Total {users.length} user terdaftar.
                  </p>
                </div>

                <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
                  Admin Panel
                </div>
              </div>

              {loading ? (
                <div className="grid min-h-[360px] place-items-center">
                  <p className="text-sm font-semibold text-slate-400">
                    Memuat data user...
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="grid min-h-[360px] place-items-center px-6 text-center">
                  <div>
                    <p className="text-lg font-black text-slate-800">
                      Belum ada user
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      User yang dibuat akan tampil di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <Th>User</Th>
                          <Th>Kontak</Th>
                          <Th>Profil</Th>
                          <Th>Role</Th>
                          <Th>Status</Th>
                          <Th>Dibuat</Th>
                          <Th align="right">Aksi</Th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <Td>
                              <div className="flex items-center gap-3">
                                <Avatar name={user.nama_lengkap || user.email} />

                                <div>
                                  <p className="font-black text-slate-900">
                                    {user.nama_lengkap || "-"}
                                  </p>
                                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </Td>

                            <Td>
                              <p className="font-semibold text-slate-700">
                                {user.no_wa || "-"}
                              </p>
                            </Td>

                            <Td>
                              <div className="space-y-1 text-xs text-slate-500">
                                <p>{user.jenis_kelamin || "-"}</p>
                                <p>{formatTanggalLahir(user.tanggal_lahir)}</p>
                              </div>
                            </Td>

                            <Td>
                              <Badge
                                label={user.role}
                                color={user.role === "admin" ? "amber" : "slate"}
                              />
                            </Td>

                            <Td>
                              <Badge
                                label={user.status || "active"}
                                color={
                                  user.status === "pending"
                                    ? "amber"
                                    : "emerald"
                                }
                              />
                            </Td>

                            <Td>
                              <span className="text-xs font-medium text-slate-500">
                                {formatTanggal(user.created_at)}
                              </span>
                            </Td>

                            <Td align="right">
                              <div className="flex justify-end gap-2">
                                {user.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(user.id)}
                                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-600 transition hover:bg-emerald-100"
                                  >
                                    Approve
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDelete(user.id)}
                                  className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                                >
                                  Hapus
                                </button>
                              </div>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-4 p-4 lg:hidden">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            <Avatar name={user.nama_lengkap || user.email} />

                            <div className="min-w-0">
                              <p className="truncate text-base font-black text-slate-950">
                                {user.nama_lengkap || "-"}
                              </p>

                              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <Badge
                            label={user.status || "active"}
                            color={
                              user.status === "pending" ? "amber" : "emerald"
                            }
                          />
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                          <InfoItem label="No WA" value={user.no_wa || "-"} />
                          <InfoItem
                            label="Gender"
                            value={user.jenis_kelamin || "-"}
                          />
                          <InfoItem
                            label="Tanggal Lahir"
                            value={formatTanggalLahir(user.tanggal_lahir)}
                          />
                          <InfoItem
                            label="Dibuat"
                            value={formatTanggal(user.created_at)}
                          />
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <Badge
                            label={user.role}
                            color={user.role === "admin" ? "amber" : "slate"}
                          />

                          <div className="flex gap-2">
                            {user.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleApprove(user.id)}
                                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-600"
                              >
                                Approve
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function Avatar({ name }) {
  const initial = String(name || "U").charAt(0).toUpperCase();

  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-md">
      {initial}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-slate-700">{value}</p>
    </div>
  );
}

function Badge({ label, color }) {
  const styles = {
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    slate: "bg-slate-100 text-slate-500 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ${styles[color]}`}
    >
      {label}
    </span>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
        placeholder={placeholder}
        required
      />
    </div>
  );
}

function Th({ children, align = "left" }) {
  const alignClass = align === "right" ? "text-right" : "text-left";

  return (
    <th
      className={`whitespace-nowrap px-6 py-4 ${alignClass} text-[10px] font-black uppercase tracking-widest text-slate-400`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left" }) {
  const alignClass = align === "right" ? "text-right" : "text-left";

  return (
    <td className={`whitespace-nowrap px-6 py-5 ${alignClass} text-sm`}>
      {children}
    </td>
  );
}