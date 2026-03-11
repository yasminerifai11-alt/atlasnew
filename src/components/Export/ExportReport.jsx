import { useTheme } from "../../context/ThemeContext";
import { RISK_COLORS, EVENT_TYPE_LABELS, SECTOR_ICONS } from "../../data/events";

function formatReportText(event) {
  const divider = "═".repeat(60);
  const lines = [
    divider,
    `  ATLAS COMMAND — INTELLIGENCE REPORT`,
    `  Classification: CONFIDENTIAL`,
    `  Generated: ${new Date().toUTCString()}`,
    divider,
    "",
    `EVENT: ${event.title}`,
    `TYPE: ${EVENT_TYPE_LABELS[event.event_type]} | SECTOR: ${event.sector} ${SECTOR_ICONS[event.sector] || ""}`,
    `REGION: ${event.region}`,
    `TIME: ${new Date(event.event_time).toUTCString()}`,
    `RISK: ${event.risk_level} (Score: ${event.risk_score}/100)`,
    `SOURCE CONFIDENCE: ${event.confidence}%`,
    `SOURCE: ${event.source}`,
    "",
    "─".repeat(60),
    "SITUATION — WHAT IS HAPPENING",
    "─".repeat(60),
    event.what_is_happening,
    "",
    "─".repeat(60),
    "SIGNIFICANCE — WHY IT MATTERS",
    "─".repeat(60),
    event.why_it_matters,
    "",
    "─".repeat(60),
    "FORECAST — WHAT HAPPENS NEXT",
    "─".repeat(60),
    event.what_next,
    "",
    "─".repeat(60),
    "COMMAND — RECOMMENDED ACTIONS",
    "─".repeat(60),
    ...event.actions.map((a, i) => `  ${i + 1}. ${a}`),
    "",
    "─".repeat(60),
    "INFRASTRUCTURE EXPOSURE",
    "─".repeat(60),
    ...event.nearby_infra.map(inf =>
      `  • ${inf.name} (${inf.type}) — ${inf.distance} km proximity`
    ),
    "",
    divider,
    "  END OF REPORT — ATLAS COMMAND",
    divider,
  ];
  return lines.join("\n");
}

export default function ExportReport({ event }) {
  const { theme } = useTheme();

  if (!event) return null;

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatReportText(event));
      alert("Report copied to clipboard.");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = formatReportText(event);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Report copied to clipboard.");
    }
  };

  const handleDownloadText = () => {
    const text = formatReportText(event);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-report-${event.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(event, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-event-${event.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const btnStyle = {
    padding: "5px 12px", borderRadius: 4, cursor: "pointer",
    fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.06em",
    border: `1px solid ${theme.border}`, background: theme.bgCard,
    color: theme.textMuted, transition: "all 0.15s",
  };

  return (
    <div style={{
      display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap",
    }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim, letterSpacing: "0.1em", marginRight: 4 }}>
        EXPORT:
      </span>
      <button onClick={handleCopyClipboard} style={btnStyle}>
        CLIPBOARD
      </button>
      <button onClick={handleDownloadText} style={btnStyle}>
        .TXT
      </button>
      <button onClick={handleDownloadJSON} style={btnStyle}>
        .JSON
      </button>
    </div>
  );
}
