export default function IntelCard({ label, icon, color, children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 8, padding: "16px 18px", borderTop: `2px solid ${color}`
    }}>
      <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color, letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
