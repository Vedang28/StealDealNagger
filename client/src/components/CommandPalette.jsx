import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { dealsAPI } from "../services/api";
import Fuse from "fuse.js";
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
  Clock,
  X,
} from "lucide-react";

// Static pages that are always available
const PAGES = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    keywords: ["home", "overview", "pipeline"],
  },
  {
    id: "deals",
    label: "Deals",
    icon: Briefcase,
    path: "/deals",
    keywords: ["pipeline", "opportunities"],
  },
  {
    id: "create-deal",
    label: "Create Deal",
    icon: Plus,
    path: "/deals/new",
    keywords: ["new", "add"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart2,
    path: "/analytics",
    keywords: ["reports", "charts", "stats"],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
    keywords: ["alerts", "messages"],
  },
  {
    id: "rules",
    label: "Rules",
    icon: Settings2,
    path: "/rules",
    keywords: ["staleness", "thresholds", "automation"],
  },
  {
    id: "team",
    label: "Team",
    icon: Users,
    path: "/team",
    keywords: ["members", "people", "invite"],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    path: "/integrations",
    keywords: ["crm", "salesforce", "hubspot", "connect"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    keywords: ["preferences", "account", "profile"],
  },
];

// Fuse instance for pages
const pageFuse = new Fuse(PAGES, {
  keys: ["label", "keywords"],
  threshold: 0.4,
  includeScore: true,
});

// Recent searches storage
const RECENT_KEY = "sdn-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(item) {
  const recents = getRecentSearches().filter((r) => r.id !== item.id);
  recents.unshift({
    id: item.id,
    label: item.label,
    path: item.path,
    type: item.type,
  });
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(recents.slice(0, MAX_RECENT)),
  );
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState([]);
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
      setRecents(getRecentSearches());
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

  // Fuzzy-filter pages by query using Fuse.js
  const filteredPages = useMemo(() => {
    if (!query.trim()) return PAGES;
    return pageFuse.search(query).map((r) => r.item);
  }, [query]);

  // Build results list
  const results = useMemo(() => {
    const items = [
      ...filteredPages.map((p) => ({
        id: `page-${p.id}`,
        label: p.label,
        sublabel: "Page",
        icon: p.icon,
        path: p.path,
        type: "page",
        action: () => navigate(p.path),
      })),
      ...deals.map((d) => ({
        id: `deal-${d.id}`,
        label: d.name,
        sublabel: `${d.stage} · $${Number(d.amount || 0).toLocaleString()}`,
        icon: Briefcase,
        path: `/deals/${d.id}`,
        type: "deal",
        action: () => navigate(`/deals/${d.id}`),
      })),
    ];
    return items;
  }, [filteredPages, deals, navigate]);

  // Show recent searches when query is empty
  const showRecents = !query.trim() && recents.length > 0;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, showRecents]);

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children?.[selectedIndex];
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (index) => {
      if (showRecents) {
        const recent = recents[index];
        if (recent) {
          navigate(recent.path);
          setOpen(false);
        }
        return;
      }
      const result = results[index];
      if (result) {
        addRecentSearch(result);
        result.action();
        setOpen(false);
      }
    },
    [results, recents, showRecents, navigate],
  );

  const totalItems = showRecents ? recents.length : results.length;

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  const handleClearRecents = (e) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecents([]);
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
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-border dark:border-gray-700 overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-gray-700">
            <Search className="w-5 h-5 text-muted dark:text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search deals, pages, actions…"
              className="flex-1 text-sm text-dark dark:text-white placeholder:text-muted dark:placeholder:text-gray-400 bg-transparent outline-none"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-border dark:border-gray-600 text-[10px] font-mono text-muted dark:text-gray-400">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {/* Recent Searches */}
            {showRecents && (
              <>
                <div className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold text-muted dark:text-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Recent
                  </span>
                  <button
                    onClick={handleClearRecents}
                    className="text-[10px] text-muted dark:text-gray-500 hover:text-red-500 transition-colors flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
                {recents.map((recent, i) => {
                  const isSelected = i === selectedIndex;
                  const Icon =
                    recent.type === "deal" ? Briefcase : LayoutDashboard;
                  return (
                    <button
                      key={recent.id}
                      onClick={() => handleSelect(i)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-40" />
                      <p className="text-sm font-medium truncate flex-1">
                        {recent.label}
                      </p>
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      )}
                    </button>
                  );
                })}
              </>
            )}

            {/* Search Results */}
            {!showRecents && results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-muted dark:text-gray-400">
                  {loading ? "Searching…" : "No results found"}
                </p>
              </div>
            ) : !showRecents ? (
              <>
                {/* Group: Pages */}
                {filteredPages.length > 0 && (
                  <div className="px-4 py-2 text-[10px] font-semibold text-muted dark:text-gray-500 uppercase tracking-wider">
                    Pages
                  </div>
                )}
                {results
                  .filter((r) => r.type === "page")
                  .map((result, i) => {
                    const Icon = result.icon;
                    const globalIndex = results.indexOf(result);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(globalIndex)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-60" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.label}
                          </p>
                        </div>
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        )}
                      </button>
                    );
                  })}

                {/* Group: Deals */}
                {deals.length > 0 && (
                  <div className="px-4 py-2 text-[10px] font-semibold text-muted dark:text-gray-500 uppercase tracking-wider mt-1">
                    Deals
                  </div>
                )}
                {results
                  .filter((r) => r.type === "deal")
                  .map((result) => {
                    const Icon = result.icon;
                    const globalIndex = results.indexOf(result);
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(globalIndex)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-60" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.label}
                          </p>
                          <p className="text-xs text-muted dark:text-gray-400 truncate">
                            {result.sublabel}
                          </p>
                        </div>
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-50" />
                        )}
                      </button>
                    );
                  })}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex items-center gap-4 text-[10px] text-muted dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-gray-700 border border-border dark:border-gray-600 font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-gray-700 border border-border dark:border-gray-600 font-mono">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-gray-700 border border-border dark:border-gray-600 font-mono">
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
