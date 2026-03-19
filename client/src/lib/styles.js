/**
 * Design system constants — single source of truth for UI styling.
 * Import these instead of hardcoding Tailwind classes across pages.
 */

// ── Status colors (deal health) ──────────────────────────
export const STATUS_STYLES = {
  healthy: {
    bg: "bg-success-light",
    text: "text-success",
    border: "border-success/30",
    dot: "bg-success",
    fill: "#22c55e",
  },
  warning: {
    bg: "bg-warning-light",
    text: "text-warning",
    border: "border-warning/30",
    dot: "bg-warning",
    fill: "#f59e0b",
  },
  stale: {
    bg: "bg-danger-light",
    text: "text-danger",
    border: "border-danger/30",
    dot: "bg-danger",
    fill: "#ef4444",
  },
  critical: {
    bg: "bg-critical-light",
    text: "text-critical",
    border: "border-critical/30",
    dot: "bg-critical",
    fill: "#dc2626",
  },
};

// ── Role badges ──────────────────────────────────────────
export const ROLE_STYLES = {
  admin: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    label: "Admin",
  },
  manager: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    label: "Manager",
  },
  rep: {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-700 dark:text-gray-300",
    label: "Rep",
  },
};

// ── Chart colors ─────────────────────────────────────────
export const CHART_COLORS = {
  primary: "#f97316",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  critical: "#dc2626",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  muted: "#9ca3af",
};

// ── Integration providers ────────────────────────────────
// Icon components are imported separately from lucide-react
export const PROVIDER_STYLES = {
  hubspot: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800/40",
  },
  salesforce: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/40",
  },
  pipedrive: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800/40",
  },
  slack: {
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800/40",
  },
  google_sheets: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
  },
};

// ── Notification type styling ────────────────────────────
export const NOTIFICATION_STYLES = {
  warning: {
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
  },
  stale: {
    bg: "bg-danger-light",
    text: "text-danger",
    dot: "bg-danger",
  },
  critical: {
    bg: "bg-critical-light",
    text: "text-critical",
    dot: "bg-critical",
  },
  nudge: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  escalation: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
  },
};

// ── Recharts custom tooltip ──────────────────────────────
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(17, 24, 39, 0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    fontSize: "12px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  labelStyle: {
    color: "#9ca3af",
    marginBottom: "4px",
    fontSize: "11px",
  },
  itemStyle: {
    color: "#f3f4f6",
    padding: "1px 0",
    fontSize: "12px",
  },
};
