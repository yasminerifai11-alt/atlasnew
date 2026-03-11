export default function ConfidenceBar({ value }) {
  const color = value >= 85 ? "#22c55e" : value >= 60 ? "#eab308" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color, minWidth: 34 }}>{value}%</span>
    </div>
  );
}
