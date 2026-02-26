import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { notificationsAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { Bell, CheckCircle, CheckCheck, Clock } from "lucide-react";

const TYPE_LABELS = {
  warning: { label: "Warning", color: "text-warning bg-amber-50 border-amber-200" },
  stale: { label: "Stale", color: "text-danger bg-red-50 border-red-200" },
  critical: { label: "Critical", color: "text-critical bg-red-100 border-red-300" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsAPI.list({ limit: 50 });
      setNotifications(res.data?.data?.notifications ?? []);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      alert("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      alert("Failed to mark all notifications as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <LoadingSpinner size="lg" text="Loading notifications..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Notifications</h1>
          <p className="text-muted text-sm mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium text-dark hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <p className="text-dark font-semibold">You're all caught up!</p>
          <p className="text-sm text-muted mt-1">
            No notifications yet. Run a staleness check to generate alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const typeStyle = TYPE_LABELS[n.type] ?? { label: n.type, color: "text-muted bg-gray-50 border-gray-200" };
            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border shadow-sm transition-colors ${
                  !n.isRead
                    ? "border-l-4 border-l-primary border-r border-t border-b border-border"
                    : "border-border opacity-70"
                }`}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border text-xs font-bold mt-0.5 ${typeStyle.color}`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-dark" : "text-muted"}`}>
                        {n.message}
                      </p>
                      <span className="flex items-center gap-1 text-xs text-muted shrink-0 mt-0.5">
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

                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${typeStyle.color}`}
                      >
                        {typeStyle.label}
                      </span>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
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
      )}
    </div>
  );
}
