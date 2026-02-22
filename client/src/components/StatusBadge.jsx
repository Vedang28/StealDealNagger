const statusConfig = {
  healthy: {
    label: "Healthy",
    bg: "bg-success-light",
    text: "text-success",
    dot: "bg-success",
  },
  warning: {
    label: "Warning",
    bg: "bg-warning-light",
    text: "text-warning",
    dot: "bg-warning",
  },
  stale: {
    label: "Stale",
    bg: "bg-danger-light",
    text: "text-danger",
    dot: "bg-danger",
  },
  critical: {
    label: "Critical",
    bg: "bg-critical-light",
    text: "text-critical",
    dot: "bg-critical",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.healthy;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
