import { useTheme } from "../../context/ThemeContext";

export default function DashboardStats({ events }) {
  const { theme } = useTheme();

  if (events.length === 0) {
    return (
      <div className="dashboard-stats" style={{
        padding: "12px 24px", borderBottom: `1px solid ${theme.border}`,
        fontFamily: "'Space Mono', monospace", fontSize: 11, color: theme.textDim,
      }}>
        No events in current view.
      </div>
    );
  }

  const critCount = events.filter(e => e.risk_level === "CRITICAL").length;
  const highCount = events.filter(e => e.risk_level === "HIGH").length;
  const directCount = events.filter(e => e.relevance === "direct").length;
  const spilloverCount = events.filter(e => e.relevance === "spillover").length;
  const avgRisk = Math.round(events.reduce((s, e) => s + e.risk_score, 0) / events.length);
  const avgConf = Math.round(events.reduce((s, e) => s + e.confidence, 0) / events.length);
  const sectors = [...new Set(events.map(e => e.sector))].length;
  const regions = [...new Set(events.map(e => e.region))].length;

  const hasRelevance = events.some(e => e.relevance && e.relevance !== "global");

  const stats = [
    {
      label: "TOTAL EVENTS", value: events.length, color: "#3b82f6",
      sub: hasRelevance ? `${directCount} direct, ${spilloverCount} spillover` : `${critCount} critical, ${highCount} high`
    },
    {
      label: "AVG RISK SCORE", value: avgRisk,
      color: avgRisk >= 70 ? "#ef4444" : avgRisk >= 50 ? "#f97316" : "#22c55e",
      sub: avgRisk >= 70 ? "ELEVATED" : avgRisk >= 50 ? "MODERATE" : "LOW",
      trend: avgRisk >= 60 ? "up" : avgRisk <= 30 ? "down" : null
    },
    {
      label: "AVG CONFIDENCE", value: `${avgConf}%`,
      color: avgConf >= 85 ? "#22c55e" : "#eab308",
      sub: "across all sources"
    },
    {
      label: "SECTORS AFFECTED", value: sectors, color: "#a855f7",
      sub: `${regions} region${regions !== 1 ? "s" : ""} active`
    },
  ];

  return (
    <div className="dashboard-stats" style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
      padding: "12px 24px", borderBottom: `1px solid ${theme.border}`,
      flexShrink: 0,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: theme.bgCard, border: `1px solid ${theme.border}`,
          borderRadius: 6, padding: "10px 14px", borderTop: `2px solid ${s.color}`,
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textMuted, letterSpacing: "0.12em", marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: s.color }}>
              {s.value}
            </span>
            {s.trend === "up" && <span style={{ fontSize: 12, color: "#ef4444" }}>▲</span>}
            {s.trend === "down" && <span style={{ fontSize: 12, color: "#22c55e" }}>▼</span>}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim, marginTop: 4 }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
