import { useState, useEffect } from "react";
import { useClock } from "../hooks/useClock";
import { useTheme } from "../context/ThemeContext";

function timeAgo(date) {
  if (!date) return "...";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function StatusStrip({ events, lastUpdated, sourceCount, loading, onRefresh }) {
  const time = useClock();
  const { theme } = useTheme();
  const [livePulse, setLivePulse] = useState(true);

  // Pulse the live dot
  useEffect(() => {
    const interval = setInterval(() => setLivePulse(p => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  const critCount = events.filter(e => e.risk_level === "CRITICAL").length;
  const maxRisk = events.length > 0 ? Math.max(...events.map(e => e.risk_score)) : 0;
  const posture = critCount > 0 ? "CRITICAL" : maxRisk >= 60 ? "ELEVATED" : maxRisk >= 30 ? "GUARDED" : "NOMINAL";
  const postureColor = critCount > 0 ? "#ef4444" : maxRisk >= 60 ? "#f97316" : maxRisk >= 30 ? "#eab308" : "#22c55e";

  return (
    <div style={{
      background: `${postureColor}14`, borderBottom: `1px solid ${postureColor}33`,
      padding: "6px 24px", display: "flex", gap: 16, alignItems: "center",
      flexWrap: "wrap"
    }}>
      {/* Live dot */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#22c55e", letterSpacing: "0.08em",
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#22c55e",
          opacity: livePulse ? 1 : 0.4,
          transition: "opacity 0.8s",
          boxShadow: livePulse ? "0 0 6px #22c55e" : "none",
        }} />
        LIVE
      </span>

      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: postureColor, letterSpacing: "0.12em" }}>
        THREAT POSTURE: {posture}
      </span>

      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textMuted }}>
        {loading ? "LOADING..." : `ACTIVE INCIDENTS: ${events.length}`} · {sourceCount || 20} SOURCES · Updated {timeAgo(lastUpdated)}
      </span>

      <button
        onClick={onRefresh}
        style={{
          background: "none", border: `1px solid ${theme.border}`, borderRadius: 3,
          color: theme.textMuted, cursor: "pointer", padding: "2px 8px",
          fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.08em",
          transition: "all 0.15s",
        }}
        title="Force refresh all feeds"
      >
        REFRESH
      </button>
    </div>
  );
}
