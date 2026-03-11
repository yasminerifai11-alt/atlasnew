export default function SearchInput({ value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search events..."
        style={{
          width: "100%", padding: "8px 30px 8px 10px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 4, color: "#e2e8f0", fontSize: 12,
          fontFamily: "'Space Mono', monospace", outline: "none",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#64748b", cursor: "pointer",
            fontSize: 14, padding: "2px 4px", lineHeight: 1
          }}
        >×</button>
      )}
      {!value && (
        <span style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          color: "#334155", fontSize: 12, pointerEvents: "none"
        }}>⌕</span>
      )}
    </div>
  );
}
