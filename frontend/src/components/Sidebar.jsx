export default function Sidebar({
  page,
  setPage,
  user,
  onLogout,
}) {
  const menus = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "transactions", label: "Riwayat Transaksi", icon: "📑" },
    { key: "add-rekening", label: "Rekening", icon: "💳" },
    { key: "add-tabungan", label: "Tabungan", icon: "💰" },
    { key: "add-anggaran", label: "Anggaran", icon: "📅" },
    { key: "utang-piutang", label: "Utang Piutang", icon: "🤝" },
    { key: "settings", label: "Pengaturan", icon: "⚙️" },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-[#E5E5EA] bg-white p-6 lg:flex">
      
      {/* Brand */}
      <div className="mb-8 px-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
          Nadifah
        </h2>
        <p className="text-xs font-medium text-[#86868B]">
          Personal Finance App
        </p>
      </div>

      {/* CTA Add Transaction */}
      <button
        onClick={() => setPage("add-transaction")}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0071E3] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-[#0071E3]/20 transition-all hover:scale-[1.02] hover:bg-[#0077ED] active:scale-[0.98]"
      >
        <span className="text-lg">➕</span>
        Tambah Transaksi
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {menus.map((menu) => (
          <button
            key={menu.key}
            onClick={() => setPage(menu.key)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
              page === menu.key
                ? "bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20"
                : "text-[#1D1D1F] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-lg">{menu.icon}</span>
            {menu.label}
          </button>
        ))}

        {user?.role === "admin" && (
          <button
            onClick={() => setPage("admin-users")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
              page === "admin-users"
                ? "bg-[#0071E3] text-white shadow-md shadow-[#0071E3]/20"
                : "text-[#1D1D1F] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-lg">⚙️</span>
            Admin Panel
          </button>
        )}
      </nav>

      {/* User Section */}
      <div className="mt-6 border-t border-[#F5F5F7] pt-6">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8E8ED] text-sm font-bold text-[#86868B]">
            {user?.email?.[0]?.toUpperCase()}
          </div>

          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold text-[#1D1D1F]">
              {user?.email}
            </p>

            <p className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
              {user?.role}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF3B30]/10 py-3 text-sm font-bold text-[#FF3B30] transition-all hover:bg-[#FF3B30]/20"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}