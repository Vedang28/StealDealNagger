import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { dealsAPI, teamAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { SkeletonTable } from "../components/Skeleton";
import DealSlideOver from "../components/DealSlideOver";
import PageWrapper from "../components/PageWrapper";
import EmptyState from "../components/EmptyState";
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  ExternalLink,
  ArrowUpDown,
  CheckSquare,
  Square,
  BellOff,
  Trash2,
  X,
  UserRoundX,
  Users,
} from "lucide-react";

export default function Deals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDealId, setSelectedDealId] = useState(null);

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Bulk selection
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  // Filters from URL
  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";
  const stage = searchParams.get("stage") || "";
  const search = searchParams.get("search") || "";

  useEffect(() => {
    loadDeals();
  }, [page, status, stage, search, sortBy, sortOrder]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sortBy,
        sortOrder,
      };
      if (status) params.status = status;
      if (stage) params.stage = stage;
      if (search) params.search = search;

      const res = await dealsAPI.list(params);
      setDeals(res.data.data.deals);
      setPagination(res.data.data.pagination);
      setSelected(new Set());
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

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("desc");
    }
  };

  const toggleSelectAll = () => {
    if (selected.size === deals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(deals.map((d) => d.id)));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkSnooze = async (days) => {
    setBulkLoading(true);
    const until = new Date();
    until.setDate(until.getDate() + days);
    let ok = 0;
    for (const id of selected) {
      try {
        await dealsAPI.snooze(id, {
          snoozedUntil: until.toISOString(),
          snoozeReason: `Bulk snooze ${days}d`,
        });
        ok++;
      } catch {
        /* skip */
      }
    }
    toast.success(`Snoozed ${ok} deal${ok !== 1 ? "s" : ""} for ${days} days`);
    setBulkLoading(false);
    setSelected(new Set());
    loadDeals();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} deal(s)? This cannot be undone.`))
      return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      try {
        await dealsAPI.remove(id);
        ok++;
      } catch {
        /* skip */
      }
    }
    toast.success(`Deleted ${ok} deal${ok !== 1 ? "s" : ""}`);
    setBulkLoading(false);
    setSelected(new Set());
    loadDeals();
  };

  const handleBulkMarkLost = async () => {
    if (!confirm(`Mark ${selected.size} deal(s) as lost?`)) return;
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      try {
        await dealsAPI.update(id, { stage: "Closed Lost" });
        ok++;
      } catch {
        /* skip */
      }
    }
    toast.success(`Marked ${ok} deal${ok !== 1 ? "s" : ""} as lost`);
    setBulkLoading(false);
    setSelected(new Set());
    loadDeals();
  };

  const openReassignDropdown = async () => {
    if (teamMembers.length === 0) {
      try {
        const res = await teamAPI.getMembers();
        setTeamMembers(res.data?.data?.members ?? []);
      } catch {
        toast.error("Failed to load team members");
        return;
      }
    }
    setShowReassign((v) => !v);
  };

  const handleBulkReassign = async (userId) => {
    setShowReassign(false);
    setBulkLoading(true);
    let ok = 0;
    for (const id of selected) {
      try {
        await dealsAPI.update(id, { ownerId: userId });
        ok++;
      } catch {
        /* skip */
      }
    }
    const member = teamMembers.find((m) => m.id === userId);
    toast.success(
      `Reassigned ${ok} deal${ok !== 1 ? "s" : ""} to ${member?.name || "team member"}`,
    );
    setBulkLoading(false);
    setSelected(new Set());
    loadDeals();
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

  const SORT_COLS = [
    { key: "name", label: "Deal" },
    { key: "stage", label: "Stage" },
    { key: "amount", label: "Value" },
    { key: "stalenessStatus", label: "Status" },
    { key: "daysStale", label: "Days Stale" },
    { key: "lastActivityAt", label: "Last Activity" },
  ];

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

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xl p-3 mb-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckSquare className="w-4 h-4" />
              {selected.size} deal{selected.size !== 1 ? "s" : ""} selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkSnooze(3)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-50"
              >
                <BellOff className="w-3.5 h-3.5" /> Snooze 3d
              </button>
              <button
                onClick={() => handleBulkSnooze(7)}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors disabled:opacity-50"
              >
                <BellOff className="w-3.5 h-3.5" /> Snooze 7d
              </button>
              <div className="relative">
                <button
                  onClick={openReassignDropdown}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-50"
                >
                  <Users className="w-3.5 h-3.5" /> Reassign
                </button>
                {showReassign && teamMembers.length > 0 && (
                  <div className="absolute top-full mt-1 right-0 w-52 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
                    {teamMembers
                      .filter((m) => m.isActive)
                      .map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleBulkReassign(m.id)}
                          className="w-full text-left px-3 py-2 text-xs text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {m.name}{" "}
                          <span className="text-muted dark:text-gray-400">
                            ({m.role})
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleBulkMarkLost}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors disabled:opacity-50"
              >
                <UserRoundX className="w-3.5 h-3.5" /> Mark Lost
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                onClick={() => {
                  setSelected(new Set());
                  setShowReassign(false);
                }}
                className="p-1.5 rounded-lg text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={8} cols={6} />
            </div>
          ) : deals.length === 0 ? (
            <EmptyState
              variant="deals"
              title="No deals found"
              subtitle="Try adjusting your filters or create a new deal"
              actionLabel="Create Deal"
              actionTo="/deals/new"
            />
          ) : (
            <>
              {/* Mobile card list (hidden on sm+) */}
              <div className="sm:hidden divide-y divide-border dark:divide-gray-700">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="px-4 py-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(deal.id);
                        }}
                        className="mt-0.5 text-muted dark:text-gray-400 hover:text-primary transition-colors shrink-0"
                      >
                        {selected.has(deal.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => setSelectedDealId(deal.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-dark dark:text-white text-sm leading-snug">
                            {deal.name}
                          </p>
                          <StatusBadge status={deal.stalenessStatus} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted dark:text-gray-400 mt-1">
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table (hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      {/* Select-all checkbox */}
                      <th className="w-12 px-4 py-3">
                        <button
                          onClick={toggleSelectAll}
                          className="text-muted dark:text-gray-400 hover:text-primary transition-colors"
                        >
                          {selected.size === deals.length &&
                          deals.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      {SORT_COLS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col.key)}
                          className="text-left px-6 py-3 text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-dark dark:hover:text-white transition-colors group"
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {sortBy === col.key ? (
                              <span className="text-primary">
                                {sortOrder === "asc" ? "↑" : "↓"}
                              </span>
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                            )}
                          </span>
                        </th>
                      ))}
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-gray-700">
                    {deals.map((deal) => (
                      <tr
                        key={deal.id}
                        className={`hover:bg-gray-50/80 dark:hover:bg-gray-700 transition-colors cursor-pointer ${selected.has(deal.id) ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                      >
                        {/* Row checkbox */}
                        <td
                          className="w-12 px-4 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleSelect(deal.id)}
                            className="text-muted dark:text-gray-400 hover:text-primary transition-colors"
                          >
                            {selected.has(deal.id) ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4"
                          onClick={() => setSelectedDealId(deal.id)}
                        >
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
                        <td
                          className="px-6 py-4"
                          onClick={() => setSelectedDealId(deal.id)}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-text dark:text-gray-300">
                            {deal.stage}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-semibold text-dark dark:text-white"
                          onClick={() => setSelectedDealId(deal.id)}
                        >
                          {formatCurrency(deal.amount)}
                        </td>
                        <td
                          className="px-6 py-4"
                          onClick={() => setSelectedDealId(deal.id)}
                        >
                          <StatusBadge status={deal.stalenessStatus} />
                        </td>
                        <td
                          className="px-6 py-4"
                          onClick={() => setSelectedDealId(deal.id)}
                        >
                          <span className="flex items-center gap-1 text-sm text-muted dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            {deal.daysStale}d
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-muted dark:text-gray-400"
                          onClick={() => setSelectedDealId(deal.id)}
                        >
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
