import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationsAPI } from "../services/api";
import useLayoutStore from "../store/useLayoutStore";
import NotificationsDropdown from "./NotificationsDropdown";
import { motion } from "framer-motion";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { to: "/deals", icon: Briefcase, label: "deals" },
  { to: "/analytics", icon: BarChart2, label: "analytics" },
  { to: "/rules", icon: Settings2, label: "rules" },
  { to: "/team", icon: Users, label: "team" },
  { to: "/integrations", icon: Plug, label: "integrations" },
  { to: "/settings", icon: Settings, label: "settings" },
];

const MOBILE_TAB_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "home" },
  { to: "/deals", icon: Briefcase, label: "deals" },
  { to: "/rules", icon: Settings2, label: "rules" },
  { to: "/team", icon: Users, label: "team" },
  { to: "/settings", icon: Settings, label: "settings" },
];

const navContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export default function Sidebar() {
  const { user, team, logout } = useAuth();
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
        className={`hidden md:flex shrink-0 bg-[#0d0d0d] min-h-screen flex-col relative transition-all duration-300 ease-in-out border-r border-[rgba(255,255,255,0.05)] ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div
          className={`border-b border-[rgba(255,255,255,0.05)] flex items-center ${
            collapsed ? "px-3 py-5 justify-center" : "px-6 py-5 gap-3"
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-[#e8a87c]/10 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-[#e8a87c]" />
          </div>
          {!collapsed && (
            <span className="font-serif text-[#f0ede8] text-lg leading-tight whitespace-nowrap overflow-hidden">
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
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-[#0d0d0d] border border-[rgba(255,255,255,0.1)] text-[#666] hover:text-[#f0ede8] flex items-center justify-center hover:border-[#e8a87c] transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-3 h-3" />
          ) : (
            <PanelLeftClose className="w-3 h-3" />
          )}
        </button>

        {/* Nav */}
        <motion.nav
          variants={navContainerVariants}
          initial="hidden"
          animate="show"
          className={`flex-1 py-4 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}
        >
          {/* Cmd+K search trigger */}
          <motion.button
            variants={navItemVariants}
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true }),
              );
            }}
            title={collapsed ? "Search (⌘K)" : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium text-[#666] hover:text-[#f0ede8] transition-colors duration-150 mb-2 ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left tracking-[0.04em] lowercase">search…</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[10px] font-mono text-[#555]">
                  ⌘K
                </kbd>
              </>
            )}
          </motion.button>

          {/* Bell (notifications dropdown) */}
          <motion.div variants={navItemVariants} className="relative" ref={bellRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              title={collapsed ? "Notifications" : undefined}
              className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors duration-150 ${
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
              } ${
                notifOpen
                  ? "text-[#f0ede8]"
                  : "text-[#666] hover:text-[#f0ede8]"
              }`}
            >
              <div className="relative shrink-0">
                <Bell className="w-4 h-4" />
                {collapsed && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#e8a87c] text-[#0a0a0a] text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left tracking-[0.04em] lowercase">notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#e8a87c] text-[#0a0a0a] text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
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
          </motion.div>

          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active =
              location.pathname === to ||
              location.pathname.startsWith(to + "/");
            return (
              <motion.div key={to} variants={navItemVariants}>
                <Link
                  to={to}
                  title={collapsed ? label : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "text-[#f0ede8] nav-active-bar"
                      : "text-[#666] hover:text-[#f0ede8]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="flex-1 tracking-[0.04em] lowercase">{label}</span>}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {/* User + Logout */}
        <div
          className={`pb-4 border-t border-[rgba(255,255,255,0.05)] pt-4 space-y-2 ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          <Link
            to="/settings"
            title={collapsed ? user?.name : undefined}
            className={`flex items-center rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200 cursor-pointer group ${
              collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#e8a87c]/10 text-[#e8a87c] flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-[#e8a87c]/20 group-hover:ring-[#e8a87c]/40 transition-all">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[#f0ede8] text-xs font-semibold truncate">
                  {user?.name}
                </p>
                <p className="text-[#555] text-[11px] truncate">{team?.name}</p>
              </div>
            )}
          </Link>

          <button
            onClick={logout}
            title={collapsed ? "Log out" : undefined}
            className={`w-full flex items-center rounded-lg text-sm font-medium text-[#666] hover:text-[#f0ede8] transition-colors duration-150 ${
              collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="tracking-[0.04em] lowercase">log out</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ─────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.05)] flex items-center justify-around px-2 py-2.5 safe-area-bottom">
        {MOBILE_TAB_ITEMS.map(({ to, icon: Icon, label }) => {
          const active =
            location.pathname === to || location.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-12 min-h-12 justify-center ${
                active ? "text-[#e8a87c]" : "text-[#555] active:text-[#888]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] font-medium lowercase tracking-[0.04em]`}>{label}</span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#e8a87c]" />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-12 min-h-12 justify-center ${
            notifOpen ? "text-[#e8a87c]" : "text-[#555] active:text-[#888]"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-medium lowercase tracking-[0.04em]">alerts</span>
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-[#e8a87c] text-[#0a0a0a] text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0d0d0d]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
}
