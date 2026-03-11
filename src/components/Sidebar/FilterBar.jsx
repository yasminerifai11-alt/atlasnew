import { RISK_LEVELS } from "../../data/events";

export default function FilterBar({ filter, setFilter }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {RISK_LEVELS.map(l => (
        <button key={l} onClick={() => setFilter(l)} style={{
          padding: "3px 8px", borderRadius: 3, cursor: "pointer",
          fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.08em",
          border: filter === l ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
          background: filter === l ? "rgba(59,130,246,0.2)" : "transparent",
          color: filter === l ? "#60a5fa" : "#64748b",
          transition: "all 0.1s"
        }}>{l}</button>
      ))}
    </div>
  );
}
