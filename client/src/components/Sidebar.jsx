import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsAPI } from "../services/api";
import useLayoutStore from "../store/useLayoutStore";
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
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
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

const MOBILE_TAB_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/deals", icon: Briefcase, label: "Deals" },
  { to: "/rules", icon: Settings2, label: "Rules" },
  { to: "/team", icon: Users, label: "Team" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { user, team, logout } = useAuth();
  const { isDark, mode, toggleTheme } = useTheme();
  const location = useLocation();
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const fetchCount = () => {
      notificationsAPI
        .unreadCount()
        .then((res) => {
          setUnreadCount(res.data?.data?.unreadCount ?? 0);
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
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
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className={`hidden md:flex shrink-0 bg-dark dark:bg-gray-900 min-h-screen flex-col relative transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div
          className={`border-b border-white/10 flex items-center ${
            collapsed ? "px-3 py-5 justify-center" : "px-6 py-5 gap-3"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-sm leading-tight whitespace-nowrap overflow-hidden">
              Stale Deal
              <br />
              Nagger
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-dark dark:bg-gray-800 border border-white/20 text-white/60 hover:text-white flex items-center justify-center hover:bg-primary transition-colors shadow-md"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-3 h-3" />
          ) : (
            <PanelLeftClose className="w-3 h-3" />
          )}
        </button>

        {/* Nav */}
        <nav
          className={`flex-1 py-4 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}
        >
          {/* Cmd+K search trigger */}
          <button
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true }),
              );
            }}
            title={collapsed ? "Search (⌘K)" : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150 mb-2 ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search…</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white/40">
                  ⌘K
                </kbd>
              </>
            )}
          </button>

          {/* Bell (notifications dropdown) */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              title={collapsed ? "Notifications" : undefined}
              className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors duration-150 ${
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                notifOpen
                  ? "bg-primary/15 text-primary"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <div className="relative shrink-0">
                <Bell className="w-4 h-4" />
                {collapsed && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </>
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
                title={collapsed ? label : undefined}
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-primary/15 text-primary nav-active-bar"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]" : ""}`} />
                {!collapsed && <span className="flex-1">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + User + Logout */}
        <div
          className={`pb-4 border-t border-white/10 pt-4 space-y-2 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <button
            onClick={toggleTheme}
            title={
              collapsed
                ? mode === "dark"
                  ? "System theme"
                  : mode === "system"
                    ? "Light mode"
                    : "Dark mode"
                : mode === "dark"
                  ? "Switch to system"
                  : mode === "system"
                    ? "Switch to light"
                    : "Switch to dark"
            }
            className={`w-full flex items-center rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150 ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            {mode === "dark" ? (
              <Moon className="w-4 h-4 shrink-0" />
            ) : mode === "system" ? (
              <Monitor className="w-4 h-4 shrink-0" />
            ) : (
              <Sun className="w-4 h-4 shrink-0" />
            )}
            {!collapsed &&
              (mode === "dark"
                ? "Dark mode"
                : mode === "system"
                  ? "System"
                  : "Light mode")}
          </button>

          <Link
            to="/settings"
            title={collapsed ? user?.name : undefined}
            className={`flex items-center rounded-lg hover:bg-white/8 transition-all duration-200 cursor-pointer group ${
              collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate">
                  {user?.name}
                </p>
                <p className="text-white/40 text-[11px] truncate">{team?.name}</p>
              </div>
            )}
          </Link>

          <button
            onClick={logout}
            title={collapsed ? "Log out" : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-colors duration-150 ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ─────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 py-2.5 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        {MOBILE_TAB_ITEMS.map(({ to, icon: Icon, label }) => {
          const active =
            location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-12 min-h-12 justify-center ${
                active ? "text-primary" : "text-white/45 active:text-white/70"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : ""}`}>{label}</span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-12 min-h-12 justify-center ${
            notifOpen ? "text-primary" : "text-white/45 active:text-white/70"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-medium">Alerts</span>
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-dark dark:ring-gray-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}
