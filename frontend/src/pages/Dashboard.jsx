import { useEffect, useState} from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getDashboard } from "../services/api";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboard() {
      try {
        setLoading(true);
        const result = await getDashboard({ bulan, tahun });
        if (!cancelled) setData(result);
      } catch (error) {
        console.error(error);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { cancelled = true; };
  }, [bulan, tahun]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-[#6366F1]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium text-[#9CA3AF]">Menyinkronkan data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FC]">
        <p className="text-sm font-semibold text-[#F43F5E]">Gagal memuat data.</p>
      </div>
    );
  }

  const namaUser = data.user.email.split("@")[0];

  const trendChart = data.tren_data.labels.map((label, i) => ({
    label,
    pemasukan: data.tren_data.pemasukan[i],
    pengeluaran: data.tren_data.pengeluaran[i],
  }));

  const pieChart = data.chart_data.labels.map((label, i) => ({
    name: label,
    value: data.chart_data.data[i],
  }));

  const pieColors = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6", "#06B6D4", "#84CC16"];
  const totalPengeluaran = pieChart.reduce((a, b) => a + b.value, 0);

  const hariLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const barChart = hariLabels.map((label, i) => ({
    label,
    nilai: data.pengeluaran_harian?.[i] || 0,
  }));

  const totalSaldo =
    (data.rekening || []).reduce((a, r) => a + (r.saldo_sekarang || 0), 0);

  const bulanNama = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember",
  ];

  return (
    <main className="min-h-screen w-full bg-[#F7F8FC] p-5 text-[#111827]">
      <div className="mx-auto max-w-[1400px] space-y-4">

        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">Selamat datang kembali</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
              Halo,{" "}
              <span className="font-serif italic text-[#6366F1]">{namaUser}</span>{" "}
              ✦
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#374151]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="bg-transparent outline-none cursor-pointer text-xs font-semibold text-[#374151]"
            >
              {bulanNama.map((nama, i) => (
                <option key={i + 1} value={i + 1}>{nama}</option>
              ))}
            </select>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="w-14 bg-transparent text-center outline-none text-xs font-semibold text-[#374151]"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label="Dana aman"
            value={formatRupiah(data.summary.dana_aman_terpenuhi)}
            sub="Terpenuhi ✓"
            color="violet"
            icon={<IconShield />}
          />
          <SummaryCard
            label="Pemasukan"
            value={formatRupiah(data.summary.pemasukan_bulan_ini)}
            sub="Bulan ini"
            color="emerald"
            icon={<IconTrendUp />}
          />
          <SummaryCard
            label="Pengeluaran"
            value={formatRupiah(data.summary.pengeluaran_bulan_ini)}
            sub="Bulan ini"
            color="rose"
            icon={<IconTrendDown />}
          />
          <SummaryCard
            label="Saldo produktif"
            value={formatRupiah(data.summary.saldo_produktif)}
            sub="Tersedia"
            color="amber"
            icon={<IconPie />}
          />
        </div>

        {/* Mid Row: Trend Chart + Donut */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <Card>
            <div className="mb-1 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-[#111827]">Tren 6 bulan terakhir</p>
                <p className="text-xs text-[#9CA3AF]">Pemasukan vs pengeluaran</p>
              </div>
              <div className="flex gap-3">
                <LegendDot color="#6366F1" label="Pemasukan" />
                <LegendDot color="#F43F5E" label="Pengeluaran" dashed />
              </div>
            </div>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "inherit" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "inherit" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v / 1_000_000}jt`}
                  />
                  <Tooltip
                    contentStyle={{ background: "#1F2937", border: "none", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#F9FAFB", fontWeight: 600 }}
                    itemStyle={{ color: "#D1D5DB" }}
                    formatter={(v) => [formatRupiah(v)]}
                  />
                  <Area type="monotone" dataKey="pemasukan" stroke="#6366F1" strokeWidth={2.5} fill="url(#gradIn)" dot={{ r: 3, fill: "#6366F1" }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="pengeluaran" stroke="#F43F5E" strokeWidth={2.5} strokeDasharray="5 3" fill="url(#gradOut)" dot={{ r: 3, fill: "#F43F5E" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-bold text-[#111827]">Alokasi pengeluaran</p>
            <p className="mb-3 text-xs text-[#9CA3AF]">Distribusi kategori bulan ini</p>

            {totalPengeluaran === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <div className="h-20 w-20 rounded-full border-[14px] border-[#F3F4F6]" />
                <p className="text-xs text-[#9CA3AF]">Belum ada pengeluaran</p>
              </div>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={3}>
                      {pieChart.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1F2937", border: "none", borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: "#D1D5DB" }}
                      formatter={(v) => [formatRupiah(v)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {pieChart.slice(0, 6).map((item, i) => {
                const pct = totalPengeluaran > 0 ? Math.round((item.value / totalPengeluaran) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ background: pieColors[i % pieColors.length] }} />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-[#6B7280]">{item.name}</span>
                    <span className="text-[11px] font-bold text-[#374151]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

          {/* Rekening */}
          <Card>
            <p className="mb-1 text-sm font-bold text-[#111827]">Rekening aktif</p>
            <p className="mb-4 text-xs text-[#9CA3AF]">Saldo per akun</p>
            <div className="space-y-0">
              {(data.rekening || []).map((rek, i) => (
                <div key={rek.id} className="flex items-center gap-3 border-b border-[#F3F4F6] py-2.5 last:border-0">
                  <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#111827]">{rek.nama_rekening}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{rek.jenis_rekening}</p>
                  </div>
                  <p className="text-xs font-bold text-[#111827]">{formatRupiah(rek.saldo_sekarang)}</p>
                </div>
              ))}
            </div>
            {totalSaldo > 0 && (
              <div className="mt-4 space-y-2">
                {(data.rekening || []).map((rek, i) => {
                  const pct = totalSaldo > 0 ? Math.round((rek.saldo_sekarang / totalSaldo) * 100) : 0;
                  return (
                    <div key={rek.id}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="font-medium text-[#374151]">{rek.nama_rekening}</span>
                        <span className="text-[#9CA3AF]">{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: pieColors[i % pieColors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Transaksi Terbaru */}
          <Card>
            <p className="mb-1 text-sm font-bold text-[#111827]">Aktivitas terkini</p>
            <p className="mb-4 text-xs text-[#9CA3AF]">Transaksi terakhir</p>
            <div className="space-y-0">
              {(data.transaksi_terbaru || []).map((trx) => {
                const isIn = trx.tipe?.toLowerCase() === "pemasukan";
                return (
                  <div key={trx.id} className="flex items-center gap-3 border-b border-[#F3F4F6] py-2.5 last:border-0">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs"
                      style={{
                        background: isIn ? "#ECFDF5" : "#FFF1F2",
                        color: isIn ? "#10B981" : "#F43F5E",
                      }}
                    >
                      {isIn ? <IconTrendUp size={14} /> : <IconTrendDown size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#111827]">{trx.deskripsi || "-"}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{trx.kategori} · {trx.tipe}</p>
                    </div>
                    <p className={`text-xs font-bold ${isIn ? "text-[#059669]" : "text-[#E11D48]"}`}>
                      {isIn ? "+" : "-"}{formatRupiah(trx.jumlah)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Utang Piutang + Bar Chart */}
          <Card>
            <p className="mb-1 text-sm font-bold text-[#111827]">Kewajiban & klaim</p>
            <p className="mb-3 text-xs text-[#9CA3AF]">Utang & piutang aktif</p>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#FFF1F2] p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#F43F5E]">Utang</p>
                <p className="text-base font-extrabold leading-tight text-[#E11D48]">
                  {formatRupiah(data.utang_piutang.total_utang)}
                </p>
              </div>
              <div className="rounded-xl bg-[#ECFDF5] p-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#10B981]">Piutang</p>
                <p className="text-base font-extrabold leading-tight text-[#059669]">
                  {formatRupiah(data.utang_piutang.total_piutang)}
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm font-bold text-[#111827]">Pengeluaran harian</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChart} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={16}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9CA3AF", fontSize: 9, fontFamily: "inherit" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#1F2937", border: "none", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "#D1D5DB" }}
                    formatter={(v) => [formatRupiah(v), "Pengeluaran"]}
                    cursor={{ fill: "rgba(99,102,241,0.05)" }}
                  />
                  <Bar dataKey="nilai" radius={[4, 4, 0, 0]}>
                    {barChart.map((_, i) => (
                      <Cell key={i} fill={_.nilai > 0 ? "#6366F1" : "#EEF2FF"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </main>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
      {children}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon }) {
  const themes = {
    violet: {
      card: "bg-white",
      icon: "bg-[#EEF2FF] text-[#6366F1]",
      accent: "bg-[#6366F1]",
      value: "text-[#6366F1]",
    },
    emerald: {
      card: "bg-white",
      icon: "bg-[#ECFDF5] text-[#10B981]",
      accent: "bg-[#10B981]",
      value: "text-[#059669]",
    },
    rose: {
      card: "bg-white",
      icon: "bg-[#FFF1F2] text-[#F43F5E]",
      accent: "bg-[#F43F5E]",
      value: "text-[#E11D48]",
    },
    amber: {
      card: "bg-white",
      icon: "bg-[#FFFBEB] text-[#F59E0B]",
      accent: "bg-[#F59E0B]",
      value: "text-[#D97706]",
    },
  };
  const t = themes[color];
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#F3F4F6] p-4 ${t.card}`}>
      <div className={`absolute right-0 top-0 h-14 w-14 rounded-bl-[60px] opacity-[0.07] ${t.accent}`} />
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${t.icon}`}>
        {icon}
      </div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
      <p className={`text-lg font-extrabold leading-tight ${t.value}`}>{value}</p>
      <p className="mt-1 text-[11px] text-[#9CA3AF]">{sub}</p>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex w-6 items-center">
        {dashed ? (
          <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke={color} strokeWidth="2" strokeDasharray="4 2" /></svg>
        ) : (
          <div className="h-0.5 w-5 rounded-full" style={{ background: color }} />
        )}
      </div>
      <span className="text-[11px] font-medium text-[#6B7280]">{label}</span>
    </div>
  );
}

function IconShield({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconTrendUp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconTrendDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function IconPie({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}