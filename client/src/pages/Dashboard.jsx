import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dealsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Briefcase,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  const { team } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDeals, setRecentDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, dealsRes] = await Promise.all([
        dealsAPI.stats(),
        dealsAPI.list({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
      ]);
      setStats(statsRes.data.data);
      setRecentDeals(dealsRes.data.data.deals);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
        <p className="text-muted text-sm mt-1">
          {team?.name} — Pipeline Overview
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Briefcase}
          label="Total Deals"
          value={stats?.totalDeals || 0}
          color="primary"
        />
        <StatCard
          icon={DollarSign}
          label="Pipeline Value"
          value={formatCurrency(stats?.totalRevenue)}
          color="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Stale Deals"
          value={stats?.staleDeals || 0}
          sub={stats?.staleDeals > 0 ? "Needs attention" : "All healthy"}
          color={stats?.staleDeals > 0 ? "danger" : "success"}
        />
        <StatCard
          icon={TrendingDown}
          label="Revenue at Risk"
          value={formatCurrency(stats?.staleRevenue)}
          color="warning"
        />
      </div>

      {/* Status Breakdown + Recent Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-dark mb-4">
            Deal Health Breakdown
          </h3>
          <div className="space-y-4">
            {["healthy", "warning", "stale", "critical"].map((status) => {
              const data = stats?.byStatus?.[status];
              const count = data?.count || 0;
              const total = stats?.totalDeals || 1;
              const pct = Math.round((count / total) * 100);

              const barColors = {
                healthy: "bg-success",
                warning: "bg-warning",
                stale: "bg-danger",
                critical: "bg-critical",
              };

              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1">
                    <StatusBadge status={status} />
                    <span className="text-sm font-semibold text-dark">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${barColors[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Deals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark">Recent Deals</h3>
            <Link
              to="/deals"
              className="text-primary text-sm font-medium hover:text-primary-hover flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentDeals.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-muted text-sm">No deals yet</p>
              <Link
                to="/deals/new"
                className="text-primary text-sm font-medium hover:text-primary-hover mt-1 inline-block"
              >
                Create your first deal
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeals.map((deal) => (
                <Link
                  key={deal.id}
                  to={`/deals/${deal.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-dark truncate group-hover:text-primary transition-colors">
                        {deal.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{deal.stage}</span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {deal.daysStale}d stale
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-semibold text-dark">
                      {formatCurrency(deal.amount)}
                    </span>
                    <StatusBadge status={deal.stalenessStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
