import { useState, useEffect } from "react";
import { generateBrief } from "../../services/atlasAI";
import { useNotifications } from "../../context/NotificationContext";

export default function AIBriefPanel({ event }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiError, setAiError] = useState(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    setAiSummary(null);
    setAiError(null);
  }, [event.id]);

  async function handleGenerate() {
    setAiLoading(true);
    setAiError(null);
    try {
      const text = await generateBrief(event);
      setAiSummary(text);
      addNotification("Atlas AI brief generated successfully", "INFO");
    } catch (err) {
      const msg = err.message || "Atlas AI analysis temporarily unavailable.";
      setAiError(msg);
      addNotification(`AI analysis failed: ${msg}`, "CRITICAL");
    }
    setAiLoading(false);
  }

  return (
    <div style={{
      background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: 8, padding: "16px 18px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#3b82f6", letterSpacing: "0.12em" }}>
          ◆ ATLAS AI — DEEP INTELLIGENCE BRIEF
        </div>
        {!aiSummary && !aiError && (
          <button onClick={handleGenerate} disabled={aiLoading} style={{
            padding: "6px 16px", borderRadius: 4, cursor: aiLoading ? "wait" : "pointer",
            background: aiLoading ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.2)",
            border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa",
            fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.08em",
            transition: "all 0.15s"
          }}>
            {aiLoading ? "ANALYZING..." : "▶ GENERATE BRIEF"}
          </button>
        )}
      </div>
      {!aiSummary && !aiLoading && !aiError && (
        <div style={{ fontSize: 13, color: "#334155", fontStyle: "italic" }}>
          Click "Generate Brief" to run Atlas AI deep analysis on this event.
        </div>
      )}
      {aiLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 16, height: 16, border: "2px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#3b82f6" }}>
            Atlas AI processing intelligence...
          </span>
        </div>
      )}
      {aiError && (
        <div style={{ fontSize: 13, color: "#ef4444", lineHeight: 1.6 }}>
          ⚠ {aiError}
        </div>
      )}
      {aiSummary && (
        <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {aiSummary}
        </div>
      )}
    </div>
  );
}
