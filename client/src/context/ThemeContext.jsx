import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const ThemeContext = createContext(null);

function getSystemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function ThemeProvider({ children }) {
  // 'light' | 'dark' | 'system'
  const [mode, setMode] = useState(() => {
    return localStorage.getItem("sdn_theme") || "system";
  });

  const isDark = mode === "system" ? getSystemPrefersDark() : mode === "dark";

  // Apply dark class + persist
  useEffect(() => {
    const root = document.documentElement;
    // Enable CSS transitions for theme switch
    root.classList.add("theme-transitioning");
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("sdn_theme", mode);

    // Remove transitioning class after animation completes
    const timer = setTimeout(
      () => root.classList.remove("theme-transitioning"),
      400,
    );
    return () => clearTimeout(timer);
  }, [isDark, mode]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force re-render by toggling mode briefly
      setMode("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "system";
      return "light";
    });
  }, []);

  const setTheme = useCallback((newMode) => {
    setMode(newMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, mode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
