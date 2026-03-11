import { RISK_COLORS } from "../../data/events";
import PulsingDot from "./PulsingDot";

export default function RiskBadge({ level, score }) {
  const c = RISK_COLORS[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 4,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.08em", fontFamily: "'Space Mono', monospace"
    }}>
      <PulsingDot color={c.dot} /> {level} {score && `· ${score}`}
    </span>
  );
}
