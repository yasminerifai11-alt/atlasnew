import { useClock } from "../hooks/useClock";
import { useTheme } from "../context/ThemeContext";

export default function StatusStrip({ events }) {
  const time = useClock();
  const { theme } = useTheme();

  const critCount = events.filter(e => e.risk_level === "CRITICAL").length;
  const maxRisk = events.length > 0 ? Math.max(...events.map(e => e.risk_score)) : 0;
  const posture = critCount > 0 ? "CRITICAL" : maxRisk >= 60 ? "ELEVATED" : maxRisk >= 30 ? "GUARDED" : "NOMINAL";
  const postureColor = critCount > 0 ? "#ef4444" : maxRisk >= 60 ? "#f97316" : maxRisk >= 30 ? "#eab308" : "#22c55e";

  return (
    <div style={{
      background: `${postureColor}14`, borderBottom: `1px solid ${postureColor}33`,
      padding: "6px 24px", display: "flex", gap: 24, alignItems: "center",
      flexWrap: "wrap"
    }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: postureColor, letterSpacing: "0.12em" }}>
        ⚠ THREAT POSTURE: {posture}
      </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textMuted }}>
        ACTIVE INCIDENTS: {events.length} · MONITORING: 435 FEEDS · LAST SYNC: {time.toLocaleTimeString("en-GB")} UTC
      </span>
    </div>
  );
}
