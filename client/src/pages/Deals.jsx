import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { dealsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import DealSlideOver from "../components/DealSlideOver";
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  ExternalLink,
} from "lucide-react";

export default function Deals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDealId, setSelectedDealId] = useState(null);

  // Filters from URL
  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";
  const stage = searchParams.get("stage") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    loadDeals();
  }, [page, status, stage, search]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      if (status) params.status = status;
      if (stage) params.stage = stage;
      if (search) params.search = search;

      const res = await dealsAPI.list(params);
      setDeals(res.data.data.deals);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error("Failed to load deals", err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Deals</h1>
          <p className="text-muted text-sm mt-1">
            {pagination.total ?? 0} deals in pipeline
          </p>
        </div>
        <Link
          to="/deals/new"
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Filter className="w-4 h-4" />
            Filters
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-50">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Search deals..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="stale">Stale</option>
            <option value="critical">Critical</option>
          </select>

          {/* Stage filter */}
          <select
            value={stage}
            onChange={(e) => updateFilter("stage", e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">All Stages</option>
            <option value="Discovery">Discovery</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closing">Closing</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading deals..." />
        ) : deals.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted font-medium">No deals found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or create a new deal
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Deal
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Value
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Days Stale
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark">
                              {deal.name}
                            </p>
                            <p className="text-xs text-muted">
                              {deal.crmSource}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 text-xs font-medium text-gray-text">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-dark">
                        {formatCurrency(deal.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={deal.stalenessStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-sm text-muted">
                          <Clock className="w-3.5 h-3.5" />
                          {deal.daysStale}d
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {formatDate(deal.lastActivityAt)}
                      </td>
                      <td
                        className="px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/deals/${deal.id}`}
                          title="View full details"
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-light transition-colors inline-flex"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} deals)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateFilter("page", Math.max(1, page - 1).toString())
                    }
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-dark hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set("page", (page + 1).toString());
                      setSearchParams(params);
                    }}
                    disabled={page >= pagination.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-dark hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Slide-Over */}
      <DealSlideOver
        dealId={selectedDealId}
        onClose={() => setSelectedDealId(null)}
        onUpdate={loadDeals}
      />
    </div>
  );
}
