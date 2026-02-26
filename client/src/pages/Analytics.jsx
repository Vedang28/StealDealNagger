import { useState, useEffect } from "react";
import { analyticsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  BarChart2,
  Briefcase,
  AlertTriangle,
  TrendingDown,
  Users,
  Clock,
} from "lucide-react";

export default function Analytics() {
  const [pipeline, setPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [reps, setReps] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.pipeline(),
      analyticsAPI.stages(),
      analyticsAPI.reps(),
      analyticsAPI.trends(),
    ])
      .then(([pRes, sRes, rRes, tRes]) => {
        setPipeline(pRes.data.data);
        setStages(sRes.data.data ?? []);
        setReps(rRes.data.data ?? []);
        setTrends(tRes.data.data);
      })
      .catch((err) => console.error("Failed to load analytics", err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

  if (loading) return <LoadingSpinner size="lg" text="Loading analytics..." />;

  // API returns the health object directly (no .summary/.health wrappers)
  // Shape: { totalDeals, totalRevenue, atRiskDeals, atRiskRevenue, healthScore, byStatus: { healthy, warning, stale, critical } }
  const totalDeals = pipeline?.totalDeals ?? 0;
  const byStatus = pipeline?.byStatus ?? {};
  const staleCount = byStatus.stale?.count ?? 0;
  const criticalCount = byStatus.critical?.count ?? 0;

  // trends shape: { trend: [...], current: {...}, note: string }
  const hasHistoricalTrends = trends?.trend?.filter((t) => t.healthy !== null).length > 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Analytics</h1>
        <p className="text-muted text-sm mt-1">Pipeline health and team performance</p>
      </div>

      {/* Pipeline Health cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: Briefcase,
            label: "Total Deals",
            value: totalDeals,
            color: "text-primary",
            bg: "bg-primary-light",
          },
          {
            icon: AlertTriangle,
            label: "Stale Deals",
            value: staleCount,
            color: "text-danger",
            bg: "bg-red-50",
          },
          {
            icon: TrendingDown,
            label: "Critical Deals",
            value: criticalCount,
            color: "text-critical",
            bg: "bg-red-100",
          },
          {
            icon: BarChart2,
            label: "Stale Rate",
            value: `${pct(staleCount, totalDeals || 1)}%`,
            color: "text-warning",
            bg: "bg-amber-50",
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-dark">{value}</p>
            <p className="text-sm text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Health breakdown */}
      {Object.keys(byStatus).length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm mb-8">
          <h3 className="font-semibold text-dark mb-4">Deal Health Breakdown</h3>
          <div className="space-y-4">
            {["healthy", "warning", "stale", "critical"].map((s) => {
              const data = byStatus[s] ?? {};
              const count = data.count ?? 0;
              const total = totalDeals || 1;
              const p = pct(count, total);
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
                      <span className="text-muted">{formatCurrency(data.revenue)}</span>
                      <span className="font-semibold text-dark w-6 text-right">{count}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stage Breakdown */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-dark">Stage Breakdown</h3>
          </div>
          {stages.length === 0 ? (
            <p className="text-sm text-muted px-6 py-8 text-center">No stage data available</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Stage</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Deals</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Value</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Avg Stale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stages.map((s) => (
                  <tr key={s.stage} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-dark">{s.stage}</td>
                    <td className="px-4 py-3 text-right text-dark">{s.totalDeals}</td>
                    <td className="px-4 py-3 text-right text-dark font-semibold">{formatCurrency(s.totalRevenue)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="flex items-center justify-end gap-1 text-muted">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.round(s.avgDaysStale ?? 0)}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Rep Performance */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-muted" />
            <h3 className="font-semibold text-dark">Rep Performance</h3>
          </div>
          {reps.length === 0 ? (
            <p className="text-sm text-muted px-6 py-8 text-center">No rep data available</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Rep</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Deals</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Stale</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reps.map((r) => {
                  const stale = r.byStatus?.stale ?? 0;
                  return (
                    <tr key={r.user?.id ?? r.user?.email} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium text-dark">{r.user?.name}</p>
                          <p className="text-xs text-muted">{r.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-dark">{r.totalDeals}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={stale > 0 ? "text-danger font-semibold" : "text-success"}>
                          {stale}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-dark">{formatCurrency(r.totalRevenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-muted" />
          <h3 className="font-semibold text-dark">Trends</h3>
        </div>
        {!hasHistoricalTrends ? (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Trend data builds over time as the staleness engine runs daily snapshots.
              Check back after the first scheduled run to see historical comparisons.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {trends.trend
              .filter((t) => t.healthy !== null)
              .slice(-7)
              .map((snap, i) => (
                <div key={i} className="flex items-center gap-4 text-sm py-2 border-b border-border last:border-0">
                  <span className="text-muted w-28 shrink-0">
                    {new Date(snap.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-dark">
                    {(snap.healthy ?? 0) + (snap.warning ?? 0) + (snap.stale ?? 0) + (snap.critical ?? 0)} deals
                  </span>
                  <span className="text-danger">{snap.stale ?? 0} stale</span>
                  <span className="text-critical">{snap.critical ?? 0} critical</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
