const API_BASE_URL = "http://127.0.0.1:5000";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    throw new Error(data?.message || "Terjadi kesalahan pada server.");
  }

  return data;
}

export function getDashboard(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/dashboard${query ? `?${query}` : ""}`);
}

export function getTransactionOptions() {
  return apiFetch("/api/transactions/options");
}

export function getTransactions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/transactions${query ? `?${query}` : ""}`);
}

export function createTransaction(payload) {
  return apiFetch("/api/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(id) {
  return apiFetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });
}

export function getRekening() {
  return apiFetch("/api/rekening");
}

export function createRekening(payload) {
  return apiFetch("/api/rekening", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getTabungan() {
  return apiFetch("/api/tabungan");
}

export function createTabungan(payload) {
  return apiFetch("/api/tabungan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function addFundTabungan(id, payload) {
  return apiFetch(`/api/tabungan/${id}/add-fund`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAnggaran(params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/anggaran${query ? `?${query}` : ""}`);
}

export function createAnggaran(payload) {
  return apiFetch("/api/anggaran", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUtangPiutang() {
  return apiFetch("/api/utang-piutang");
}

export function createUtangPiutang(payload) {
  return apiFetch("/api/utang-piutang", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function payUtangPiutang(id, payload) {
  return apiFetch(`/api/utang-piutang/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteUtangPiutang(id) {
  return apiFetch(`/api/utang-piutang/${id}`, {
    method: "DELETE",
  });
}

export function getAdminUsers() {
  return apiFetch("/api/admin/users");
}

export function createAdminUser(payload) {
  return apiFetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(id) {
  return apiFetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

export function registerUser(payload) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveAdminUser(id) {
  return apiFetch(`/api/admin/users/${id}/approve`, {
    method: "PATCH",
  });
}

export function getTransactionDetail(id) {
  return apiFetch(`/api/transactions/${id}`);
}

export function updateTransaction(id, payload) {
  return apiFetch(`/api/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getPengaturan() {
  return apiFetch("/api/pengaturan");
}

export function updateGaji(payload) {
  return apiFetch("/api/pengaturan/gaji", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}