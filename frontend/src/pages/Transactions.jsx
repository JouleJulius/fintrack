import { useEffect, useState } from "react";
import {
  deleteTransaction,
  getTransactions,
  getTransactionOptions,
  updateTransaction,
} from "../services/api";
import PageShell from "../components/PageShell";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTanggal(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function Transactions({ onBack }) {
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({ kategori_pengeluaran: [], kategori_pemasukan: [], rekening: [] });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    tipe: "pengeluaran", jumlah: "", kategori: "", rekening_id: "", tanggal_transaksi: "", deskripsi: "",
  });

  async function loadTransactions(page = 1) {
    try {
      setLoading(true);
      const result = await getTransactions({ page, per_page: 15 });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Yakin ingin menghapus transaksi ini?");
    if (!confirmDelete) return;
    try {
      setMessage("");
      await deleteTransaction(id);
      setMessage("Transaksi berhasil dihapus.");
      loadTransactions(pagination.page);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openEdit(item) {
    if (item.kategori === "Transfer") {
      setMessage("Transaksi transfer belum bisa diedit dari halaman ini.");
      return;
    }
    const kategoriList = item.tipe === "pemasukan" ? options.kategori_pemasukan : options.kategori_pengeluaran;
    setEditItem(item);
    setEditForm({
      tipe: item.tipe,
      jumlah: item.jumlah,
      kategori: item.kategori || kategoriList[0] || "",
      rekening_id: item.rekening_id || options.rekening[0]?.id || "",
      tanggal_transaksi: toDatetimeLocal(item.tanggal),
      deskripsi: item.deskripsi || "",
    });
  }

  const updateEditField = (name, value) => setEditForm((prev) => ({ ...prev, [name]: value }));

  function handleEditTipeChange(tipe) {
    const kategoriList = tipe === "pemasukan" ? options.kategori_pemasukan : options.kategori_pengeluaran;
    setEditForm((prev) => ({ ...prev, tipe, kategori: kategoriList[0] || "" }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      setMessage("");
      await updateTransaction(editItem.id, editForm);
      setEditItem(null);
      setMessage("Transaksi diperbarui.");
      loadTransactions(pagination.page);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      try {
        const [optRes, trxRes] = await Promise.all([
          getTransactionOptions(),
          getTransactions({ page: 1, per_page: 15 }),
        ]);
        if (!cancelled) {
          setOptions(optRes);
          setItems(trxRes.items);
          setPagination(trxRes.pagination);
        }
      } catch (error) {
        if (!cancelled) setMessage(error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchInitial();
    return () => { cancelled = true; };
  }, []);

  const kategoriList = editForm.tipe === "pemasukan" ? options.kategori_pemasukan : options.kategori_pengeluaran;

  return (
    <PageShell
      label="Aktivitas"
      title="Riwayat"
      description="Pantau arus kas Anda."
      onBack={onBack}
    >
      <div className="mx-auto max-w-5xl px-0 pb-24 sm:px-4">
        
        {message && (
          <div className="mb-6 mx-4 sm:mx-0 rounded-2xl bg-white p-4 text-xs font-semibold shadow-sm border border-[#F3F4F6]">
            {message}
          </div>
        )}

        <div className="overflow-hidden bg-white shadow-[0_8px_30px_rgba(0,0,0,0.02)] sm:rounded-[32px]">
          {loading ? (
            <div className="p-20 text-center text-sm font-medium text-[#86868B]">Memuat...</div>
          ) : (
            <>
              {/* Desktop View (Table) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-[#F5F5F7]">
                  <thead className="bg-[#FBFBFC]">
                    <tr>
                      <Th>Tanggal</Th>
                      <Th>Deskripsi</Th>
                      <Th>Kategori</Th>
                      <Th>Tipe</Th>
                      <Th align="right">Jumlah</Th>
                      <Th align="center">Aksi</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F7]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FBFBFC] transition-colors">
                        <Td>{formatTanggal(item.tanggal)}</Td>
                        <Td><span className="font-semibold text-[#1D1D1F]">{item.deskripsi || "-"}</span></Td>
                        <Td><span className="text-[#86868B]">{item.kategori}</span></Td>
                        <Td>
                          <Badge tipe={item.tipe} />
                        </Td>
                        <Td align="right"><span className="font-bold text-[#1D1D1F]">{formatRupiah(item.jumlah)}</span></Td>
                        <Td align="center">
                          <button onClick={() => openEdit(item)} className="text-[#0071E3] font-bold text-xs mr-4 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="text-[#FF3B30] font-bold text-xs hover:underline">Hapus</button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View (Card List) */}
              <div className="sm:hidden divide-y divide-[#F5F5F7]">
                {items.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#86868B]">Belum ada transaksi.</div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="p-5 active:bg-[#F5F5F7] transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                          {formatTanggal(item.tanggal)}
                        </span>
                        <Badge tipe={item.tipe} />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 pr-4">
                          <p className="font-bold text-[#1D1D1F] truncate">{item.deskripsi || "-"}</p>
                          <p className="text-xs text-[#86868B]">{item.kategori}</p>
                        </div>
                        <p className={`text-sm font-black ${item.tipe === 'pemasukan' ? 'text-[#34C759]' : 'text-[#1D1D1F]'}`}>
                          {item.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(item.jumlah)}
                        </p>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button onClick={() => openEdit(item)} className="flex-1 rounded-xl bg-[#F5F5F7] py-2 text-[11px] font-bold text-[#1D1D1F]">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="flex-1 rounded-xl bg-[#FF3B30]/10 py-2 text-[11px] font-bold text-[#FF3B30]">Hapus</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination (Responsive) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#F5F5F7]">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadTransactions(pagination.page - 1)}
                  className="w-full sm:w-auto rounded-full border border-[#D1D1D6] px-6 py-2 text-xs font-bold disabled:opacity-30 active:scale-95 transition-all"
                >
                  Sebelumnya
                </button>
                <p className="text-[11px] font-bold text-[#86868B] uppercase tracking-widest">
                  Halaman {pagination.page} / {pagination.total_pages || 1}
                </p>
                <button
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => loadTransactions(pagination.page + 1)}
                  className="w-full sm:w-auto rounded-full border border-[#D1D1D6] px-6 py-2 text-xs font-bold disabled:opacity-30 active:scale-95 transition-all"
                >
                  Berikutnya
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal (Apple Style) */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1D1D1F]/40 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white p-8 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">Edit Transaksi</h2>
              <button onClick={() => setEditItem(null)} className="h-8 w-8 rounded-full bg-[#F5F5F7] text-[#86868B] flex items-center justify-center text-lg">×</button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F5F5F7] p-1.5">
                {["pemasukan", "pengeluaran"].map((t) => (
                  <button
                    key={t} type="button" onClick={() => handleEditTipeChange(t)}
                    className={`rounded-xl py-2 text-xs font-bold capitalize transition-all ${editForm.tipe === t ? "bg-white text-[#1D1D1F] shadow-sm" : "text-[#86868B]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <InputField label="Jumlah" type="number" value={editForm.jumlah} onChange={(v) => updateEditField("jumlah", v)} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField label="Kategori" value={editForm.kategori} onChange={(e) => updateEditField("kategori", e.target.value)} options={kategoriList} />
                <SelectField label="Rekening" value={editForm.rekening_id} onChange={(e) => updateEditField("rekening_id", e.target.value)} options={options.rekening} isAccount />
              </div>

              <InputField label="Waktu" type="datetime-local" value={editForm.tanggal_transaksi} onChange={(v) => updateEditField("tanggal_transaksi", v)} />
              <InputField label="Deskripsi" value={editForm.deskripsi} onChange={(v) => updateEditField("deskripsi", v)} />

              <button className="h-14 w-full rounded-2xl bg-[#1D1D1F] text-sm font-bold text-white shadow-lg active:scale-95 transition-all">Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ── UI HELPERS ── */

function Badge({ tipe }) {
  const isPemasukan = tipe === "pemasukan";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${isPemasukan ? "bg-[#EAF9EE] text-[#34C759]" : "bg-[#FFF2F4] text-[#FF3B30]"}`}>
      {tipe}
    </span>
  );
}

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1">
      <label className="ml-1 text-[10px] font-bold uppercase text-[#86868B] tracking-wider">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl bg-[#F5F5F7] px-4 text-sm font-bold text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#1D1D1F]/5"
        required
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, isAccount }) {
  return (
    <div className="space-y-1">
      <label className="ml-1 text-[10px] font-bold uppercase text-[#86868B] tracking-wider">{label}</label>
      <select
        value={value} onChange={onChange}
        className="h-12 w-full appearance-none rounded-2xl bg-[#F5F5F7] px-4 text-sm font-bold text-[#1D1D1F] outline-none"
        required
      >
        {options.map((opt) => (
          <option key={isAccount ? opt.id : opt} value={isAccount ? opt.id : opt}>
            {isAccount ? opt.nama_rekening : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return <th className={`px-6 py-4 text-${align} text-[10px] font-bold uppercase tracking-widest text-[#86868B]`}>{children}</th>;
}

function Td({ children, align = "left" }) {
  return <td className={`whitespace-nowrap px-6 py-4 text-${align} text-xs text-[#424245]`}>{children}</td>;
}