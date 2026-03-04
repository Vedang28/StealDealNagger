import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend,
} from "recharts";
import { analyticsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import PageWrapper from "../components/PageWrapper";
import { SkeletonStatCards, SkeletonTable } from "../components/Skeleton";
import {
  BarChart2, Briefcase, AlertTriangle, TrendingDown, Users, Clock, Download,
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
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function repBarColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function heatColor(count, max) {
  if (max === 0 || count === 0) return "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600";
  const ratio = count / max;
  if (ratio > 0.7) return "bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200";
  if (ratio > 0.4) return "bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200";
  if (ratio > 0.1) return "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200";
  return "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-dark dark:text-white mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.fill || p.stroke }} />
          <span className="text-muted dark:text-gray-400 capitalize">{p.name}:</span>
          <span className="text-dark dark:text-white font-medium">{p.value}</span>
        </div>
      ))}
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
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  const loadTrends = useCallback((days) => {
    analyticsAPI.trends({ days }).then((r) => setTrends(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      analyticsAPI.pipeline(),
      analyticsAPI.stages(),
      analyticsAPI.reps(),
      analyticsAPI.trends({ days: dateRange }),
      analyticsAPI.velocity(),
      analyticsAPI.heatmap(),
    ])
      .then(([pRes, sRes, rRes, tRes, vRes, hRes]) => {
        setPipeline(pRes.data.data);
        setStages(sRes.data.data ?? []);
        setReps(rRes.data.data ?? []);
        setTrends(tRes.data.data);
        setVelocity(vRes.data.data ?? []);
        setHeatmap(hRes.data.data);
      })
      .catch((err) => console.error("Failed to load analytics", err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDateRange(days) {
    setDateRange(days);
    loadTrends(days);
  }

  function exportCSV() {
    const rows = [
      ["Stage Analytics"],
      ["Stage", "Total Deals", "Avg Days Stale", "Total Revenue", "Healthy", "Warning", "Stale", "Critical"],
      ...stages.map((s) => [
        s.stage, s.totalDeals, Math.round(s.avgDaysStale ?? 0),
        Number(s.totalRevenue).toFixed(2),
        s.byStatus?.healthy ?? 0, s.byStatus?.warning ?? 0,
        s.byStatus?.stale ?? 0, s.byStatus?.critical ?? 0,
      ]),
      [],
      ["Rep Performance"],
      ["Rep", "Email", "Total Deals", "Health Score %", "At-Risk Deals", "Total Revenue"],
      ...reps.map((r) => [
        r.user?.name, r.user?.email, r.totalDeals,
        r.healthScore, r.atRiskDeals, Number(r.totalRevenue).toFixed(2),
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
  const hasHistoricalTrends = trends?.trend?.filter((t) => t.healthy !== null).length > 1;
  const trendChartData = trends?.trend?.filter((t) => t.healthy !== null) ?? [];

  // Heatmap max for color scaling
  const heatMax = heatmap
    ? Math.max(1, ...Object.values(heatmap.matrix).flatMap((repMap) =>
        Object.values(repMap).map((cell) => cell.total)
      ))
    : 1;

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Analytics</h1>
            <p className="text-muted dark:text-gray-400 text-sm mt-1">
              Pipeline health, velocity, and team performance
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Briefcase, label: "Total Deals", value: totalDeals, color: "text-primary", bg: "bg-primary-light dark:bg-orange-900/30" },
            { icon: AlertTriangle, label: "Stale Deals", value: staleCount, color: "text-danger", bg: "bg-red-50 dark:bg-red-900/20" },
            { icon: TrendingDown, label: "Critical Deals", value: criticalCount, color: "text-critical", bg: "bg-red-100 dark:bg-red-900/30" },
            { icon: BarChart2, label: "Stale Rate", value: `${pct(staleCount, totalDeals || 1)}%`, color: "text-warning", bg: "bg-amber-50 dark:bg-amber-900/20" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-dark dark:text-white">{value}</p>
              <p className="text-sm text-muted dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Health Breakdown */}
        {Object.keys(byStatus).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm mb-8">
            <h3 className="font-semibold text-dark dark:text-white mb-4">Deal Health Breakdown</h3>
            <div className="space-y-4">
              {["healthy", "warning", "stale", "critical"].map((s) => {
                const data = byStatus[s] ?? {};
                const count = data.count ?? 0;
                const p = pct(count, totalDeals || 1);
                const barColors = { healthy: "bg-success", warning: "bg-warning", stale: "bg-danger", critical: "bg-critical" };
                return (
                  <div key={s}>
                    <div className="flex justify-between items-center mb-1">
                      <StatusBadge status={s} />
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted dark:text-gray-400">{formatCurrency(data.revenue)}</span>
                        <span className="font-semibold text-dark dark:text-white w-6 text-right">{count}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${barColors[s]}`} style={{ width: `${p}%` }} />
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
              <h3 className="font-semibold text-dark dark:text-white">Pipeline Health Trend</h3>
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
                Historical data accumulates as the staleness engine runs. Check back after it has run for a few days to see trend charts.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {Object.entries(CHART_COLORS).map(([k, c]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                {["healthy", "warning", "stale", "critical"].map((k) => (
                  <Area key={k} type="monotone" dataKey={k} stackId="1"
                    stroke={CHART_COLORS[k]} fill={`url(#grad-${k})`}
                    strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline Velocity + Rep Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline Velocity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-muted dark:text-gray-400" />
              <h3 className="font-semibold text-dark dark:text-white">Pipeline Velocity</h3>
              <span className="text-xs text-muted dark:text-gray-500 ml-1">Avg days stale vs benchmark</span>
            </div>
            {velocity.length === 0 ? (
              <p className="text-sm text-muted dark:text-gray-400 text-center py-8">No velocity data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={velocity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Bar dataKey="avgDaysStale" name="Avg Days Stale" radius={[4, 4, 0, 0]}>
                    {velocity.map((entry) => (
                      <Cell
                        key={entry.stage}
                        fill={
                          entry.avgDaysStale > entry.benchmark
                            ? "#ef4444"
                            : entry.avgDaysStale > entry.benchmark * 0.7
                            ? "#f59e0b"
                            : "#22c55e"
                        }
                      />
                    ))}
                  </Bar>
                  <ReferenceLine
                    y={velocity[0]?.benchmark}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{ value: "Benchmark", position: "insideTopRight", fontSize: 10, fill: "#94a3b8" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rep Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-muted dark:text-gray-400" />
              <h3 className="font-semibold text-dark dark:text-white">Rep Leaderboard</h3>
              <span className="text-xs text-muted dark:text-gray-500 ml-1">Health score %</span>
            </div>
            {reps.filter((r) => r.totalDeals > 0).length === 0 ? (
              <p className="text-sm text-muted dark:text-gray-400 text-center py-8">No rep data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={reps.filter((r) => r.totalDeals > 0).map((r) => ({
                    name: r.user?.name?.split(" ")[0] ?? "Rep",
                    score: r.healthScore,
                    deals: r.totalDeals,
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }}
                    tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Health %" radius={[0, 4, 4, 0]}>
                    {reps.filter((r) => r.totalDeals > 0).map((r) => (
                      <Cell key={r.user?.id} fill={repBarColor(r.healthScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stage Breakdown Table + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Stage Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border dark:border-gray-700">
              <h3 className="font-semibold text-dark dark:text-white">Stage Breakdown</h3>
            </div>
            {stages.length === 0 ? (
              <p className="text-sm text-muted dark:text-gray-400 px-6 py-8 text-center">No stage data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-80 text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-border dark:border-gray-700">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Stage</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Deals</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Value</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Avg Stale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-gray-700">
                    {stages.map((s) => (
                      <tr key={s.stage} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-3 font-medium text-dark dark:text-white">{s.stage}</td>
                        <td className="px-4 py-3 text-right text-dark dark:text-gray-300">{s.totalDeals}</td>
                        <td className="px-4 py-3 text-right text-dark dark:text-gray-300 font-semibold">{formatCurrency(s.totalRevenue)}</td>
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

          {/* Staleness Heatmap */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border dark:border-gray-700">
              <h3 className="font-semibold text-dark dark:text-white">Staleness Heatmap</h3>
              <p className="text-xs text-muted dark:text-gray-400 mt-0.5">Stage × Rep stale + critical deals</p>
            </div>
            {!heatmap || heatmap.reps.length === 0 ? (
              <p className="text-sm text-muted dark:text-gray-400 px-6 py-8 text-center">No stale deal data available</p>
            ) : (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="text-left text-muted dark:text-gray-400 font-medium w-24"></th>
                      {heatmap.reps.map((rep) => (
                        <th key={rep.id} className="text-center text-muted dark:text-gray-400 font-medium pb-1 px-1">
                          <span className="truncate block max-w-16">{rep.name?.split(" ")[0]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.stages.map((stage) => (
                      <tr key={stage}>
                        <td className="text-muted dark:text-gray-400 font-medium py-1 pr-2 text-xs">{stage}</td>
                        {heatmap.reps.map((rep) => {
                          const cell = heatmap.matrix[stage]?.[rep.id] ?? { total: 0 };
                          return (
                            <td key={rep.id} className="text-center p-0.5" title={`${stage} / ${rep.name}: ${cell.total} stale`}>
                              <div className={`w-full h-8 rounded flex items-center justify-center font-semibold text-xs transition-colors ${heatColor(cell.total, heatMax)}`}>
                                {cell.total > 0 ? cell.total : "·"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-3 mt-3 px-1">
                  <span className="text-xs text-muted dark:text-gray-500">Low</span>
                  <div className="flex gap-1">
                    {["bg-yellow-50", "bg-amber-100", "bg-orange-200", "bg-red-200"].map((c, i) => (
                      <div key={i} className={`w-4 h-3 rounded ${c}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted dark:text-gray-500">High</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rep Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-muted dark:text-gray-400" />
            <h3 className="font-semibold text-dark dark:text-white">Rep Performance</h3>
          </div>
          {reps.length === 0 ? (
            <p className="text-sm text-muted dark:text-gray-400 px-6 py-8 text-center">No rep data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-80 text-sm">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-border dark:border-gray-700">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Rep</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Deals</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Health</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Stale</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-gray-700">
                  {reps.map((r) => {
                    const stale = (r.byStatus?.stale ?? 0) + (r.byStatus?.critical ?? 0);
                    return (
                      <tr key={r.user?.id ?? r.user?.email} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium text-dark dark:text-white">{r.user?.name}</p>
                          <p className="text-xs text-muted dark:text-gray-400">{r.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-dark dark:text-gray-300">{r.totalDeals}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${r.healthScore >= 80 ? "text-success" : r.healthScore >= 50 ? "text-warning" : "text-danger"}`}>
                            {r.healthScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={stale > 0 ? "text-danger font-semibold" : "text-success"}>{stale}</span>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-dark dark:text-gray-300">{formatCurrency(r.totalRevenue)}</td>
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
