import { RISK_COLORS, EVENT_TYPE_LABELS, SECTOR_ICONS } from "../../data/events";
import { useTheme } from "../../context/ThemeContext";
import RiskBadge from "../shared/RiskBadge";

export default function EventCard({ event, selected, onClick }) {
  const { theme } = useTheme();
  const c = RISK_COLORS[event.risk_level];
  const relevance = event.relevance;

  return (
    <div onClick={onClick} title={event.spillover_reason || ""} style={{
      padding: "12px 14px", cursor: "pointer", borderRadius: 6,
      border: `1px solid ${selected ? c.border : theme.border}`,
      background: selected ? c.bg : theme.bgCard,
      marginBottom: 6, transition: "all 0.15s",
      borderLeft: `3px solid ${c.border}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: theme.textMuted, letterSpacing: "0.1em" }}>
            {EVENT_TYPE_LABELS[event.event_type]} · {SECTOR_ICONS[event.sector]}
          </span>
          {relevance && relevance !== "global" && (
            <span style={{
              fontSize: 8, fontFamily: "'Space Mono', monospace",
              padding: "1px 5px", borderRadius: 2, letterSpacing: "0.08em",
              background: relevance === "direct" ? "rgba(59,130,246,0.2)" : "rgba(245,158,11,0.2)",
              color: relevance === "direct" ? "#60a5fa" : "#f59e0b",
              border: `1px solid ${relevance === "direct" ? "rgba(59,130,246,0.4)" : "rgba(245,158,11,0.4)"}`,
            }}>
              {relevance === "direct" ? "DIRECT" : "SPILLOVER"}
            </span>
          )}
        </div>
        <RiskBadge level={event.risk_level} />
      </div>
      <div style={{ fontSize: 13, color: theme.text, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>
        {event.title}
      </div>
      <div style={{ fontSize: 11, color: theme.textDim }}>
        {event.region} · {new Date(event.event_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
      </div>
      {/* Spillover reason inline */}
      {relevance === "spillover" && event.spillover_reason && (
        <div style={{
          marginTop: 6, padding: "5px 8px", borderRadius: 4,
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
          fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#d97706",
          lineHeight: 1.45,
        }}>
          {event.spillover_reason}
        </div>
      )}
    </div>
  );
}
