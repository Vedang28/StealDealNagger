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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted dark:text-gray-400 font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-dark dark:text-white">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-muted dark:text-gray-400 mt-0.5">
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
