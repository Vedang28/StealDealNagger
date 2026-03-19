import {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Dark-only editorial theme — always dark
  const isDark = true;
  const mode = "dark";

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Keep interface for backward compat
  const toggleTheme = useCallback(() => {}, []);
  const setTheme = useCallback(() => {}, []);

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
