const statusConfig = {
  healthy: {
    label: "Healthy",
    bg: "bg-success-light",
    text: "text-success",
    dot: "bg-success",
    pulse: "",
  },
  warning: {
    label: "Warning",
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
    pulse: "",
  },
  stale: {
    label: "Stale",
    bg: "bg-danger-light",
    text: "text-danger",
    dot: "bg-danger",
    pulse: "badge-pulse-stale",
  },
  critical: {
    label: "Critical",
    bg: "bg-critical-light",
    text: "text-critical",
    dot: "bg-critical",
    pulse: "badge-pulse-critical",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.healthy;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${config.pulse}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} badge-dot`} />
      {config.label}
    </span>
  );
}
