import Sidebar from "../components/Sidebar";
import MobileBottomNav from "../components/MobileBottomNav";

export default function AppLayout({ children, page, setPage, user, onLogout }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F5F7] antialiased">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={onLogout} />

      <div className="min-h-screen w-full lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#E5E5EA]/50 bg-white/80 px-5 py-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-bold tracking-tight text-[#1D1D1F]">
                Nadifah
              </p>
              <p className="max-w-[220px] truncate text-[10px] font-medium text-[#86868B]">
                {user?.email}
              </p>
            </div>

            <button
              onClick={onLogout}
              className="rounded-full bg-[#FF3B30]/10 px-4 py-1.5 text-xs font-semibold text-[#FF3B30] active:scale-95"
            >
              Keluar
            </button>
          </div>
        </header>

        <main className="min-h-screen w-full pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      <MobileBottomNav page={page} setPage={setPage} user={user} />
    </div>
  );
}