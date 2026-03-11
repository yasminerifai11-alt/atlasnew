import { createContext, useContext, useState, useCallback, useEffect } from "react";

const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

const THEMES = {
  dark: {
    name: "dark",
    bg: "#080c14",
    bgSecondary: "#060a10",
    bgCard: "rgba(255,255,255,0.03)",
    bgCardHover: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.07)",
    borderAccent: "rgba(30,90,160,0.3)",
    text: "#e2e8f0",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    textDim: "#475569",
    textFaint: "#334155",
    scrollTrack: "#0d1420",
    scrollThumb: "#1e3a5f",
    overlay: "rgba(0,0,0,0.6)",
    popupBg: "#0f172a",
  },
  light: {
    name: "light",
    bg: "#f1f5f9",
    bgSecondary: "#ffffff",
    bgCard: "rgba(0,0,0,0.03)",
    bgCardHover: "rgba(0,0,0,0.06)",
    border: "rgba(0,0,0,0.1)",
    borderAccent: "rgba(30,90,160,0.2)",
    text: "#0f172a",
    textSecondary: "#334155",
    textMuted: "#64748b",
    textDim: "#94a3b8",
    textFaint: "#cbd5e1",
    scrollTrack: "#e2e8f0",
    scrollThumb: "#94a3b8",
    overlay: "rgba(0,0,0,0.3)",
    popupBg: "#ffffff",
  }
};

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem("atlas-theme") || "dark";
  });

  const theme = THEMES[themeName];

  const toggleTheme = useCallback(() => {
    setThemeName(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("atlas-theme", next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.setAttribute("data-theme", themeName);
  }, [themeName, theme.bg]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
