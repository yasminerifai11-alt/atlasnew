import { useTheme } from "../../context/ThemeContext";
import { RISK_COLORS, SECTOR_ICONS } from "../../data/events";
import RiskBadge from "../shared/RiskBadge";

export default function EventGroup({ events, selected, onSelect, groupBy }) {
  const { theme } = useTheme();

  const groups = {};
  events.forEach(ev => {
    const key = groupBy === "region" ? ev.region : ev.sector;
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const maxA = Math.max(...groups[a].map(e => e.risk_score));
    const maxB = Math.max(...groups[b].map(e => e.risk_score));
    return maxB - maxA;
  });

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
      {sortedKeys.map(key => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textMuted,
            letterSpacing: "0.1em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6,
            padding: "4px 0", borderBottom: `1px solid ${theme.border}`
          }}>
            {groupBy === "sector" && SECTOR_ICONS[key]} {key} ({groups[key].length})
          </div>
          {groups[key].map(ev => {
            const c = RISK_COLORS[ev.risk_level];
            const isSelected = selected?.id === ev.id;
            return (
              <div key={ev.id} onClick={() => onSelect(ev)} style={{
                padding: "8px 10px", cursor: "pointer", borderRadius: 4,
                border: `1px solid ${isSelected ? c.border : "transparent"}`,
                background: isSelected ? c.bg : "transparent",
                marginBottom: 2, transition: "all 0.15s",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 12, color: theme.text, fontWeight: isSelected ? 600 : 400 }}>
                  {ev.title}
                </span>
                <RiskBadge level={ev.risk_level} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
