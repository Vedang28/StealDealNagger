/**
 * Design system constants — dark editorial theme.
 * Import these instead of hardcoding Tailwind classes across pages.
 */

// ── Status colors (deal health) ──────────────────────────
export const STATUS_STYLES = {
  healthy: {
    bg: "bg-[#0f2318]",
    text: "text-[#4ade80]",
    border: "border-[#4ade8030]",
    dot: "bg-[#4ade80]",
    fill: "#4ade80",
  },
  warning: {
    bg: "bg-[#2a1f0a]",
    text: "text-[#f59e0b]",
    border: "border-[#f59e0b30]",
    dot: "bg-[#f59e0b]",
    fill: "#f59e0b",
  },
  stale: {
    bg: "bg-[#2a1508]",
    text: "text-[#f97316]",
    border: "border-[#f9731630]",
    dot: "bg-[#f97316]",
    fill: "#f97316",
  },
  critical: {
    bg: "bg-[#2a0808]",
    text: "text-[#ef4444]",
    border: "border-[#ef444430]",
    dot: "bg-[#ef4444]",
    fill: "#ef4444",
  },
};

// ── Role badges ──────────────────────────────────────────
export const ROLE_STYLES = {
  admin: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    label: "Admin",
  },
  manager: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Manager",
  },
  rep: {
    bg: "bg-[#1e1e1e]",
    text: "text-[#888]",
    label: "Rep",
  },
};

// ── Chart colors ─────────────────────────────────────────
export const CHART_COLORS = {
  primary: "#e8a87c",
  success: "#4ade80",
  warning: "#f59e0b",
  danger: "#f97316",
  critical: "#ef4444",
  blue: "#60a5fa",
  purple: "#a78bfa",
  muted: "#555",
};

// ── Integration providers ────────────────────────────────
export const PROVIDER_STYLES = {
  hubspot: {
    color: "text-orange-400",
    bg: "bg-orange-500/5",
    border: "border-orange-500/10",
  },
  salesforce: {
    color: "text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/10",
  },
  pipedrive: {
    color: "text-green-400",
    bg: "bg-green-500/5",
    border: "border-green-500/10",
  },
  slack: {
    color: "text-purple-400",
    bg: "bg-purple-500/5",
    border: "border-purple-500/10",
  },
  google_sheets: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/10",
  },
};

// ── Notification type styling ────────────────────────────
export const NOTIFICATION_STYLES = {
  warning: {
    bg: "bg-[#2a1f0a]",
    text: "text-[#f59e0b]",
    dot: "bg-[#f59e0b]",
  },
  stale: {
    bg: "bg-[#2a1508]",
    text: "text-[#f97316]",
    dot: "bg-[#f97316]",
  },
  critical: {
    bg: "bg-[#2a0808]",
    text: "text-[#ef4444]",
    dot: "bg-[#ef4444]",
  },
  nudge: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  escalation: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
};

// ── Recharts custom tooltip ──────────────────────────────
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "#161616",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "8px",
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    fontSize: "12px",
    fontFamily: "'DM Sans', sans-serif",
  },
  labelStyle: {
    color: "#888",
    marginBottom: "4px",
    fontSize: "11px",
  },
  itemStyle: {
    color: "#f0ede8",
    padding: "1px 0",
    fontSize: "12px",
  },
};
