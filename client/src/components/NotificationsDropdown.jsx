import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Clock, X } from "lucide-react";
import { notificationsAPI } from "../services/api";

const TYPE_CONFIG = {
  warning: { label: "Warning", color: "text-warning", bg: "bg-warning/10", border: "border-l-warning" },
  stale: { label: "Stale", color: "text-danger", bg: "bg-danger/10", border: "border-l-danger" },
  critical: { label: "Critical", color: "text-critical", bg: "bg-critical/10", border: "border-l-critical" },
  nudge: { label: "Nudge", color: "text-warning", bg: "bg-warning/10", border: "border-l-warning" },
  escalation: { label: "Escalation", color: "text-danger", bg: "bg-danger/10", border: "border-l-danger" },
};

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(notifications) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    today: notifications.filter((n) => new Date(n.createdAt) >= today),
    yesterday: notifications.filter(
      (n) => new Date(n.createdAt) >= yesterday && new Date(n.createdAt) < today
    ),
    earlier: notifications.filter((n) => new Date(n.createdAt) < yesterday),
  };
}

export default function NotificationsDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    notificationsAPI
      .list({ limit: 15 })
      .then((res) => {
        setNotifications(res.data?.data?.notifications ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Close on outside click or Esc
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [isOpen, onClose]);

  async function handleMarkAll() {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }

  const unread = notifications.filter((n) => !n.isRead).length;
  const groups = groupByDate(notifications);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute left-full top-0 ml-2 z-50 w-80 bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-dark dark:text-white">Notifications</span>
              {unread > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all read"
                  className="p-1.5 rounded-lg text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-muted dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-muted dark:text-gray-400">All caught up ✓</p>
              </div>
            ) : (
              <>
                {[
                  { key: "today", label: "Today" },
                  { key: "yesterday", label: "Yesterday" },
                  { key: "earlier", label: "Earlier" },
                ].map(({ key, label }) => {
                  const items = groups[key];
                  if (!items?.length) return null;
                  return (
                    <div key={key}>
                      <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900/50 border-b border-border dark:border-gray-700">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-gray-500">
                          {label}
                        </span>
                      </div>
                      {items.map((n) => {
                        const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.nudge;
                        return (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-l-2 ${cfg.border} ${
                              n.isRead ? "opacity-60" : ""
                            } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
                          >
                            <div className="flex gap-3 items-start">
                              <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                <Bell className={`w-3.5 h-3.5 ${cfg.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-dark dark:text-gray-200 line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1 text-[11px] text-muted dark:text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(n.createdAt)}
                                  </span>
                                  {n.dealId && (
                                    <Link
                                      to={`/deals/${n.dealId}`}
                                      onClick={onClose}
                                      className="text-[11px] text-primary hover:underline"
                                    >
                                      View deal →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Link
              to="/notifications"
              onClick={onClose}
              className="text-xs text-primary font-medium hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
