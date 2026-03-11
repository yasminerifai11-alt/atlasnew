export default function InfraExposure({ infra }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 8, padding: "16px 18px", marginBottom: 20
    }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#64748b", letterSpacing: "0.12em", marginBottom: 12 }}>
        INFRASTRUCTURE EXPOSURE ANALYSIS
      </div>
      <div className="infra-row" style={{ display: "flex", gap: 10 }}>
        {infra.map((inf, i) => (
          <div key={i} style={{
            flex: 1, padding: "10px 12px", borderRadius: 6,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>{inf.name}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{inf.type}</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              color: inf.distance < 15 ? "#ef4444" : inf.distance < 30 ? "#f97316" : "#eab308"
            }}>
              {inf.distance} km proximity
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
