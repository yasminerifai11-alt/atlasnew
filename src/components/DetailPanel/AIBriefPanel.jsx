import { useState, useEffect, useRef } from "react";
import { generateBrief } from "../../services/atlasAI";
import { useNotifications } from "../../context/NotificationContext";

export default function AIBriefPanel({ event }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const { addNotification } = useNotifications();
  const lastEventFingerprint = useRef("");

  // Reset when event changes
  useEffect(() => {
    const fp = `${event.id}_${event.title?.slice(0, 30)}`;
    if (fp !== lastEventFingerprint.current) {
      lastEventFingerprint.current = fp;
      setAiSummary(null);
      setAiError(null);
      setGeneratedAt(null);
    }
  }, [event.id, event.title]);

  async function handleGenerate() {
    setAiLoading(true);
    setAiError(null);
    try {
      const text = await generateBrief(event);
      setAiSummary(text);
      setGeneratedAt(new Date());
      addNotification("Atlas AI brief generated successfully", "INFO");
    } catch (err) {
      const msg = err.message || "Atlas AI analysis temporarily unavailable.";
      setAiError(msg);
      addNotification(`AI analysis failed: ${msg}`, "CRITICAL");
    }
    setAiLoading(false);
  }

  const ageStr = generatedAt
    ? `Generated ${Math.floor((Date.now() - generatedAt.getTime()) / 60000)}m ago`
    : null;

  return (
    <div style={{
      background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: 8, padding: "16px 18px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#3b82f6", letterSpacing: "0.12em" }}>
            ATLAS AI — DEEP INTELLIGENCE BRIEF
          </span>
          {generatedAt && (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b" }}>
              {ageStr}
            </span>
          )}
        </div>
        {(!aiSummary || aiError) && !aiLoading && (
          <button onClick={handleGenerate} disabled={aiLoading} style={{
            padding: "6px 16px", borderRadius: 4, cursor: aiLoading ? "wait" : "pointer",
            background: aiLoading ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.2)",
            border: "1px solid rgba(59,130,246,0.4)", color: "#60a5fa",
            fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.08em",
            transition: "all 0.15s"
          }}>
            {aiLoading ? "ANALYZING..." : "GENERATE BRIEF"}
          </button>
        )}
        {aiSummary && !aiLoading && (
          <button onClick={handleGenerate} style={{
            padding: "4px 10px", borderRadius: 3, cursor: "pointer",
            background: "transparent",
            border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa",
            fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.08em",
          }}>
            REGENERATE
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
          {aiError}
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
