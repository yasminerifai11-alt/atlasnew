import { COUNTRIES } from "../../data/events";
import { useTheme } from "../../context/ThemeContext";

export default function CountrySelector({ value, onChange, onOpenQuickSwitcher }) {
  const { theme } = useTheme();
  const isMulti = value.length > 1;
  const isFiltered = !value.includes("ALL");
  const displayCode = value.includes("ALL") ? "ALL" : value[0];

  return (
    <div className="country-selector" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
        COMMAND VIEW:
      </span>
      <select
        value={displayCode}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: "4px 24px 4px 8px",
          borderRadius: 4,
          border: `1px solid ${isFiltered ? "#3b82f6" : theme.border}`,
          background: isFiltered ? "rgba(59,130,246,0.15)" : theme.bgCard,
          color: isFiltered ? "#60a5fa" : theme.textMuted,
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        {Object.entries(COUNTRIES).map(([code, c]) => (
          <option key={code} value={code}>
            {c.flag} {c.label}
          </option>
        ))}
      </select>
      {isMulti && (
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          padding: "2px 6px", borderRadius: 3,
          background: "rgba(59,130,246,0.2)", color: "#60a5fa",
          border: "1px solid rgba(59,130,246,0.4)",
        }}>
          +{value.length - 1}
        </span>
      )}
      <button
        onClick={onOpenQuickSwitcher}
        style={{
          padding: "3px 8px", borderRadius: 3, cursor: "pointer",
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          border: `1px solid ${theme.border}`, background: theme.bgCard,
          color: theme.textMuted, letterSpacing: "0.06em",
          display: "flex", alignItems: "center", gap: 4,
        }}
        title="Quick switch country (Ctrl+K)"
      >
        <span style={{ fontSize: 10 }}>⌘K</span>
      </button>
    </div>
  );
}
