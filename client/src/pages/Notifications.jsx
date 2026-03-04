import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { notificationsAPI } from "../services/api";
import { SkeletonNotifications } from "../components/Skeleton";
import PageWrapper from "../components/PageWrapper";
import { Bell, CheckCircle, CheckCheck, Clock } from "lucide-react";

const TYPE_CONFIG = {
  warning: { label: "Warning", color: "text-warning bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", border: "border-l-warning" },
  stale: { label: "Stale", color: "text-danger bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", border: "border-l-danger" },
  critical: { label: "Critical", color: "text-critical bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700", border: "border-l-critical" },
  nudge: { label: "Nudge", color: "text-warning bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", border: "border-l-warning" },
  escalation: { label: "Escalation", color: "text-danger bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", border: "border-l-danger" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "warning", label: "Warning" },
  { key: "stale", label: "Stale" },
  { key: "critical", label: "Critical" },
  { key: "nudge", label: "Nudge" },
  { key: "escalation", label: "Escalation" },
];

function groupByDate(notifications) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7);

  return [
    {
      label: "Today",
      items: notifications.filter((n) => new Date(n.createdAt) >= today),
    },
    {
      label: "Yesterday",
      items: notifications.filter((n) => {
        const d = new Date(n.createdAt);
        return d >= yesterday && d < today;
      }),
    },
    {
      label: "This Week",
      items: notifications.filter((n) => {
        const d = new Date(n.createdAt);
        return d >= thisWeek && d < yesterday;
      }),
    },
    {
      label: "Older",
      items: notifications.filter((n) => new Date(n.createdAt) < thisWeek),
    },
  ].filter((g) => g.items.length > 0);
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await notificationsAPI.list({ limit: 100 });
      setNotifications(res.data?.data?.notifications ?? []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      alert("Failed to mark notification as read");
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      alert("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  }

  const filtered = typeFilter === "all"
    ? notifications
    : notifications.filter((n) => n.type === typeFilter);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const groups = groupByDate(filtered);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="h-7 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
        </div>
        <SkeletonNotifications />
      </div>
    );

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Notifications</h1>
            <p className="text-muted dark:text-gray-400 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border dark:border-gray-700 text-sm font-medium text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 ${
                typeFilter === key
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label}
              {key !== "all" && (
                <span className="ml-1 opacity-70">
                  ({notifications.filter((n) => n.type === key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-16 text-center shadow-sm">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-dark dark:text-white font-semibold">
              {typeFilter === "all" ? "You're all caught up!" : `No ${typeFilter} notifications`}
            </p>
            <p className="text-sm text-muted dark:text-gray-400 mt-1">
              {typeFilter === "all"
                ? "Run a staleness check to generate alerts."
                : "Try a different filter above."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted dark:text-gray-500">{label}</span>
                  <div className="flex-1 h-px bg-border dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  {items.map((n) => {
                    const cfg = TYPE_CONFIG[n.type] ?? { label: n.type, color: "text-muted bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700", border: "border-l-gray-300" };
                    return (
                      <div
                        key={n.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm transition-all ${
                          !n.isRead
                            ? `border-l-4 ${cfg.border} border-r border-t border-b border-border dark:border-gray-700`
                            : "border-border dark:border-gray-700 opacity-60"
                        }`}
                      >
                        <div className="px-5 py-4 flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold mt-0.5 ${cfg.color}`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-dark dark:text-white" : "text-muted dark:text-gray-400"}`}>
                                {n.message}
                              </p>
                              <span className="flex items-center gap-1 text-xs text-muted dark:text-gray-500 shrink-0 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {formatTime(n.createdAt)}
                              </span>
                            </div>
                            {n.deal && (
                              <Link
                                to={`/deals/${n.deal.id}`}
                                className="mt-1 text-xs text-primary hover:text-primary-hover font-medium inline-flex items-center gap-1"
                              >
                                {n.deal.name}
                              </Link>
                            )}
                            {n.dealId && !n.deal && (
                              <Link
                                to={`/deals/${n.dealId}`}
                                className="mt-1 text-xs text-primary hover:text-primary-hover font-medium inline-flex items-center gap-1"
                              >
                                View deal →
                              </Link>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkRead(n.id)}
                                  className="text-xs text-muted dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
