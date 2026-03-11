export default function PulsingDot({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.5,
        animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite"
      }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "block" }} />
    </span>
  );
}
