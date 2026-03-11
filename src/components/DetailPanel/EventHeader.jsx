import { EVENT_TYPE_LABELS } from "../../data/events";
import RiskBadge from "../shared/RiskBadge";
import ConfidenceBar from "../shared/ConfidenceBar";

export default function EventHeader({ event }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#475569", letterSpacing: "0.12em", marginBottom: 6 }}>
            {EVENT_TYPE_LABELS[event.event_type]} ALERT · {event.region} · SOURCE: {event.source}
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: 1.3 }}>
            {event.title}
          </h1>
        </div>
        <RiskBadge level={event.risk_level} score={event.risk_score} />
      </div>
      <div className="event-meta" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#64748b" }}>
          {new Date(event.event_time).toUTCString()}
        </span>
        <span style={{ color: "#1e3a5f" }}>·</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#64748b" }}>
          SECTOR: {event.sector}
        </span>
        <span style={{ color: "#1e3a5f" }}>·</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 200 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
            CONFIDENCE:
          </span>
          <ConfidenceBar value={event.confidence} />
        </div>
      </div>
    </div>
  );
}
