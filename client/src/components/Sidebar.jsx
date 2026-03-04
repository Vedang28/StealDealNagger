import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsAPI } from "../services/api";
import NotificationsDropdown from "./NotificationsDropdown";
import {
  Bell,
  Briefcase,
  LayoutDashboard,
  BarChart2,
  Settings2,
  Settings,
  LogOut,
  Users,
  Plug,
  Search,
  Sun,
  Moon,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/deals", icon: Briefcase, label: "Deals" },
  { to: "/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/rules", icon: Settings2, label: "Rules" },
  { to: "/team", icon: Users, label: "Team" },
  { to: "/integrations", icon: Plug, label: "Integrations" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

// Fewer items for mobile tab bar (max 5)
const MOBILE_TAB_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/deals", icon: Briefcase, label: "Deals" },
  { to: "/rules", icon: Settings2, label: "Rules" },
  { to: "/team", icon: Users, label: "Team" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { user, team, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    notificationsAPI
      .list({ limit: 50 })
      .then((res) => {
        const notifications = res.data?.data?.notifications ?? [];
        setUnreadCount(notifications.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, [location.pathname]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-dark dark:bg-gray-900 min-h-screen flex-col relative">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm leading-tight">
            Stale Deal
            <br />
            Nagger
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {/* Cmd+K search trigger */}
          <button
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true }),
              );
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150 mb-2"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/40">
              ⌘K
            </kbd>
          </button>

          {/* Bell (notifications dropdown) */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                notifOpen
                  ? "bg-primary/15 text-primary"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <NotificationsDropdown
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
            />
          </div>

          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active =
              location.pathname === to ||
              location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + User + Logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-2">
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150"
          >
            {isDark ? (
              <Sun className="w-4 h-4 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 shrink-0" />
            )}
            {isDark ? "Light mode" : "Dark mode"}
          </button>

          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/8 transition-colors duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {user?.name}
              </p>
              <p className="text-white/40 text-xs truncate">{team?.name}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar (visible only on mobile) ─────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark dark:bg-gray-900 border-t border-white/10 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {MOBILE_TAB_ITEMS.map(({ to, icon: Icon, label }) => {
          const active =
            location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-11 min-h-11 justify-center ${
                active ? "text-primary" : "text-white/50 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {/* Bell button for mobile */}
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-11 min-h-11 justify-center ${
            notifOpen ? "text-primary" : "text-white/50 hover:text-white"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-medium">Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}
