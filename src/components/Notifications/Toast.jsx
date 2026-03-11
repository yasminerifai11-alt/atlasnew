import { RISK_COLORS } from "../../data/events";

const LEVEL_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
  INFO: "#3b82f6",
};

export default function Toast({ notification, onDismiss }) {
  const color = LEVEL_COLORS[notification.level] || LEVEL_COLORS.INFO;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 14px", borderRadius: 6,
      background: "rgba(8,12,20,0.95)", border: "1px solid rgba(255,255,255,0.1)",
      borderLeft: `3px solid ${color}`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      animation: "slideInRight 0.3s ease",
      maxWidth: 340, minWidth: 260,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color, letterSpacing: "0.1em", marginBottom: 4 }}>
          {notification.level}
        </div>
        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
          {notification.message}
        </div>
      </div>
      <button onClick={() => onDismiss(notification.id)} style={{
        background: "none", border: "none", color: "#475569",
        cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1
      }}>×</button>
    </div>
  );
}
