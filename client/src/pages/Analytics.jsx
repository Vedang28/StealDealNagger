import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { analyticsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import PageWrapper from "../components/PageWrapper";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import {
  BarChart2,
  Briefcase,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  Download,
  FileText,
  DollarSign,
  RefreshCw,
  Heart,
} from "lucide-react";

const CHART_COLORS = {
  healthy: "#4ade80",
  warning: "#f59e0b",
  stale: "#f97316",
  critical: "#ef4444",
};

function formatCurrency(val) {
  const num = Number(val) || 0;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
}
function pct(a, b) {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}

function repBarColor(score) {
  if (score >= 80) return "#4ade80";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function heatColor(count, max) {
  if (max === 0 || count === 0)
    return "bg-[#111] text-[#444]";
  const ratio = count / max;
  if (ratio > 0.7)
    return "bg-red-500/15 text-red-400";
  if (ratio > 0.4)
    return "bg-orange-500/15 text-orange-400";
  if (ratio > 0.1)
    return "bg-amber-500/10 text-amber-400";
  return "bg-yellow-500/5 text-yellow-400";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-[#f0ede8] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: p.fill || p.stroke }}
          />
          <span className="text-[#888] capitalize">
            {p.name}:
          </span>
          <span className="text-[#f0ede8] font-medium">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function LeaderboardSparkline({ data = [], width = 60, height = 20 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const color = data[data.length - 1] >= data[0] ? "#4ade80" : "#ef4444";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="inline-block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HeatmapTooltip = ({ stage, day, cell }) => {
  if (!cell) return null;
  return (
    <div className="absolute z-50 bg-[#161616] border border-[rgba(255,255,255,0.07)] rounded-lg p-2.5 shadow-lg text-xs pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 left-1/2 min-w-32">
      <p className="font-semibold text-[#f0ede8]">
        {stage} — {day}
      </p>
      <div className="mt-1 space-y-0.5">
        <p className="text-danger">Stale: {cell.staleCount}</p>
        <p className="text-critical">Critical: {cell.criticalCount}</p>
        <p className="text-[#888]">Total: {cell.total}</p>
      </div>
    </div>
  );
};

export default function Analytics() {
  const [pipeline, setPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [reps, setReps] = useState([]);
  const [trends, setTrends] = useState(null);
  const [velocity, setVelocity] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [revenueRisk, setRevenueRisk] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);
  const [velocityRange, setVelocityRange] = useState(30);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("all");
  const [hoverCell, setHoverCell] = useState(null);

  const loadTrends = useCallback((days) => {
    analyticsAPI
      .trends({ days })
      .then((r) => setTrends(r.data.data))
      .catch(() => {});
  }, []);

  const loadVelocity = useCallback((days) => {
    analyticsAPI
      .velocity({ days })
      .then((r) => setVelocity(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      analyticsAPI.pipeline(),
      analyticsAPI.stages(),
      analyticsAPI.reps(),
      analyticsAPI.trends({ days: dateRange }),
      analyticsAPI.velocity({ days: velocityRange }),
      analyticsAPI.heatmap(),
      analyticsAPI.revenueAtRisk(),
      analyticsAPI.recoveryRate(),
      analyticsAPI.leaderboard(),
    ])
      .then(([pRes, sRes, rRes, tRes, vRes, hRes, rrRes, rcRes, lbRes]) => {
        setPipeline(pRes.data.data);
        setStages(sRes.data.data ?? []);
        setReps(rRes.data.data ?? []);
        setTrends(tRes.data.data);
        setVelocity(vRes.data.data ?? []);
        setHeatmap(hRes.data.data);
        setRevenueRisk(rrRes.data.data);
        setRecovery(rcRes.data.data);
        setLeaderboard(lbRes.data.data ?? []);
      })
      .catch((err) => console.error("Failed to load analytics", err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDateRange(days) {
    setDateRange(days);
    loadTrends(days);
  }

  function handleVelocityRange(days) {
    setVelocityRange(days);
    loadVelocity(days);
  }

  function exportCSV() {
    const rows = [
      ["Stage Analytics"],
      [
        "Stage",
        "Total Deals",
        "Avg Days Stale",
        "Total Revenue",
        "Healthy",
        "Warning",
        "Stale",
        "Critical",
      ],
      ...stages.map((s) => [
        s.stage,
        s.totalDeals,
        Math.round(s.avgDaysStale ?? 0),
        Number(s.totalRevenue).toFixed(2),
        s.byStatus?.healthy ?? 0,
        s.byStatus?.warning ?? 0,
        s.byStatus?.stale ?? 0,
        s.byStatus?.critical ?? 0,
      ]),
      [],
      ["Rep Performance"],
      [
        "Rep",
        "Email",
        "Total Deals",
        "Health Score %",
        "At-Risk Deals",
        "Total Revenue",
      ],
      ...reps.map((r) => [
        r.user?.name,
        r.user?.email,
        r.totalDeals,
        r.healthScore,
        r.atRiskDeals,
        Number(r.totalRevenue).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const doc = new jsPDF();
    const today = new Date().toISOString().split("T")[0];

    // Title
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text("Pipeline Analytics Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${today}`, 14, 27);

    // KPI summary
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text("Pipeline Summary", 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [["Metric", "Value"]],
      body: [
        ["Total Deals", String(pipeline?.totalDeals ?? 0)],
        ["Total Revenue", formatCurrency(pipeline?.totalRevenue ?? 0)],
        ["At-Risk Revenue", formatCurrency(pipeline?.atRiskRevenue ?? 0)],
        ["Health Score", `${pipeline?.healthScore ?? 0}%`],
        ["Recovery Rate", `${recovery?.recoveryRate ?? 0}%`],
      ],
      theme: "striped",
      headStyles: { fillColor: [249, 115, 22] },
      margin: { left: 14 },
    });

    // Stage breakdown
    if (stages.length > 0) {
      doc.text("Stage Breakdown", 14, doc.lastAutoTable.finalY + 12);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [["Stage", "Deals", "Revenue", "Avg Days Stale"]],
        body: stages.map((s) => [
          s.stage,
          String(s.totalDeals),
          formatCurrency(s.totalRevenue),
          `${Math.round(s.avgDaysStale ?? 0)}d`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] },
        margin: { left: 14 },
      });
    }

    // Rep performance
    if (reps.length > 0) {
      const y = doc.lastAutoTable.finalY + 12;
      if (y > 240) doc.addPage();
      doc.text("Rep Performance", 14, y > 240 ? 20 : y);
      autoTable(doc, {
        startY: (y > 240 ? 20 : y) + 4,
        head: [["Rep", "Deals", "Health %", "At-Risk", "Revenue"]],
        body: reps.map((r) => [
          r.user?.name,
          String(r.totalDeals),
          `${r.healthScore}%`,
          String(r.atRiskDeals),
          formatCurrency(r.totalRevenue),
        ]),
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22] },
        margin: { left: 14 },
      });
    }

    doc.save(`analytics-${today}.pdf`);
  }

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <div className="h-7 w-32 bg-[#1e1e1e] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[#1e1e1e] rounded animate-pulse mt-2" />
        </div>
        <SkeletonStatCards />
        <SkeletonTable rows={4} cols={5} />
        <SkeletonTable rows={4} cols={4} />
      </div>
    );

  const totalDeals = pipeline?.totalDeals ?? 0;
  const byStatus = pipeline?.byStatus ?? {};
  const staleCount = byStatus.stale?.count ?? 0;
  const criticalCount = byStatus.critical?.count ?? 0;
  const hasHistoricalTrends =
    trends?.trend?.filter((t) => t.healthy !== null).length > 1;
  const trendChartData = trends?.trend?.filter((t) => t.healthy !== null) ?? [];

  // Heatmap max for color scaling
  const heatMax = heatmap
    ? Math.max(
        1,
        ...Object.values(heatmap.matrix).flatMap((dayMap) =>
          Object.values(dayMap).map((cell) => cell.total),
        ),
      )
    : 1;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader label="analytics" title="Analytics" description="Pipeline health, velocity, and team performance">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e8a87c] text-sm font-medium text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] transition-colors duration-150 active:scale-95"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e8a87c] text-sm font-medium text-[#e8a87c] hover:bg-[#e8a87c] hover:text-[#0a0a0a] transition-colors duration-150 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </PageHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            {
              icon: Briefcase,
              label: "Total Deals",
              value: totalDeals,
              color: "text-[#e8a87c]",
              bg: "bg-[#e8a87c]/10",
            },
            {
              icon: AlertTriangle,
              label: "Stale Deals",
              value: staleCount,
              color: "text-danger",
              bg: "bg-red-500/10",
            },
            {
              icon: TrendingDown,
              label: "Critical Deals",
              value: criticalCount,
              color: "text-critical",
              bg: "bg-red-500/15",
            },
            {
              icon: BarChart2,
              label: "Stale Rate",
              value: `${pct(staleCount, totalDeals || 1)}%`,
              color: "text-warning",
              bg: "bg-amber-500/10",
            },
            {
              icon: DollarSign,
              label: "At-Risk Revenue",
              value: formatCurrency(pipeline?.atRiskRevenue ?? 0),
              color: "text-danger",
              bg: "bg-red-500/10",
            },
            {
              icon: Heart,
              label: "Recovery Rate",
              value: `${recovery?.recoveryRate ?? 0}%`,
              color: "text-success",
              bg: "bg-green-500/10",
            },
          ].map(({ icon: Icon, label, value, color, bg }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-5 card-hover-lift"
            >
              <div
                className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-[#f0ede8]">
                {value}
              </p>
              <p className="text-sm text-[#888] mt-0.5">
                {label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Health Breakdown */}
        {Object.keys(byStatus).length > 0 && (
          <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6 mb-8">
            <h3 className="font-semibold text-[#f0ede8] mb-4">
              Deal Health Breakdown
            </h3>
            <div className="space-y-4">
              {["healthy", "warning", "stale", "critical"].map((s) => {
                const data = byStatus[s] ?? {};
                const count = data.count ?? 0;
                const p = pct(count, totalDeals || 1);
                const barColors = {
                  healthy: "bg-success",
                  warning: "bg-warning",
                  stale: "bg-danger",
                  critical: "bg-critical",
                };
                return (
                  <div key={s}>
                    <div className="flex justify-between items-center mb-1">
                      <StatusBadge status={s} />
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-[#888]">
                          {formatCurrency(data.revenue)}
                        </span>
                        <span className="font-semibold text-[#f0ede8] w-6 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-[#1e1e1e] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${barColors[s]}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Health Trend Chart */}
        <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6 mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#888]" />
              <h3 className="font-semibold text-[#f0ede8]">
                Pipeline Health Trend
              </h3>
            </div>
            <div className="flex gap-1 bg-[#1e1e1e] rounded-lg p-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDateRange(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                    dateRange === d
                      ? "bg-[#2a2a2a] text-[#f0ede8]"
                      : "text-[#555] hover:text-[#f0ede8]"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {!hasHistoricalTrends ? (
            <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Historical data accumulates as the staleness engine runs. Check
                back after it has run for a few days to see trend charts.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart
                data={trendChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {Object.entries(CHART_COLORS).map(([k, c]) => (
                    <linearGradient
                      key={k}
                      id={`grad-${k}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#555" }}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis tick={{ fontSize: 11, fill: "#555" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                />
                {["healthy", "warning", "stale", "critical"].map((k) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stackId="1"
                    stroke={CHART_COLORS[k]}
                    fill={`url(#grad-${k})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue at Risk Trend + Recovery Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue at Risk 30/60/90d Line Chart */}
          <div className="lg:col-span-2 bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6 card-hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-4 h-4 text-[#888]" />
              <h3 className="font-semibold text-[#f0ede8]">
                Revenue at Risk Trend
              </h3>
              <span className="text-xs text-[#888] ml-1">
                Weekly over 90 days
              </span>
            </div>
            {!revenueRisk?.trend?.length ? (
              <EmptyState
                variant="analytics"
                title="No revenue data"
                subtitle="Data will appear once deals are tracked"
                compact
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={revenueRisk.trend}
                    margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="grad-risk"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#555" }}
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#555" }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-[#161616] border border-[rgba(255,255,255,0.07)] rounded-lg p-3 shadow-lg text-xs">
                            <p className="font-semibold text-[#f0ede8] mb-1">
                              {label}
                            </p>
                            <p className="text-danger font-medium">
                              {formatCurrency(payload[0]?.value ?? 0)} at risk
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalAtRisk"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* Summary pills */}
                <div className="flex gap-3 mt-4 flex-wrap">
                  {[
                    { label: "30d avg", value: revenueRisk.summary?.last30d },
                    { label: "60d avg", value: revenueRisk.summary?.last60d },
                    { label: "90d avg", value: revenueRisk.summary?.last90d },
                    {
                      label: "Current",
                      value: revenueRisk.summary?.currentAtRisk,
                      highlight: true,
                    },
                  ].map((pill) => (
                    <div
                      key={pill.label}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        pill.highlight
                          ? "bg-red-500/10 text-danger font-semibold"
                          : "bg-[#1e1e1e] text-[#888]"
                      }`}
                    >
                      {pill.label}: {formatCurrency(pill.value ?? 0)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recovery Rate Card */}
          <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6 card-hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <RefreshCw className="w-4 h-4 text-[#888]" />
              <h3 className="font-semibold text-[#f0ede8]">
                Deal Recovery
              </h3>
            </div>
            {!recovery ? (
              <EmptyState
                variant="analytics"
                title="No recovery data"
                subtitle="Track deals to see recovery metrics"
                compact
              />
            ) : (
              <div className="space-y-6">
                {/* Big number */}
                <div className="text-center">
                  <div className="relative w-28 h-28 mx-auto mb-3">
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#1e1e1e"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(recovery.recoveryRate / 100) * 97.4} 97.4`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#f0ede8]">
                        {recovery.recoveryRate}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#888]">
                    of stale deals recovered
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Recovered",
                      value: recovery.recoveredDeals,
                      color: "text-success",
                    },
                    {
                      label: "Still at Risk",
                      value: recovery.currentAtRisk,
                      color: "text-danger",
                    },
                    {
                      label: "Ever Stale",
                      value: recovery.totalEverStale,
                      color: "text-[#888]",
                    },
                    {
                      label: "Avg Recovery",
                      value: `${recovery.avgDaysToRecover}d`,
                      color: "text-[#888]",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-[#111] rounded-lg p-3 text-center"
                    >
                      <p className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-[#555] uppercase tracking-wide mt-0.5">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Velocity + Rep Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline Velocity — time-series area chart */}
          <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#888]" />
                <h3 className="font-semibold text-[#f0ede8]">
                  Pipeline Velocity
                </h3>
                <span className="text-xs text-[#888] ml-1">
                  Deals created over time
                </span>
              </div>
              <div className="flex gap-1 bg-[#1e1e1e] rounded-lg p-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleVelocityRange(d)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                      velocityRange === d
                        ? "bg-[#2a2a2a] text-[#f0ede8]"
                        : "text-[#555] hover:text-[#f0ede8]"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            {velocity.length === 0 ? (
              <EmptyState
                variant="analytics"
                title="No velocity data"
                subtitle="Data will appear once deals are tracked"
                compact
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={velocity}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="grad-vel-total"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#e8a87c"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#e8a87c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="grad-vel-closed"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#4ade80"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#555" }}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#555" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Created"
                    stroke="#e8a87c"
                    fill="url(#grad-vel-total)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="closed"
                    name="Closed"
                    stroke="#4ade80"
                    fill="url(#grad-vel-closed)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rep Leaderboard — ranked by recovery rate with sparklines */}
          <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#888]" />
                <h3 className="font-semibold text-[#f0ede8]">
                  Rep Leaderboard
                </h3>
                <span className="text-xs text-[#888] ml-1">
                  Recovery rate
                </span>
              </div>
              <div className="flex gap-1 bg-[#1e1e1e] rounded-lg p-1">
                {[
                  { key: "all", label: "All" },
                  { key: "rep", label: "Reps" },
                  { key: "manager", label: "Mgrs" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setLeaderboardPeriod(key)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                      leaderboardPeriod === key
                        ? "bg-[#2a2a2a] text-[#f0ede8]"
                        : "text-[#555] hover:text-[#f0ede8]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {leaderboard.length === 0 ? (
              <EmptyState
                variant="analytics"
                title="No rep data"
                subtitle="Assign deals to team members to see leaderboard"
                compact
              />
            ) : (
              <div className="overflow-y-auto max-h-56 -mx-2 px-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.07)]">
                      <th className="text-left py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        #
                      </th>
                      <th className="text-left py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Rep
                      </th>
                      <th className="text-center py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Trend
                      </th>
                      <th className="text-right py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Recovery
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                    {leaderboard
                      .filter((r) =>
                        leaderboardPeriod === "all"
                          ? true
                          : r.user?.role === leaderboardPeriod,
                      )
                      .map((r, idx) => (
                        <tr
                          key={r.user?.id}
                          className="hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                        >
                          <td className="py-2 text-[#555] text-xs w-6">
                            {idx + 1}
                          </td>
                          <td className="py-2">
                            <p className="font-medium text-[#f0ede8] text-xs truncate max-w-24">
                              {r.user?.name?.split(" ")[0]}
                            </p>
                          </td>
                          <td className="py-2 text-center">
                            <LeaderboardSparkline data={r.sparkData} />
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`text-xs font-bold ${
                                r.recoveryRate >= 60
                                  ? "text-success"
                                  : r.recoveryRate >= 30
                                    ? "text-warning"
                                    : "text-danger"
                              }`}
                            >
                              {r.recoveryRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Stage Breakdown Table + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stage Breakdown */}
          <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.07)]">
              <h3 className="font-semibold text-[#f0ede8]">
                Stage Breakdown
              </h3>
            </div>
            {stages.length === 0 ? (
              <EmptyState
                variant="analytics"
                title="No stage data"
                subtitle="Create deals to see stage breakdown"
                compact
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-80 text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.07)]">
                      <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Stage
                      </th>
                      <th className="text-right px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Deals
                      </th>
                      <th className="text-right px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Value
                      </th>
                      <th className="text-right px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                        Avg Stale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                    {stages.map((s) => (
                      <tr
                        key={s.stage}
                        className="hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-[#f0ede8]">
                          {s.stage}
                        </td>
                        <td className="px-4 py-3 text-right text-[#f0ede8]">
                          {s.totalDeals}
                        </td>
                        <td className="px-4 py-3 text-right text-[#f0ede8] font-semibold">
                          {formatCurrency(s.totalRevenue)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-[#888]">
                            <Clock className="w-3.5 h-3.5" />
                            {Math.round(s.avgDaysStale ?? 0)}d
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Staleness Heatmap — Stage × Day-of-week */}
          <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.07)]">
              <h3 className="font-semibold text-[#f0ede8]">
                Staleness Heatmap
              </h3>
              <p className="text-xs text-[#888] mt-0.5">
                Stage × Day-of-week stale + critical deals
              </p>
            </div>
            {!heatmap || !heatmap.days ? (
              <EmptyState
                variant="analytics"
                title="No stale deal data"
                subtitle="Heatmap requires stale deal data"
                compact
              />
            ) : (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="text-left text-[#888] font-medium w-24"></th>
                      {heatmap.days.map((day) => (
                        <th
                          key={day}
                          className="text-center text-[#888] font-medium pb-1 px-1"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.stages.map((stage) => (
                      <tr key={stage}>
                        <td className="text-[#888] font-medium py-1 pr-2 text-xs">
                          {stage}
                        </td>
                        {heatmap.days.map((day, dayIdx) => {
                          const cell = heatmap.matrix[stage]?.[dayIdx] ?? {
                            staleCount: 0,
                            criticalCount: 0,
                            total: 0,
                          };
                          const isHovered =
                            hoverCell?.stage === stage &&
                            hoverCell?.dayIdx === dayIdx;
                          return (
                            <td
                              key={day}
                              className="text-center p-0.5 relative"
                              onMouseEnter={() =>
                                setHoverCell({ stage, day, dayIdx })
                              }
                              onMouseLeave={() => setHoverCell(null)}
                            >
                              <div
                                className={`w-full h-8 rounded flex items-center justify-center font-semibold text-xs transition-colors ${heatColor(cell.total, heatMax)}`}
                              >
                                {cell.total > 0 ? cell.total : "·"}
                              </div>
                              {isHovered && cell.total > 0 && (
                                <HeatmapTooltip
                                  stage={stage}
                                  day={day}
                                  cell={cell}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-3 mt-3 px-1">
                  <span className="text-xs text-[#555]">
                    Low
                  </span>
                  <div className="flex gap-1">
                    {[
                      "bg-yellow-500/5",
                      "bg-amber-500/10",
                      "bg-orange-500/15",
                      "bg-red-500/15",
                    ].map((c, i) => (
                      <div key={i} className={`w-4 h-3 rounded ${c}`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#555]">
                    High
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rep Performance Table */}
        <div className="bg-[#161616] rounded-xl border border-[rgba(255,255,255,0.07)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.07)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#888]" />
            <h3 className="font-semibold text-[#f0ede8]">
              Rep Performance
            </h3>
          </div>
          {reps.length === 0 ? (
            <EmptyState
              variant="analytics"
              title="No rep data"
              subtitle="Assign deals to team members"
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-80 text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.07)]">
                    <th className="text-left px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                      Rep
                    </th>
                    <th className="text-right px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                      Deals
                    </th>
                    <th className="text-right px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                      Health
                    </th>
                    <th className="text-right px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                      Stale
                    </th>
                    <th className="text-right px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#555]">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {reps.map((r) => {
                    const stale =
                      (r.byStatus?.stale ?? 0) + (r.byStatus?.critical ?? 0);
                    return (
                      <tr
                        key={r.user?.id ?? r.user?.email}
                        className="hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                      >
                        <td className="px-6 py-3">
                          <p className="font-medium text-[#f0ede8]">
                            {r.user?.name}
                          </p>
                          <p className="text-xs text-[#888]">
                            {r.user?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-[#f0ede8]">
                          {r.totalDeals}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-semibold ${r.healthScore >= 80 ? "text-success" : r.healthScore >= 50 ? "text-warning" : "text-danger"}`}
                          >
                            {r.healthScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              stale > 0
                                ? "text-danger font-semibold"
                                : "text-success"
                            }
                          >
                            {stale}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-[#f0ede8]">
                          {formatCurrency(r.totalRevenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
