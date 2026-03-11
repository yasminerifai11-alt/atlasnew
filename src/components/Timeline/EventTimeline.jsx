import { RISK_COLORS } from "../../data/events";

export default function EventTimeline({ events, selected, onSelect }) {
  if (events.length === 0) return null;

  const sorted = [...events].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
  const minTime = new Date(sorted[0].event_time).getTime();
  const maxTime = new Date(sorted[sorted.length - 1].event_time).getTime();
  const range = maxTime - minTime || 1;
  const now = Date.now();
  const nowPct = Math.min(100, Math.max(0, ((now - minTime) / range) * 100));

  const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "10px 24px", flexShrink: 0
    }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#334155", letterSpacing: "0.12em", marginBottom: 8 }}>
        EVENT TIMELINE
      </div>
      <div style={{ position: "relative", height: 40, overflowX: "auto" }}>
        {/* Track line */}
        <div style={{
          position: "absolute", top: 16, left: 0, right: 0, height: 2,
          background: "rgba(255,255,255,0.08)", borderRadius: 1
        }} />
        {/* Now marker */}
        {nowPct <= 100 && (
          <div style={{
            position: "absolute", left: `${nowPct}%`, top: 8, width: 1, height: 20,
            background: "rgba(59,130,246,0.5)"
          }}>
            <span style={{
              position: "absolute", top: -12, left: -8,
              fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#3b82f6",
              whiteSpace: "nowrap"
            }}>NOW</span>
          </div>
        )}
        {/* Event dots */}
        {sorted.map(ev => {
          const pct = ((new Date(ev.event_time).getTime() - minTime) / range) * 100;
          const c = RISK_COLORS[ev.risk_level];
          const isSelected = selected?.id === ev.id;
          return (
            <div
              key={ev.id}
              onClick={() => onSelect(ev)}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: isSelected ? 8 : 11,
                transform: "translateX(-50%)",
                cursor: "pointer",
                zIndex: isSelected ? 10 : 1,
              }}
            >
              <div style={{
                width: isSelected ? 14 : 10,
                height: isSelected ? 14 : 10,
                borderRadius: "50%",
                background: c.border,
                border: isSelected ? "2px solid #fff" : "1px solid rgba(0,0,0,0.3)",
                boxShadow: isSelected ? `0 0 8px ${c.border}` : "none",
                transition: "all 0.2s",
              }} />
              {isSelected && (
                <div style={{
                  position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
                  fontFamily: "'Space Mono', monospace", fontSize: 8, color: c.text,
                  whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis"
                }}>
                  {formatTime(ev.event_time)}
                </div>
              )}
            </div>
          );
        })}
        {/* Start / End labels */}
        <span style={{
          position: "absolute", bottom: 0, left: 0,
          fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#334155"
        }}>{formatTime(sorted[0].event_time)}</span>
        <span style={{
          position: "absolute", bottom: 0, right: 0,
          fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#334155"
        }}>{formatTime(sorted[sorted.length - 1].event_time)}</span>
      </div>
    </div>
  );
}
