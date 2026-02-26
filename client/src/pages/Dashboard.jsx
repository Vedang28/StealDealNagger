import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { dealsAPI } from "../services/api";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import DealSlideOver from "../components/DealSlideOver";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  Briefcase,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Clock,
  Calendar,
} from "lucide-react";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Closing"];

const STATUS_BORDER = {
  healthy: "border-l-success",
  warning: "border-l-warning",
  stale: "border-l-danger",
  critical: "border-l-critical",
};

export default function Dashboard() {
  const { team } = useAuth();
  const [stats, setStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealId, setSelectedDealId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, dealsRes] = await Promise.allSettled([
        dealsAPI.stats(),
        dealsAPI.list({ limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data.data);
      if (dealsRes.status === "fulfilled") setDeals(dealsRes.value.data.data.deals);
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

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  return (
    <div className="px-6 py-8 max-w-none">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Pipeline</h1>
        <p className="text-muted text-sm mt-0.5">{team?.name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage(stage);
          return (
            <div key={stage} className="bg-gray-100 rounded-xl p-3 flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-sm font-semibold text-dark">{stage}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""} &middot;{" "}
                    {formatCurrency(stageValue(stage))}
                  </p>
                </div>
                <span className="w-6 h-6 rounded-full bg-white text-dark text-xs font-bold flex items-center justify-center shadow-sm">
                  {stageDeals.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
                {stageDeals.length === 0 ? (
                  <div className="bg-white rounded-lg border border-dashed border-border py-8 text-center">
                    <Briefcase className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-xs text-muted">No deals</p>
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className={`w-full text-left bg-white rounded-lg border-l-4 shadow-sm p-3.5 hover:shadow-md transition-shadow cursor-pointer ${
                        STATUS_BORDER[deal.stalenessStatus] || "border-l-gray-200"
                      }`}
                    >
                      <p className="text-sm font-semibold text-dark truncate leading-snug">
                        {deal.name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-dark">
                          {formatCurrency(deal.amount)}
                        </span>
                        <StatusBadge status={deal.stalenessStatus} />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
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
                        <p className="text-xs text-muted mt-1.5 truncate">{deal.contactName}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-Over */}
      <DealSlideOver
        dealId={selectedDealId}
        onClose={() => setSelectedDealId(null)}
        onUpdate={loadData}
      />
    </div>
  );
}
