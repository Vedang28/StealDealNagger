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
import { analyticsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import PageWrapper from "../components/PageWrapper";
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
  healthy: "#22c55e",
  warning: "#f59e0b",
  stale: "#ef4444",
  critical: "#dc2626",
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
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function heatColor(count, max) {
  if (max === 0 || count === 0)
    return "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600";
  const ratio = count / max;
  if (ratio > 0.7)
    return "bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200";
  if (ratio > 0.4)
    return "bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200";
  if (ratio > 0.1)
    return "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200";
  return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-dark dark:text-white mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: p.fill || p.stroke }}
          />
          <span className="text-muted dark:text-gray-400 capitalize">
            {p.name}:
          </span>
          <span className="text-dark dark:text-white font-medium">
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
  const color = data[data.length - 1] >= data[0] ? "#22c55e" : "#ef4444";
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
    <div className="absolute z-50 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-2.5 shadow-lg text-xs pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 left-1/2 min-w-32">
      <p className="font-semibold text-dark dark:text-white">
        {stage} — {day}
      </p>
      <div className="mt-1 space-y-0.5">
        <p className="text-danger">Stale: {cell.staleCount}</p>
        <p className="text-critical">Critical: {cell.criticalCount}</p>
        <p className="text-muted dark:text-gray-400">Total: {cell.total}</p>
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
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
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
  const [hoverCell, setHoverCell] = useState(null);

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">
              Analytics
            </h1>
            <p className="text-muted dark:text-gray-400 text-sm mt-1">
              Pipeline health, velocity, and team performance
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 active:scale-95"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors duration-150 active:scale-95"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            {
              icon: Briefcase,
              label: "Total Deals",
              value: totalDeals,
              color: "text-primary",
              bg: "bg-primary-light dark:bg-orange-900/30",
            },
            {
              icon: AlertTriangle,
              label: "Stale Deals",
              value: staleCount,
              color: "text-danger",
              bg: "bg-red-50 dark:bg-red-900/20",
            },
            {
              icon: TrendingDown,
              label: "Critical Deals",
              value: criticalCount,
              color: "text-critical",
              bg: "bg-red-100 dark:bg-red-900/30",
            },
            {
              icon: BarChart2,
              label: "Stale Rate",
              value: `${pct(staleCount, totalDeals || 1)}%`,
              color: "text-warning",
              bg: "bg-amber-50 dark:bg-amber-900/20",
            },
            {
              icon: DollarSign,
              label: "At-Risk Revenue",
              value: formatCurrency(pipeline?.atRiskRevenue ?? 0),
              color: "text-danger",
              bg: "bg-red-50 dark:bg-red-900/20",
            },
            {
              icon: Heart,
              label: "Recovery Rate",
              value: `${recovery?.recoveryRate ?? 0}%`,
              color: "text-success",
              bg: "bg-success-light dark:bg-green-900/20",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-5 shadow-sm card-hover-lift"
            >
              <div
                className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {value}
              </p>
              <p className="text-sm text-muted dark:text-gray-400 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Health Breakdown */}
        {Object.keys(byStatus).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm mb-8">
            <h3 className="font-semibold text-dark dark:text-white mb-4">
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
                        <span className="text-muted dark:text-gray-400">
                          {formatCurrency(data.revenue)}
                        </span>
                        <span className="font-semibold text-dark dark:text-white w-6 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-muted dark:text-gray-400" />
              <h3 className="font-semibold text-dark dark:text-white">
                Pipeline Health Trend
              </h3>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDateRange(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                    dateRange === d
                      ? "bg-white dark:bg-gray-600 text-dark dark:text-white shadow-sm"
                      : "text-muted dark:text-gray-400 hover:text-dark dark:hover:text-white"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {!hasHistoricalTrends ? (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
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
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm card-hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-4 h-4 text-muted dark:text-gray-400" />
              <h3 className="font-semibold text-dark dark:text-white">
                Revenue at Risk Trend
              </h3>
              <span className="text-xs text-muted dark:text-gray-500 ml-1">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
                            <p className="font-semibold text-dark dark:text-white mb-1">
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
                          ? "bg-red-50 dark:bg-red-900/20 text-danger font-semibold"
                          : "bg-gray-50 dark:bg-gray-700 text-muted dark:text-gray-400"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm card-hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <RefreshCw className="w-4 h-4 text-muted dark:text-gray-400" />
              <h3 className="font-semibold text-dark dark:text-white">
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
                        stroke="#e5e7eb"
                        strokeWidth="3"
                        className="dark:stroke-gray-700"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(recovery.recoveryRate / 100) * 97.4} 97.4`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-dark dark:text-white">
                        {recovery.recoveryRate}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted dark:text-gray-400">
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
                      color: "text-muted dark:text-gray-400",
                    },
                    {
                      label: "Avg Recovery",
                      value: `${recovery.avgDaysToRecover}d`,
                      color: "text-muted dark:text-gray-400",
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center"
                    >
                      <p className={`text-lg font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-muted dark:text-gray-500 uppercase tracking-wide mt-0.5">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted dark:text-gray-400" />
                <h3 className="font-semibold text-dark dark:text-white">
                  Pipeline Velocity
                </h3>
                <span className="text-xs text-muted dark:text-gray-500 ml-1">
                  Deals created over time
                </span>
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleVelocityRange(d)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 ${
                      velocityRange === d
                        ? "bg-white dark:bg-gray-600 text-dark dark:text-white shadow-sm"
                        : "text-muted dark:text-gray-400 hover:text-dark dark:hover:text-white"
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
                        stopColor="#f97316"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
                        stopColor="#22c55e"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickFormatter={(d) =>
                      new Date(d).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Created"
                    stroke="#f97316"
                    fill="url(#grad-vel-total)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="closed"
                    name="Closed"
                    stroke="#22c55e"
                    fill="url(#grad-vel-closed)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rep Leaderboard — ranked by recovery rate with sparklines */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted dark:text-gray-400" />
                <h3 className="font-semibold text-dark dark:text-white">
                  Rep Leaderboard
                </h3>
                <span className="text-xs text-muted dark:text-gray-500 ml-1">
                  Recovery rate
                </span>
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
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
                        ? "bg-white dark:bg-gray-600 text-dark dark:text-white shadow-sm"
                        : "text-muted dark:text-gray-400 hover:text-dark dark:hover:text-white"
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
                    <tr className="border-b border-border dark:border-gray-700">
                      <th className="text-left py-2 text-xs font-semibold text-muted dark:text-gray-400">
                        #
                      </th>
                      <th className="text-left py-2 text-xs font-semibold text-muted dark:text-gray-400">
                        Rep
                      </th>
                      <th className="text-center py-2 text-xs font-semibold text-muted dark:text-gray-400">
                        Trend
                      </th>
                      <th className="text-right py-2 text-xs font-semibold text-muted dark:text-gray-400">
                        Recovery
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 dark:divide-gray-700/50">
                    {leaderboard
                      .filter((r) =>
                        leaderboardPeriod === "all"
                          ? true
                          : r.user?.role === leaderboardPeriod,
                      )
                      .map((r, idx) => (
                        <tr
                          key={r.user?.id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-2 text-muted dark:text-gray-500 text-xs w-6">
                            {idx + 1}
                          </td>
                          <td className="py-2">
                            <p className="font-medium text-dark dark:text-white text-xs truncate max-w-24">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border dark:border-gray-700">
              <h3 className="font-semibold text-dark dark:text-white">
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
                    <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-border dark:border-gray-700">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Deals
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Avg Stale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-gray-700">
                    {stages.map((s) => (
                      <tr
                        key={s.stage}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-dark dark:text-white">
                          {s.stage}
                        </td>
                        <td className="px-4 py-3 text-right text-dark dark:text-gray-300">
                          {s.totalDeals}
                        </td>
                        <td className="px-4 py-3 text-right text-dark dark:text-gray-300 font-semibold">
                          {formatCurrency(s.totalRevenue)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className="flex items-center justify-end gap-1 text-muted dark:text-gray-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border dark:border-gray-700">
              <h3 className="font-semibold text-dark dark:text-white">
                Staleness Heatmap
              </h3>
              <p className="text-xs text-muted dark:text-gray-400 mt-0.5">
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
                      <th className="text-left text-muted dark:text-gray-400 font-medium w-24"></th>
                      {heatmap.days.map((day) => (
                        <th
                          key={day}
                          className="text-center text-muted dark:text-gray-400 font-medium pb-1 px-1"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.stages.map((stage) => (
                      <tr key={stage}>
                        <td className="text-muted dark:text-gray-400 font-medium py-1 pr-2 text-xs">
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
                  <span className="text-xs text-muted dark:text-gray-500">
                    Low
                  </span>
                  <div className="flex gap-1">
                    {[
                      "bg-yellow-50",
                      "bg-amber-100",
                      "bg-orange-200",
                      "bg-red-200",
                    ].map((c, i) => (
                      <div key={i} className={`w-4 h-3 rounded ${c}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted dark:text-gray-500">
                    High
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rep Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-muted dark:text-gray-400" />
            <h3 className="font-semibold text-dark dark:text-white">
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
                  <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-border dark:border-gray-700">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                      Rep
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                      Deals
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                      Health
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                      Stale
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-gray-700">
                  {reps.map((r) => {
                    const stale =
                      (r.byStatus?.stale ?? 0) + (r.byStatus?.critical ?? 0);
                    return (
                      <tr
                        key={r.user?.id ?? r.user?.email}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <p className="font-medium text-dark dark:text-white">
                            {r.user?.name}
                          </p>
                          <p className="text-xs text-muted dark:text-gray-400">
                            {r.user?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-dark dark:text-gray-300">
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
                        <td className="px-6 py-3 text-right font-semibold text-dark dark:text-gray-300">
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
