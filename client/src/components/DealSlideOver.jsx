import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { dealsAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import StatusBadge from "./StatusBadge";
import LoadingSpinner from "./LoadingSpinner";
import {
  X,
  ExternalLink,
  DollarSign,
  Clock,
  Calendar,
  Briefcase,
  Edit3,
  Trash2,
  BellOff,
  Bell,
  User,
  Activity,
  AlertTriangle,
  Zap,
  Mail,
  Phone,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

/* ── Staleness Gauge ───────────────────────────────────────── */
function StalenessGauge({ daysStale, status }) {
  // Map status to a percentage (0-100) and color
  const pct = Math.min(100, Math.round((daysStale / 30) * 100));
  const colorMap = {
    healthy: { stroke: "#22c55e", bg: "#dcfce7", darkBg: "#14532d" },
    warning: { stroke: "#f59e0b", bg: "#fef3c7", darkBg: "#78350f" },
    stale: { stroke: "#f97316", bg: "#ffedd5", darkBg: "#7c2d12" },
    critical: { stroke: "#ef4444", bg: "#fee2e2", darkBg: "#7f1d1d" },
  };
  const c = colorMap[status] || colorMap.healthy;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-100 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={c.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-dark dark:text-white">
            {daysStale}d
          </span>
          <span className="text-[10px] text-muted dark:text-gray-400 uppercase tracking-wide">
            stale
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: c.stroke }}
          />
          <span className="text-sm font-semibold text-dark dark:text-white capitalize">
            {status}
          </span>
        </div>
        <p className="text-xs text-muted dark:text-gray-400">
          {status === "healthy" && "Deal is progressing well"}
          {status === "warning" && "Deal needs attention soon"}
          {status === "stale" && "Deal requires immediate action"}
          {status === "critical" && "At risk of being lost — act now"}
        </p>
      </div>
    </div>
  );
}

