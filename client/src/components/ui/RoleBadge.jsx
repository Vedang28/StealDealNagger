import { ROLE_STYLES } from "../../lib/styles";

export default function RoleBadge({ role }) {
  const config = ROLE_STYLES[role] || ROLE_STYLES.rep;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
