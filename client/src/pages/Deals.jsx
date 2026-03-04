import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { dealsAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import { SkeletonTable } from "../components/Skeleton";
import DealSlideOver from "../components/DealSlideOver";
import PageWrapper from "../components/PageWrapper";
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
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">
              Deals
            </h1>
            <p className="text-muted dark:text-gray-400 text-sm mt-1">
              {pagination.total ?? 0} deals in pipeline
            </p>
          </div>
          <Link
            to="/deals/new"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted dark:text-gray-400">
              <Filter className="w-4 h-4" />
              Filters
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-50">
              <Search className="w-4 h-4 text-muted dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Search deals..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm text-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            {/* Status filter */}
            <select
              value={status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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
              className="px-3 py-2 rounded-lg border border-border bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={8} cols={6} />
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-muted dark:text-gray-400 font-medium">
                No deals found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try adjusting your filters or create a new deal
              </p>
            </div>
          ) : (
            <>
              {/* Mobile card list (hidden on sm+) */}
              <div className="sm:hidden divide-y divide-border dark:divide-gray-700">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className="px-4 py-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-dark dark:text-white text-sm leading-snug">
                        {deal.name}
                      </p>
                      <StatusBadge status={deal.stalenessStatus} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted dark:text-gray-400">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {deal.stage}
                      </span>
                      <span className="font-semibold text-dark dark:text-white">
                        {formatCurrency(deal.amount)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {deal.daysStale}d stale
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Deal
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Days Stale
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-gray-700">
                    {deals.map((deal) => (
                      <tr
                        key={deal.id}
                        onClick={() => setSelectedDealId(deal.id)}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-dark dark:text-white">
                                {deal.name}
                              </p>
                              <p className="text-xs text-muted dark:text-gray-400">
                                {deal.crmSource}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-text dark:text-gray-300">
                            {deal.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-dark dark:text-white">
                          {formatCurrency(deal.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={deal.stalenessStatus} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1 text-sm text-muted dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            {deal.daysStale}d
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted dark:text-gray-400">
                          {formatDate(deal.lastActivityAt)}
                        </td>
                        <td
                          className="px-4 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/deals/${deal.id}`}
                            title="View full details"
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border dark:border-gray-700">
                  <p className="text-sm text-muted dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} deals)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateFilter("page", Math.max(1, page - 1).toString())
                      }
                      disabled={page <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border dark:border-gray-700 text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border dark:border-gray-700 text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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
    </PageWrapper>
  );
}
