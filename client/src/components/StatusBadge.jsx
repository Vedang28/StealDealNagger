const statusConfig = {
  healthy: {
    label: "Healthy",
    bg: "bg-[#0f2318]",
    text: "text-[#4ade80]",
    border: "border border-[#4ade8030]",
    dot: "bg-[#4ade80]",
    pulse: "",
  },
  warning: {
    label: "Warning",
    bg: "bg-[#2a1f0a]",
    text: "text-[#f59e0b]",
    border: "border border-[#f59e0b30]",
    dot: "bg-[#f59e0b]",
    pulse: "",
  },
  stale: {
    label: "Stale",
    bg: "bg-[#2a1508]",
    text: "text-[#f97316]",
    border: "border border-[#f9731630]",
    dot: "bg-[#f97316]",
    pulse: "badge-pulse-stale",
  },
  critical: {
    label: "Critical",
    bg: "bg-[#2a0808]",
    text: "text-[#ef4444]",
    border: "border border-[#ef444430]",
    dot: "bg-[#ef4444]",
    pulse: "badge-pulse-critical",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.healthy;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${config.border} ${config.pulse}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} badge-dot`} />
      {config.label}
    </span>
  );
}
