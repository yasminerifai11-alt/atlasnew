import IntelCard from "./IntelCard";

export default function IntelGrid({ event }) {
  return (
    <div className="intel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      <IntelCard label="SITUATION — WHAT IS HAPPENING" icon="01" color="#3b82f6">
        {event.what_is_happening}
      </IntelCard>
      <IntelCard label="SIGNIFICANCE — WHY IT MATTERS" icon="02" color="#a855f7">
        {event.why_it_matters}
      </IntelCard>
      <IntelCard label="FORECAST — WHAT HAPPENS NEXT" icon="03" color="#f59e0b">
        {event.what_next}
      </IntelCard>
      <div style={{
        background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 8, padding: "16px 18px", borderTop: "2px solid #ef4444"
      }}>
        <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#ef4444", letterSpacing: "0.12em", marginBottom: 10 }}>
          04 COMMAND — WHAT LEADERS SHOULD DO
        </div>
        <ol style={{ margin: 0, padding: "0 0 0 16px" }}>
          {event.actions.map((a, i) => (
            <li key={i} style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.8, marginBottom: 2 }}>{a}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