/* ── Suggested Actions ─────────────────────────────────────── */
function SuggestedActions({ deal }) {
  const suggestions = useMemo(() => {
    const s = [];
    if (!deal) return s;
    const days = deal.daysStale || 0;
    const st = deal.stalenessStatus;

    if (st === "critical" || st === "stale") {
      s.push({
        icon: Phone,
        text: "Schedule a call with the contact",
        color: "text-red-500 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/20",
      });
    }
    if (days > 7 && deal.contactEmail) {
      s.push({
        icon: Mail,
        text: `Follow up with ${deal.contactName || "the contact"}`,
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
      });
    }
    if (deal.stage === "Proposal" && days > 3) {
      s.push({
        icon: MessageSquare,
        text: "Send a revised proposal",
        color: "text-violet-500 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/20",
      });
    }
    if (deal.stage === "Negotiation") {
      s.push({
        icon: DollarSign,
        text: "Review pricing and terms",
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
      });
    }
    if (deal.stage === "Discovery") {
      s.push({
        icon: Zap,
        text: "Move to Proposal stage",
        color: "text-emerald-500 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
      });
    }
    if (s.length === 0) {
      s.push({
        icon: Activity,
        text: "Log a recent activity to keep this deal healthy",
        color: "text-gray-500 dark:text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-800",
      });
    }
    return s.slice(0, 3);
  }, [deal]);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5" /> Suggested Actions
      </h4>
      {suggestions.map((s, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 ${s.bg} rounded-lg px-3 py-2.5`}
        >
          <s.icon className={`w-4 h-4 shrink-0 ${s.color}`} />
          <span className="text-sm text-dark dark:text-white flex-1">
            {s.text}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted dark:text-gray-500" />
        </div>
      ))}
    </div>
  );
}

/* ── Activity Timeline ─────────────────────────────────────── */
function ActivityTimeline({ deal }) {
  const events = useMemo(() => {
    if (!deal) return [];
    const items = [];

    items.push({
      date: deal.createdAt,
      label: "Deal created",
      icon: Briefcase,
      color: "text-blue-500",
      dotColor: "bg-blue-500",
    });

    if (deal.lastActivityAt && deal.lastActivityAt !== deal.createdAt) {
      items.push({
        date: deal.lastActivityAt,
        label: "Last activity recorded",
        icon: Activity,
        color: "text-emerald-500",
        dotColor: "bg-emerald-500",
      });
    }

    if (deal.isSnoozed && deal.snoozedUntil) {
      items.push({
        date: deal.updatedAt || deal.snoozedUntil,
        label: `Snoozed until ${new Date(deal.snoozedUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        icon: BellOff,
        color: "text-amber-500",
        dotColor: "bg-amber-500",
      });
    }

    if (
      deal.stalenessStatus === "stale" ||
      deal.stalenessStatus === "critical"
    ) {
      items.push({
        date: new Date().toISOString(),
        label: `Deal marked as ${deal.stalenessStatus}`,
        icon: AlertTriangle,
        color:
          deal.stalenessStatus === "critical"
            ? "text-red-500"
            : "text-orange-500",
        dotColor:
          deal.stalenessStatus === "critical" ? "bg-red-500" : "bg-orange-500",
      });
    }

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  }, [deal]);

  if (events.length === 0) return null;

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> Activity Timeline
      </h4>
      <div className="relative pl-6 space-y-4">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-gray-700" />
        {events.map((ev, i) => (
          <div key={i} className="relative flex items-start gap-3">
            <div
              className={`absolute left-[-17px] mt-1.5 w-2.5 h-2.5 rounded-full ${ev.dotColor} ring-2 ring-white dark:ring-gray-800`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-dark dark:text-white">{ev.label}</p>
              <p className="text-xs text-muted dark:text-gray-500">
                {fmt(ev.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function DealSlideOver({ dealId, onClose, onUpdate }) {
  const toast = useToast();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Snooze state
  const [showSnooze, setShowSnooze] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [snoozeReason, setSnoozeReason] = useState("");
  const [snoozing, setSnoozing] = useState(false);

  const isOpen = !!dealId;

  useEffect(() => {
    if (!dealId) {
      setDeal(null);
      setShowEdit(false);
      setShowSnooze(false);
      return;
    }
    setLoading(true);
    setShowEdit(false);
    setShowSnooze(false);
    dealsAPI
      .getById(dealId)
      .then((res) => setDeal(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dealId]);

  const reload = () => {
    if (!dealId) return;
    dealsAPI
      .getById(dealId)
      .then((res) => setDeal(res.data.data))
      .catch(() => {});
  };

  const handleDelete = async () => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await dealsAPI.remove(dealId);
      toast.success("Deal deleted");
      onUpdate?.();
      onClose();
    } catch {
      toast.error("Failed to delete deal");
    } finally {
      setDeleting(false);
    }
  };

  const handlePresetSnooze = async (days) => {
    setSnoozing(true);
    const until = new Date();
    until.setDate(until.getDate() + days);
    try {
      await dealsAPI.snooze(dealId, {
        snoozedUntil: until.toISOString(),
        snoozeReason: `Snoozed for ${days} days`,
      });
      toast.success(`Snoozed for ${days} days`);
      setShowSnooze(false);
      reload();
      onUpdate?.();
    } catch {
      toast.error("Failed to snooze deal");
    } finally {
      setSnoozing(false);
    }
  };

  const handleCustomSnooze = async (e) => {
    e.preventDefault();
    setSnoozing(true);
    try {
      await dealsAPI.snooze(dealId, {
        snoozedUntil: new Date(snoozeDate).toISOString(),
        snoozeReason,
      });
      toast.success("Deal snoozed");
      setShowSnooze(false);
      reload();
      onUpdate?.();
    } catch {
      toast.error("Failed to snooze deal");
    } finally {
      setSnoozing(false);
    }
  };

  const handleUnsnooze = async () => {
    try {
      await dealsAPI.unsnooze(dealId);
      toast.success("Deal unsnoozed");
      reload();
      onUpdate?.();
    } catch {
      toast.error("Failed to unsnooze deal");
    }
  };

  const openEdit = () => {
    setEditData({
      name: deal?.name || "",
      stage: deal?.stage || "",
      amount: deal?.amount || "",
      contactName: deal?.contactName || "",
      contactEmail: deal?.contactEmail || "",
    });
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dealsAPI.update(dealId, {
        ...editData,
        amount: editData.amount ? Number(editData.amount) : undefined,
      });
      toast.success("Deal updated");
      setShowEdit(false);
      reload();
      onUpdate?.();
    } catch {
      toast.error("Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] sm:max-w-full bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner text="Loading deal..." />
          </div>
        ) : !deal ? null : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-border dark:border-gray-700 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-dark dark:text-white truncate">
                  {deal.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-text dark:text-gray-300">
                    {deal.stage}
                  </span>
                  <span className="text-sm font-semibold text-dark dark:text-white flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-muted dark:text-gray-400" />
                    {formatCurrency(deal.amount)}
                  </span>
                  <StatusBadge status={deal.stalenessStatus} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-muted dark:text-gray-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Staleness Gauge */}
              <StalenessGauge
                daysStale={deal.daysStale || 0}
                status={deal.stalenessStatus || "healthy"}
              />

              {/* Snooze status */}
              {deal.isSnoozed && (
                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-2">
                    <BellOff className="w-4 h-4 shrink-0" />
                    <span>Snoozed until {formatDate(deal.snoozedUntil)}</span>
                  </div>
                  <button
                    onClick={handleUnsnooze}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Unsnooze
                  </button>
                </div>
              )}

              {/* Suggested Actions */}
              <SuggestedActions deal={deal} />

              {/* Quick Snooze Presets */}
              {!deal.isSnoozed && !showSnooze && !showEdit && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BellOff className="w-3.5 h-3.5" /> Quick Snooze
                  </h4>
                  <div className="flex gap-2">
                    {[3, 7, 14].map((d) => (
                      <button
                        key={d}
                        onClick={() => handlePresetSnooze(d)}
                        disabled={snoozing}
                        className="flex-1 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {d}d
                      </button>
                    ))}
                    <button
                      onClick={() => setShowSnooze(true)}
                      disabled={snoozing}
                      className="flex-1 py-2 rounded-lg border border-primary/30 text-sm font-medium text-primary hover:bg-primary-light active:scale-95 transition-all disabled:opacity-50"
                    >
                      Custom
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Snooze form */}
              {showSnooze && (
                <form
                  onSubmit={handleCustomSnooze}
                  className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl p-4 space-y-3"
                >
                  <h4 className="text-sm font-semibold text-dark dark:text-white">
                    Custom Snooze
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted dark:text-gray-400 mb-1">
                        Snooze until
                      </label>
                      <input
                        type="date"
                        required
                        value={snoozeDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setSnoozeDate(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted dark:text-gray-400 mb-1">
                        Reason (optional)
                      </label>
                      <input
                        type="text"
                        value={snoozeReason}
                        onChange={(e) => setSnoozeReason(e.target.value)}
                        placeholder="e.g. Waiting for Q2 budget"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={snoozing}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {snoozing ? "Snoozing…" : "Snooze Deal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSnooze(false)}
                      className="px-4 py-2 border border-border dark:border-gray-700 rounded-lg text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-muted dark:text-gray-400 w-28 shrink-0">
                    CRM Source
                  </span>
                  <span className="text-dark dark:text-white font-medium">
                    {deal.crmSource || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted dark:text-gray-400 w-28 shrink-0">
                    CRM ID
                  </span>
                  <span className="text-dark dark:text-white font-mono text-xs">
                    {deal.crmDealId || "—"}
                  </span>
                </div>
                {deal.contactName && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted dark:text-gray-400 w-28 shrink-0">
                      Contact
                    </span>
                    <span className="text-dark dark:text-white font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted dark:text-gray-400" />
                      {deal.contactName}
                      {deal.contactEmail && (
                        <span className="text-muted dark:text-gray-400 font-normal">
                          ({deal.contactEmail})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {deal.owner && (
                  <div className="flex items-center gap-3">
                    <span className="text-muted dark:text-gray-400 w-28 shrink-0">
                      Owner
                    </span>
                    <span className="text-dark dark:text-white font-medium">
                      {deal.owner.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-muted dark:text-gray-400 w-28 shrink-0">
                    Last Activity
                  </span>
                  <span className="text-dark dark:text-white">
                    {formatDate(deal.lastActivityAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted dark:text-gray-400 w-28 shrink-0">
                    Created
                  </span>
                  <span className="text-dark dark:text-white">
                    {formatDate(deal.createdAt)}
                  </span>
                </div>
              </div>

              {/* Activity Timeline */}
              <ActivityTimeline deal={deal} />

              {/* Edit form */}
              {showEdit && (
                <form
                  onSubmit={handleSave}
                  className="bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl p-4 space-y-3"
                >
                  <h4 className="text-sm font-semibold text-dark dark:text-white">
                    Edit Deal
                  </h4>
                  <div className="space-y-3">
                    <input
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Deal name"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      required
                    />
                    <select
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={editData.stage}
                      onChange={(e) =>
                        setEditData({ ...editData, stage: e.target.value })
                      }
                    >
                      <option value="Discovery">Discovery</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Closing">Closing</option>
                    </select>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Amount"
                      value={editData.amount}
                      onChange={(e) =>
                        setEditData({ ...editData, amount: e.target.value })
                      }
                    />
                    <input
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Contact name"
                      value={editData.contactName}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          contactName: e.target.value,
                        })
                      }
                    />
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm text-dark dark:text-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="Contact email"
                      value={editData.contactEmail}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          contactEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEdit(false)}
                      className="px-4 py-2 border border-border dark:border-gray-700 rounded-lg text-sm text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-border dark:border-gray-700 space-y-3">
              {/* Action buttons */}
              {!showEdit && !showSnooze && (
                <div className="flex gap-2">
                  <button
                    onClick={openEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {deal.isSnoozed ? (
                    <button
                      onClick={handleUnsnooze}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5" /> Unsnooze
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSnooze(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-colors"
                    >
                      <BellOff className="w-3.5 h-3.5" /> Snooze
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}

              {/* Deep-link */}
              <Link
                to={`/deals/${dealId}`}
                className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View full details
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
