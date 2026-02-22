export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
}) {
  const colors = {
    primary: "bg-primary-light text-primary",
    success: "bg-success-light text-success",
    warning: "bg-warning-light text-warning",
    danger: "bg-danger-light text-danger",
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted font-medium">{label}</p>
          <p className="text-2xl font-bold text-dark">{value}</p>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
