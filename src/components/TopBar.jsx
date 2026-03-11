import { useClock } from "../hooks/useClock";
import { useTheme } from "../context/ThemeContext";
import PulsingDot from "./shared/PulsingDot";
import CountrySelector from "./Country/CountrySelector";

export default function TopBar({ onMenuToggle, soundEnabled, onToggleSound, countries, onCountryChange, onOpenQuickSwitcher, viewMode, onViewModeChange }) {
  const time = useClock();
  const { theme, themeName, toggleTheme } = useTheme();

  const smallBtn = {
    padding: "4px 8px", borderRadius: 3, cursor: "pointer",
    fontFamily: "'Space Mono', monospace", fontSize: 10,
    border: `1px solid ${theme.border}`, background: theme.bgCard,
    color: theme.textMuted, letterSpacing: "0.06em",
  };

  return (
    <div style={{
      background: theme.bgSecondary, borderBottom: `1px solid ${theme.borderAccent}`,
      padding: "0 24px", height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexShrink: 0
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button className="menu-toggle" onClick={onMenuToggle} style={{
          display: "none", background: "none", border: "none", color: theme.text,
          fontSize: 20, cursor: "pointer", padding: "4px 8px"
        }}>☰</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5"/>
            <path d="M2 12h20M12 2c-3 4-3 14 0 20M12 2c3 4 3 14 0 20M4.5 6.5c3 2 11 2 15 0M4.5 17.5c3-2 11-2 15 0" stroke="#3b82f6" strokeWidth="1.2"/>
          </svg>
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14, color: theme.text, letterSpacing: "0.1em" }}>
            ATLAS COMMAND
          </span>
        </div>
        <span className="topbar-divider" style={{ color: theme.textFaint, fontSize: 18 }}>|</span>
        <CountrySelector value={countries} onChange={onCountryChange} onOpenQuickSwitcher={onOpenQuickSwitcher} />
        <div style={{ display: "flex", gap: 0, marginLeft: 8 }}>
          <button
            onClick={() => onViewModeChange("command")}
            style={{
              ...smallBtn,
              borderRadius: "3px 0 0 3px",
              background: viewMode === "command" ? "rgba(59,130,246,0.2)" : theme.bgCard,
              color: viewMode === "command" ? "#60a5fa" : theme.textMuted,
              borderRight: "none",
            }}
          >
            COMMAND
          </button>
          <button
            onClick={() => onViewModeChange("leader")}
            style={{
              ...smallBtn,
              borderRadius: "0 3px 3px 0",
              background: viewMode === "leader" ? "rgba(245,158,11,0.2)" : theme.bgCard,
              color: viewMode === "leader" ? "#f59e0b" : theme.textMuted,
            }}
          >
            LEADER BRIEF
          </button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="topbar-time" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: theme.textFaint }}>
          {time.toUTCString().split(" ").slice(0, 5).join(" ")}
        </span>
        <button onClick={onToggleSound} style={smallBtn} title={soundEnabled ? "Mute alerts" : "Enable alerts"}>
          {soundEnabled ? "🔊" : "🔇"}
        </button>
        <button onClick={toggleTheme} style={smallBtn} title={`Switch to ${themeName === "dark" ? "light" : "dark"} mode`}>
          {themeName === "dark" ? "☀" : "🌙"}
        </button>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 3,
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)"
        }}>
          <PulsingDot color="#22c55e" />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#22c55e", letterSpacing: "0.08em" }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}
