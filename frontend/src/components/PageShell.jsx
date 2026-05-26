export default function PageShell({ label, title, description, onBack, children }) {
  return (
    <main className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] antialiased sm:px-6">
      {/* Diubah ke max-w-2xl agar form tidak melar kesamping */}
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-0.5">
            {label && (
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#86868B]">
                {label}
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-sm font-medium text-[#86868B]">
                {description}
              </p>
            )}
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="group flex items-center gap-1.5 self-start rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-95 sm:self-auto"
            >
              <svg 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-0.5"
              >
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Kembali
            </button>
          )}
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </section>
      </div>
    </main>
  );
}