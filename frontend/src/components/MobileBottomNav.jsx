export default function MobileBottomNav({ page, setPage, user }) {
  const menus = [
    { 
      key: "dashboard", 
      label: "Home",
      // Ikon Rumah (SF Symbols style)
      icon: (isActive) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    { 
      key: "add-transaction", 
      label: "Transaksi",
      // Ikon Tambah di dalam lingkaran (Pusat Aksi)
      icon: (isActive) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16" stroke={isActive ? "#FFF" : "currentColor"}/>
          <line x1="8" y1="12" x2="16" y2="12" stroke={isActive ? "#FFF" : "currentColor"}/>
        </svg>
      )
    },
    { 
      key: "transactions", 
      label: "Riwayat",
      // Ikon List / Dokumen
      icon: (isActive) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      )
    },
    { 
      key: "add-rekening", 
      label: "Rekening",
      // Ikon Kartu Kredit
      icon: (isActive) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
      )
    },
    { 
      key: "utang-piutang", 
      label: "Utang",
      // Ikon Dua Orang / Hubungan Keuangan
      icon: (isActive) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )
    },
  ];

  if (user?.role === "admin") {
    menus.push({ 
      key: "admin-users", 
      label: "Admin",
      icon: (isActive) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E5EA]/50 bg-white/80 pb-5 pt-2 text-[#1D1D1F] backdrop-blur-xl lg:hidden">
      {/* Catatan: pb-5 memberikan ruang ekstra di bagian bawah (Safe Area) untuk iPhone modern yang tidak memiliki tombol Home fisik */}
      <div className="mx-auto flex max-w-md items-end justify-around px-2">
        {menus.map((menu) => {
          const isActive = page === menu.key;
          return (
            <button
              key={menu.key}
              onClick={() => setPage(menu.key)}
              className="group flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-transform active:scale-90"
            >
              {/* Tempat Ikon */}
              <div 
                className={`transition-colors duration-200 ${
                  isActive ? "text-[#0071E3]" : "text-[#86868B] group-hover:text-[#424245]"
                }`}
              >
                {menu.icon(isActive)}
              </div>
              
              {/* Teks Label */}
              <span 
                className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? "text-[#0071E3]" : "text-[#86868B]"
                }`}
              >
                {menu.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}