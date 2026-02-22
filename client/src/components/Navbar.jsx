import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell, LayoutDashboard, Briefcase, LogOut, Plus } from "lucide-react";

export default function Navbar() {
  const { user, team, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/deals", label: "Deals", icon: Briefcase },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + nav links */}
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-bold text-lg text-dark"
            >
              <Bell className="w-5 h-5 text-primary" />
              <span>Stale Deal Nagger</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(path)
                      ? "bg-primary-light text-primary"
                      : "text-muted hover:text-dark hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link
              to="/deals/new"
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </Link>

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right">
                <p className="text-sm font-medium text-dark">{user?.name}</p>
                <p className="text-xs text-muted">{team?.name}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
