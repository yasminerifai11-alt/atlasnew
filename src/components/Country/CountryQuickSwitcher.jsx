import { useState, useEffect, useRef } from "react";
import { COUNTRIES, getCountryEvents } from "../../data/events";
import { useTheme } from "../../context/ThemeContext";

export default function CountryQuickSwitcher({ countries, onSelect, onClose }) {
  const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef(null);

  const entries = Object.entries(COUNTRIES).filter(([code, c]) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.label.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  const handleKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, entries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && entries[highlightIdx]) {
      const code = entries[highlightIdx][0];
      onSelect(code, e.shiftKey);
      if (!e.shiftKey) onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "center", paddingTop: 120,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 420, maxHeight: 440,
        background: theme.bgSecondary, border: `1px solid ${theme.borderAccent}`,
        borderRadius: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Search input */}
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, color: theme.textMuted }}>🌐</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Switch country... (Shift+Enter for multi-select)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "'Space Mono', monospace", fontSize: 13, color: theme.text,
              }}
            />
            <kbd style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim,
              padding: "2px 6px", borderRadius: 3, border: `1px solid ${theme.border}`,
              background: theme.bgCard,
            }}>ESC</kbd>
          </div>
        </div>

        {/* Hint */}
        <div style={{
          padding: "6px 16px", borderBottom: `1px solid ${theme.border}`,
          fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim,
          display: "flex", gap: 16,
        }}>
          <span>↑↓ Navigate</span>
          <span>Enter = Single</span>
          <span>Shift+Enter = Add/Remove</span>
        </div>

        {/* Country list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {entries.map(([code, c], idx) => {
            const isActive = countries.includes(code);
            const isHighlighted = idx === highlightIdx;
            const evts = code === "ALL" ? [] : getCountryEvents(code);
            const directCount = evts.filter(e => e.relevance === "direct").length;
            const spillCount = evts.filter(e => e.relevance === "spillover").length;
            const maxRisk = evts.length > 0 ? Math.max(...evts.map(e => e.risk_score)) : 0;
            const riskColor = maxRisk >= 75 ? "#ef4444" : maxRisk >= 50 ? "#f97316" : maxRisk >= 25 ? "#eab308" : "#22c55e";

            return (
              <div
                key={code}
                onClick={(e) => { onSelect(code, e.shiftKey); if (!e.shiftKey) onClose(); }}
                onMouseEnter={() => setHighlightIdx(idx)}
                style={{
                  padding: "8px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  background: isHighlighted ? (theme.bgCard) : "transparent",
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                  transition: "background 0.1s",
                }}
              >
                <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{c.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 12,
                    color: isActive ? "#60a5fa" : theme.text, fontWeight: isActive ? 700 : 400,
                  }}>
                    {c.label}
                    {isActive && <span style={{ fontSize: 10, marginLeft: 6, color: "#3b82f6" }}>ACTIVE</span>}
                  </div>
                  {code !== "ALL" && (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim, marginTop: 2 }}>
                      {directCount} direct · {spillCount} spillover
                    </div>
                  )}
                </div>
                {code !== "ALL" && (
                  <div style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
                    color: riskColor, minWidth: 20, textAlign: "right",
                  }}>
                    {maxRisk}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
