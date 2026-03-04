/**
 * Reusable empty state component with inline SVG illustrations.
 * Usage: <EmptyState variant="deals" title="No deals found" subtitle="Try adjusting..." />
 */

import { Link } from "react-router-dom";

/* ── SVG Illustrations (inline, no external assets) ──────── */

function IllustrationDeals() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Briefcase body */}
      <rect
        x="25"
        y="35"
        width="70"
        height="50"
        rx="8"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      {/* Briefcase handle */}
      <path
        d="M45 35V28C45 24 48 21 52 21H68C72 21 75 24 75 28V35"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Briefcase clasp */}
      <rect
        x="55"
        y="50"
        width="10"
        height="12"
        rx="2"
        className="fill-primary/30 stroke-primary/50"
        strokeWidth="1.5"
      />
      {/* Decorative dots */}
      <circle cx="15" cy="60" r="3" className="fill-primary/20" />
      <circle
        cx="105"
        cy="45"
        r="4"
        className="fill-amber-200 dark:fill-amber-700"
      />
      <circle
        cx="100"
        cy="80"
        r="2"
        className="fill-emerald-200 dark:fill-emerald-700"
      />
    </svg>
  );
}

function IllustrationNotifications() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Bell body */}
      <path
        d="M60 20C47 20 37 30 37 43V58C37 58 30 62 30 67H90C90 62 83 58 83 58V43C83 30 73 20 60 20Z"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      {/* Bell clapper */}
      <circle
        cx="60"
        cy="77"
        r="6"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      {/* Check mark */}
      <circle
        cx="78"
        cy="30"
        r="12"
        className="fill-emerald-100 dark:fill-emerald-900/40 stroke-emerald-400 dark:stroke-emerald-600"
        strokeWidth="1.5"
      />
      <path
        d="M73 30L76 33L83 26"
        className="stroke-emerald-500 dark:stroke-emerald-400"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Decorative */}
      <circle cx="20" cy="40" r="3" className="fill-primary/20" />
      <circle
        cx="100"
        cy="55"
        r="2.5"
        className="fill-amber-200 dark:fill-amber-700"
      />
    </svg>
  );
}

function IllustrationTeam() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Person 1 (center) */}
      <circle
        cx="60"
        cy="35"
        r="12"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      <path
        d="M40 72C40 60 48 52 60 52C72 52 80 60 80 72"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      {/* Person 2 (left, smaller) */}
      <circle
        cx="28"
        cy="42"
        r="8"
        className="fill-primary/10 stroke-primary/30"
        strokeWidth="1.5"
      />
      <path
        d="M16 65C16 57 21 52 28 52C35 52 40 57 40 65"
        className="fill-primary/10 stroke-primary/30"
        strokeWidth="1.5"
      />
      {/* Person 3 (right, smaller) */}
      <circle
        cx="92"
        cy="42"
        r="8"
        className="fill-amber-100 dark:fill-amber-900/30 stroke-amber-300 dark:stroke-amber-700"
        strokeWidth="1.5"
      />
      <path
        d="M80 65C80 57 85 52 92 52C99 52 104 57 104 65"
        className="fill-amber-100 dark:fill-amber-900/30 stroke-amber-300 dark:stroke-amber-700"
        strokeWidth="1.5"
      />
      {/* Plus icon */}
      <circle
        cx="60"
        cy="82"
        r="9"
        className="fill-primary/15 stroke-primary/40"
        strokeWidth="1.5"
      />
      <path
        d="M60 78V86M56 82H64"
        className="stroke-primary/60"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IllustrationAnalytics() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Chart bars */}
      <rect
        x="20"
        y="55"
        width="14"
        height="30"
        rx="3"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
      />
      <rect
        x="42"
        y="40"
        width="14"
        height="45"
        rx="3"
        className="fill-primary/20 stroke-primary/40"
        strokeWidth="1.5"
      />
      <rect
        x="64"
        y="50"
        width="14"
        height="35"
        rx="3"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
      />
      <rect
        x="86"
        y="30"
        width="14"
        height="55"
        rx="3"
        className="fill-amber-100 dark:fill-amber-900/30 stroke-amber-300 dark:stroke-amber-700"
        strokeWidth="1.5"
      />
      {/* Trend line */}
      <path
        d="M27 50L49 35L71 42L93 22"
        className="stroke-primary/50"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
      />
      {/* Arrow at end */}
      <circle
        cx="93"
        cy="22"
        r="4"
        className="fill-primary/20 stroke-primary/50"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IllustrationSearch() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Magnifying glass */}
      <circle
        cx="52"
        cy="45"
        r="22"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2.5"
      />
      <path
        d="M68 61L88 81"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Question mark inside */}
      <path
        d="M47 38C47 34 49 32 52 32C55 32 57 34 57 37C57 40 54 40 54 44"
        className="stroke-gray-400 dark:stroke-gray-500"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="54"
        cy="50"
        r="1.5"
        className="fill-gray-400 dark:fill-gray-500"
      />
      {/* Decorative */}
      <circle cx="20" cy="30" r="3" className="fill-primary/20" />
      <circle
        cx="95"
        cy="35"
        r="2.5"
        className="fill-amber-200 dark:fill-amber-700"
      />
    </svg>
  );
}

function IllustrationEmpty() {
  return (
    <svg
      width="120"
      height="100"
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Box */}
      <rect
        x="30"
        y="30"
        width="60"
        height="45"
        rx="6"
        className="fill-gray-100 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      {/* Box flaps */}
      <path
        d="M30 30L24 22H96L90 30"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="60"
        y1="22"
        x2="60"
        y2="30"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
      />
      {/* Sparkle */}
      <path d="M100 50L103 47L106 50L103 53Z" className="fill-primary/30" />
      <path
        d="M18 55L20 53L22 55L20 57Z"
        className="fill-amber-300 dark:fill-amber-600"
      />
      {/* Dashed circle */}
      <circle
        cx="60"
        cy="52"
        r="10"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        fill="none"
      />
    </svg>
  );
}

/* ── Variant Map ─────────────────────────────────────────── */
const ILLUSTRATIONS = {
  deals: IllustrationDeals,
  notifications: IllustrationNotifications,
  team: IllustrationTeam,
  analytics: IllustrationAnalytics,
  search: IllustrationSearch,
  empty: IllustrationEmpty,
};

/* ── Component ───────────────────────────────────────────── */
export default function EmptyState({
  variant = "empty",
  title = "Nothing here yet",
  subtitle,
  actionLabel,
  actionTo,
  onAction,
  compact = false,
}) {
  const Illustration = ILLUSTRATIONS[variant] || ILLUSTRATIONS.empty;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "py-6" : "py-12"}`}
    >
      <Illustration />
      <h3
        className={`font-semibold text-dark dark:text-white mt-4 ${compact ? "text-sm" : "text-base"}`}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className={`text-muted dark:text-gray-400 mt-1 max-w-xs ${compact ? "text-xs" : "text-sm"}`}
        >
          {subtitle}
        </p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-4 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
