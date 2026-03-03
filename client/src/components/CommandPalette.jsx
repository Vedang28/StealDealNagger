import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { dealsAPI } from "../services/api";
import {
  Search,
  Briefcase,
  LayoutDashboard,
  BarChart2,
  Bell,
  Settings2,
  Users,
  Plug,
  Settings,
  Plus,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";

// Static pages that are always available
const PAGES = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  { id: "deals", label: "Deals", icon: Briefcase, path: "/deals" },
  { id: "create-deal", label: "Create Deal", icon: Plus, path: "/deals/new" },
  { id: "analytics", label: "Analytics", icon: BarChart2, path: "/analytics" },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  { id: "rules", label: "Rules", icon: Settings2, path: "/rules" },
  { id: "team", label: "Team", icon: Users, path: "/team" },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    path: "/integrations",
  },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Fetch deals when query changes (debounced)
  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setDeals([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await dealsAPI.list({ search: query, limit: 5 });
        setDeals(res.data?.data?.deals || []);
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Filter pages by query
  const filteredPages = query.trim()
    ? PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  // Build results list
  const results = [
    ...filteredPages.map((p) => ({
      id: `page-${p.id}`,
      label: p.label,
      sublabel: "Page",
      icon: p.icon,
      action: () => navigate(p.path),
    })),
    ...deals.map((d) => ({
      id: `deal-${d.id}`,
      label: d.name,
      sublabel: `${d.stage} · $${Number(d.amount || 0).toLocaleString()}`,
      icon: Briefcase,
      action: () => navigate(`/deals/${d.id}`),
    })),
  ];

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children?.[selectedIndex];
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (index) => {
      const result = results[index];
      if (result) {
        result.action();
        setOpen(false);
      }
    },
    [results],
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search deals, pages, actions…"
              className="flex-1 text-sm text-dark placeholder:text-muted bg-transparent outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 border border-border text-[10px] font-mono text-muted">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted">
                  {loading ? "Searching…" : "No results found"}
                </p>
              </div>
            ) : (
              results.map((result, i) => {
                const Icon = result.icon;
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(i)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-dark hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {result.label}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {result.sublabel}
                      </p>
                    </div>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-gray-50/50 flex items-center gap-4 text-[10px] text-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white border border-border font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white border border-border font-mono">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white border border-border font-mono">
                esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
