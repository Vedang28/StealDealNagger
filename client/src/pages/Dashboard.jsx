import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dealsAPI, analyticsAPI } from "../services/api";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DealSlideOver from "../components/DealSlideOver";
import { SkeletonStatCards, SkeletonKanban } from "../components/Skeleton";
import PageWrapper from "../components/PageWrapper";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Briefcase,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Clock,
  Calendar,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Closing"];

const STATUS_BORDER = {
  healthy: "border-l-success",
  warning: "border-l-warning",
  stale: "border-l-danger",
  critical: "border-l-critical",
};

/* ── Stacked-area chart colour mapping ── */
const STATUS_COLORS = {
  healthy: "#22c55e",
  warning: "#f59e0b",
  stale: "#ef4444",
  critical: "#dc2626",
};

export default function Dashboard() {
  const { team } = useAuth();
  const [stats, setStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [trendRange, setTrendRange] = useState("30d");
  const [tableSortKey, setTableSortKey] = useState("daysStale");
  const [tableSortDir, setTableSortDir] = useState("desc");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, dealsRes, trendsRes] = await Promise.allSettled([
        dealsAPI.stats(),
        dealsAPI.list({ limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
        analyticsAPI.trends({ days: 90 }),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
      if (dealsRes.status === "fulfilled")
        setDeals(dealsRes.value.data.data.deals);
      if (trendsRes.status === "fulfilled")
        setTrends(trendsRes.value.data?.data?.trends ?? []);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── helpers ── */
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const dealsByStage = (stage) => deals.filter((d) => d.stage === stage);
  const stageValue = (stage) =>
    dealsByStage(stage).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  /* ── sparkline data from trends ── */
  const healthySparkData = trends.slice(-14).map((t) => t.healthy ?? 0);
  const staleSparkData = trends
    .slice(-14)
    .map((t) => (t.stale ?? 0) + (t.critical ?? 0));

  /* ── trend direction helpers ── */
  const calcTrend = (arr) => {
    if (arr.length < 4) return { dir: "flat", pct: "0%" };
    const mid = Math.floor(arr.length / 2);
    const first = arr.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const second =
      arr.slice(mid).reduce((a, b) => a + b, 0) / (arr.length - mid);
    if (first === 0) return { dir: "flat", pct: "0%" };
    const change = ((second - first) / first) * 100;
    return {
      dir: change > 3 ? "up" : change < -3 ? "down" : "flat",
      pct: `${Math.abs(change).toFixed(0)}%`,
    };
  };

  const healthyTrend = calcTrend(healthySparkData);
  const staleTrend = calcTrend(staleSparkData);

  /* ── trend chart filtered by range ── */
  const rangeMap = { "7d": 7, "30d": 30, "90d": 90 };
  const chartData = useMemo(
    () =>
      trends
        .slice(-(rangeMap[trendRange] ?? 30))
        .map((d) => ({ ...d, date: d.date?.slice(5) })),
    [trends, trendRange],
  );

  /* ── stale-deals table (deals that aren't healthy) ── */
  const staleDeals = useMemo(() => {
    const filtered = deals.filter((d) => d.stalenessStatus !== "healthy");
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (tableSortKey === "daysStale") {
        av = a.daysStale ?? 0;
        bv = b.daysStale ?? 0;
      } else if (tableSortKey === "amount") {
        av = Number(a.amount) || 0;
        bv = Number(b.amount) || 0;
      } else if (tableSortKey === "name") {
        av = (a.name || "").toLowerCase();
        bv = (b.name || "").toLowerCase();
        return tableSortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      } else {
        av = a[tableSortKey] ?? "";
        bv = b[tableSortKey] ?? "";
        if (typeof av === "string")
          return tableSortDir === "asc"
            ? av.localeCompare(bv)
            : bv.localeCompare(av);
      }
      return tableSortDir === "asc" ? av - bv : bv - av;
    });
  }, [deals, tableSortKey, tableSortDir]);

  const toggleSort = (key) => {
    if (tableSortKey === key) {
      setTableSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTableSortKey(key);
      setTableSortDir("desc");
    }
  };

  if (loading)
    return (
      <PageWrapper>
        <div className="px-6 py-8 max-w-none">
          <div className="mb-6">
            <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
          </div>
          <div className="mb-8">
            <SkeletonStatCards />
          </div>
          <SkeletonKanban />
        </div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <div className="px-6 py-8 max-w-none">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            Pipeline
          </h1>
          <p className="text-muted dark:text-gray-400 text-sm mt-0.5">
            {team?.name}
          </p>
        </div>

        {/* Stat Cards — with trend arrows + sparklines + pulse */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Briefcase}
            label="Total Deals"
            value={stats?.totalDeals || 0}
            color="primary"
            sparkData={trends
              .slice(-14)
              .map(
                (t) =>
                  (t.healthy ?? 0) +
                  (t.warning ?? 0) +
                  (t.stale ?? 0) +
                  (t.critical ?? 0),
              )}
          />
          <StatCard
            icon={DollarSign}
            label="Pipeline Value"
            value={formatCurrency(stats?.totalRevenue)}
            color="success"
            trend={healthyTrend.dir}
            trendLabel={healthyTrend.pct}
            sparkData={healthySparkData}
          />
          <StatCard
            icon={AlertTriangle}
            label="Stale Deals"
            value={stats?.staleDeals || 0}
            sub={stats?.staleDeals > 0 ? "Needs attention" : "All healthy"}
            color={stats?.staleDeals > 0 ? "danger" : "success"}
            pulse={stats?.staleDeals > 0}
            trend={staleTrend.dir}
            trendLabel={staleTrend.pct}
            sparkData={staleSparkData}
          />
          <StatCard
            icon={TrendingDown}
            label="Revenue at Risk"
            value={formatCurrency(stats?.staleRevenue)}
            color="warning"
          />
        </div>

        {/* ── Pipeline Health Trend Chart ── */}
        {chartData.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-5 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-dark dark:text-white">
                Pipeline Health Trend
              </h2>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                {["7d", "30d", "90d"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTrendRange(r)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      trendRange === r
                        ? "bg-white dark:bg-gray-600 text-dark dark:text-white shadow-sm"
                        : "text-muted dark:text-gray-400 hover:text-dark dark:hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  {Object.entries(STATUS_COLORS).map(([key, color]) => (
                    <linearGradient
                      key={key}
                      id={`grad-${key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop
                        offset="100%"
                        stopColor={color}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border dark:text-gray-700"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="currentColor"
                  className="text-muted"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-bg-light)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="healthy"
                  stackId="1"
                  stroke={STATUS_COLORS.healthy}
                  fill={`url(#grad-healthy)`}
                />
                <Area
                  type="monotone"
                  dataKey="warning"
                  stackId="1"
                  stroke={STATUS_COLORS.warning}
                  fill={`url(#grad-warning)`}
                />
                <Area
                  type="monotone"
                  dataKey="stale"
                  stackId="1"
                  stroke={STATUS_COLORS.stale}
                  fill={`url(#grad-stale)`}
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  stackId="1"
                  stroke={STATUS_COLORS.critical}
                  fill={`url(#grad-critical)`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Kanban Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage(stage);
            return (
              <div
                key={stage}
                className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-3 flex flex-col gap-3"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h3 className="text-sm font-semibold text-dark dark:text-white">
                      {stage}
                    </h3>
                    <p className="text-xs text-muted dark:text-gray-400 mt-0.5">
                      {stageDeals.length} deal
                      {stageDeals.length !== 1 ? "s" : ""} &middot;{" "}
                      {formatCurrency(stageValue(stage))}
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-600 text-dark dark:text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
                  {stageDeals.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-dashed border-border dark:border-gray-600 py-8 text-center">
                      <Briefcase className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                      <p className="text-xs text-muted dark:text-gray-400">
                        No deals
                      </p>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => setSelectedDealId(deal.id)}
                        className={`w-full text-left bg-white dark:bg-gray-800 rounded-lg border-l-4 shadow-sm p-3.5 hover:shadow-md transition-shadow cursor-pointer ${
                          STATUS_BORDER[deal.stalenessStatus] ||
                          "border-l-gray-200"
                        }`}
                      >
                        <p className="text-sm font-semibold text-dark dark:text-white truncate leading-snug">
                          {deal.name}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-semibold text-dark dark:text-white">
                            {formatCurrency(deal.amount)}
                          </span>
                          <StatusBadge status={deal.stalenessStatus} />
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {deal.daysStale}d stale
                          </span>
                          {deal.lastActivityAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(deal.lastActivityAt)}
                            </span>
                          )}
                        </div>
                        {deal.contactName && (
                          <p className="text-xs text-muted dark:text-gray-400 mt-1.5 truncate">
                            {deal.contactName}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stale Deals Table ── */}
        {staleDeals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border dark:border-gray-700">
              <h2 className="text-sm font-semibold text-dark dark:text-white">
                Stale Deals — Needs Attention ({staleDeals.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                    {[
                      { key: "name", label: "Deal" },
                      { key: "stage", label: "Stage" },
                      { key: "amount", label: "Value" },
                      { key: "stalenessStatus", label: "Status" },
                      { key: "daysStale", label: "Days Stale" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="text-left px-5 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-dark dark:hover:text-white transition-colors"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown
                            className={`w-3 h-3 ${tableSortKey === col.key ? "text-primary" : "opacity-30"}`}
                          />
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-gray-700">
                  {staleDeals.slice(0, 10).map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-dark dark:text-white">
                        {deal.name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-text dark:text-gray-300">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-dark dark:text-white">
                        {formatCurrency(deal.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={deal.stalenessStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-sm text-muted dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {deal.daysStale}d
                        </span>
                      </td>
                      <td
                        className="px-4 py-3.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/deals/${deal.id}`}
                          className="p-1.5 rounded-lg text-muted dark:text-gray-400 hover:text-primary hover:bg-primary-light transition-colors inline-flex"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {staleDeals.length > 10 && (
              <div className="px-5 py-3 border-t border-border dark:border-gray-700 text-center">
                <Link
                  to="/deals?status=stale"
                  className="text-sm text-primary hover:text-primary-hover font-medium"
                >
                  View all {staleDeals.length} stale deals →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Slide-Over */}
        <DealSlideOver
          dealId={selectedDealId}
          onClose={() => setSelectedDealId(null)}
          onUpdate={loadData}
        />
      </div>
    </PageWrapper>
  );
}
