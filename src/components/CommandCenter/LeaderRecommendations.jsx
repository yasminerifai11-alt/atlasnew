import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { LEADER_PERSONAS, analyzeForLeader } from "../../data/leaders";
import { RISK_COLORS } from "../../data/events";
import { useClock } from "../../hooks/useClock";

const PRIORITY_STYLES = {
  IMMEDIATE: { bg: "rgba(239,68,68,0.10)", border: "#ef4444", text: "#ef4444", label: "IMMEDIATE", dot: "#ef4444" },
  "SHORT-TERM": { bg: "rgba(245,158,11,0.10)", border: "#f59e0b", text: "#f59e0b", label: "24–48 HRS", dot: "#f59e0b" },
  MONITOR: { bg: "rgba(59,130,246,0.08)", border: "#3b82f6", text: "#3b82f6", label: "MONITOR", dot: "#3b82f6" },
};

// ─── Situation Summary Banner ────────────────────────────────────────
function SituationSummary({ events, analyses }) {
  const critCount = events.filter(e => e.risk_level === "CRITICAL").length;
  const highCount = events.filter(e => e.risk_level === "HIGH").length;
  const sectors = [...new Set(events.map(e => e.sector))];
  const regions = [...new Set(events.map(e => e.region))];
  const maxRisk = Math.max(...events.map(e => e.risk_score), 0);
  const posture = maxRisk >= 80 ? "CRITICAL" : maxRisk >= 60 ? "ELEVATED" : maxRisk >= 40 ? "GUARDED" : "NOMINAL";
  const postureColor = RISK_COLORS[posture === "ELEVATED" ? "HIGH" : posture === "GUARDED" ? "MEDIUM" : posture] || RISK_COLORS.LOW;
  const immediateActions = analyses.reduce((sum, a) => sum + a.recommendations.filter(r => r.priority === "IMMEDIATE").length, 0);

  // Build narrative
  const narrativeParts = [];
  if (critCount > 0) narrativeParts.push(`${critCount} critical-severity event${critCount > 1 ? "s" : ""}`);
  if (highCount > 0) narrativeParts.push(`${highCount} high-severity event${highCount > 1 ? "s" : ""}`);
  const narrative = `Atlas Command is tracking ${events.length} active incidents across ${regions.length} region${regions.length > 1 ? "s" : ""}, including ${narrativeParts.join(" and ")}. ${sectors.length} sector${sectors.length > 1 ? "s are" : " is"} affected with cross-domain cascading effects detected.`;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, padding: "20px 24px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: "#3b82f6", letterSpacing: "0.12em",
        }}>
          EXECUTIVE SITUATION SUMMARY
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 4,
          background: postureColor.bg, border: `1px solid ${postureColor.border}`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: postureColor.dot, animation: posture === "CRITICAL" ? "ping 1.5s infinite" : "none" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: postureColor.text, fontWeight: 700, letterSpacing: "0.08em" }}>
            POSTURE: {posture}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, marginBottom: 16 }}>
        {narrative}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <MiniStat label="ACTIVE EVENTS" value={events.length} color="#3b82f6" />
        <MiniStat label="CRITICAL" value={critCount} color="#ef4444" />
        <MiniStat label="SECTORS HIT" value={sectors.length} color="#f59e0b" />
        <MiniStat label="ACTIONS NEEDED" value={immediateActions} color="#ef4444" sub="immediate" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, sub }) {
  return (
    <div style={{
      textAlign: "center", padding: "12px 8px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)",
      borderRadius: 6,
    }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, color, fontWeight: 700 }}>{value}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#475569", letterSpacing: "0.1em", marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#334155", letterSpacing: "0.08em", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// ─── Event Correlation Map ───────────────────────────────────────────
function CorrelationMap({ events }) {
  // Show how events connect across sectors
  const connections = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      const reasons = [];
      // Same sector = direct amplification
      if (a.sector === b.sector) reasons.push("same sector — compound risk");
      // Energy + Maritime = supply chain cascade
      if ((a.sector === "ENERGY" && b.sector === "MARITIME") || (a.sector === "MARITIME" && b.sector === "ENERGY"))
        reasons.push("energy-maritime nexus — export/transport disruption");
      if ((a.sector === "ENERGY" && b.sector === "SUPPLY CHAIN") || (a.sector === "SUPPLY CHAIN" && b.sector === "ENERGY"))
        reasons.push("energy disruption cascading into supply chain delays");
      if ((a.sector === "AVIATION" && (b.event_type === "STRIKE")) || (b.sector === "AVIATION" && (a.event_type === "STRIKE")))
        reasons.push("military activity correlates with airspace restrictions");
      // Geographic proximity
      const dist = Math.sqrt((a.latitude - b.latitude) ** 2 + (a.longitude - b.longitude) ** 2);
      if (dist < 5) reasons.push("geographic proximity — potential coordinated action");

      if (reasons.length > 0) {
        connections.push({ a, b, reasons, strength: reasons.length >= 2 ? "strong" : "moderate" });
      }
    }
  }

  if (connections.length === 0) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 10, padding: "20px 24px", marginBottom: 16,
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10,
        color: "#f59e0b", letterSpacing: "0.12em", marginBottom: 14,
      }}>
        EVENT CORRELATION ANALYSIS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {connections.map((conn, i) => (
          <div key={i} style={{
            padding: "12px 16px",
            background: conn.strength === "strong" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.05)",
            border: `1px solid ${conn.strength === "strong" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)"}`,
            borderRadius: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
                color: conn.strength === "strong" ? "#ef4444" : "#f59e0b",
                padding: "2px 8px", borderRadius: 3,
                background: conn.strength === "strong" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)",
              }}>
                {conn.strength === "strong" ? "STRONG LINK" : "CORRELATED"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{conn.a.title}</span>
              <span style={{ fontSize: 11, color: "#475569" }}>↔</span>
              <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{conn.b.title}</span>
            </div>
            {conn.reasons.map((r, j) => (
              <div key={j} style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, paddingLeft: 8, borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                {r}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sector Leader Card ──────────────────────────────────────────────
function RawEventDetail({ event }) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div style={{ marginTop: 6 }}>
      <button onClick={(e) => { e.stopPropagation(); setShowRaw(s => !s); }} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: "#475569", letterSpacing: "0.06em",
        padding: 0, textDecoration: "underline", textUnderlineOffset: 2,
      }}>
        {showRaw ? "HIDE RAW INTEL" : "VIEW RAW INTEL & SOURCES"}
      </button>
      {showRaw && (
        <div style={{
          marginTop: 8, padding: "10px 14px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.04)",
          fontSize: 11, color: "#64748b", lineHeight: 1.7,
        }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>SOURCE: </span>
            <span style={{ color: "#94a3b8" }}>{event.source}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>CONFIDENCE: </span>
            <span style={{ color: "#94a3b8" }}>{event.confidence}%</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>RISK SCORE: </span>
            <span style={{ color: "#94a3b8" }}>{event.risk_score}/100</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>TIMESTAMP: </span>
            <span style={{ color: "#94a3b8" }}>{new Date(event.event_time).toUTCString()}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>FULL REPORT: </span>
            <span style={{ color: "#94a3b8" }}>{event.what_is_happening}</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>SIGNIFICANCE: </span>
            <span style={{ color: "#94a3b8" }}>{event.why_it_matters}</span>
          </div>
          <div>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>FORECAST: </span>
            <span style={{ color: "#94a3b8" }}>{event.what_next}</span>
          </div>
          {event.nearby_infra && event.nearby_infra.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#475569", letterSpacing: "0.08em" }}>INFRASTRUCTURE EXPOSURE:</span>
              {event.nearby_infra.map((inf, j) => (
                <div key={j} style={{ marginLeft: 8, marginTop: 3, color: "#94a3b8" }}>
                  · {inf.name} ({inf.type}) — {inf.distance}km
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderCard({ analysis, isExpanded, onToggle }) {
  const { leader, threatLevel, directEvents, relatedEvents, correlations, recommendations, urgencyHours } = analysis;
  const riskColor = RISK_COLORS[threatLevel] || RISK_COLORS.LOW;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${isExpanded ? leader.color + "44" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 10,
      borderLeft: `3px solid ${leader.color}`,
      overflow: "hidden",
      transition: "border-color 0.2s ease",
    }}>
      {/* Collapsed header */}
      <div onClick={onToggle} style={{
        padding: "16px 20px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8,
            background: leader.color + "15",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            {leader.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700,
                color: "#e2e8f0", letterSpacing: "0.04em",
              }}>
                {leader.role.toUpperCase()}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: 3, fontSize: 9,
                fontFamily: "'Space Mono', monospace", fontWeight: 700,
                background: riskColor.bg, border: `1px solid ${riskColor.border}`,
                color: riskColor.text, letterSpacing: "0.08em",
              }}>
                {threatLevel}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: urgencyHours <= 4 ? "#ef4444" : urgencyHours <= 12 ? "#f59e0b" : "#64748b",
              }}>
                {urgencyHours}H DECISION WINDOW
              </span>
            </div>
            {/* One-line situation summary when collapsed */}
            {!isExpanded && (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {directEvents.length} direct threat{directEvents.length !== 1 ? "s" : ""}{relatedEvents.length > 0 ? ` + ${relatedEvents.length} cascading` : ""} — {recommendations.filter(r => r.priority === "IMMEDIATE").length} immediate action{recommendations.filter(r => r.priority === "IMMEDIATE").length !== 1 ? "s" : ""} required
              </div>
            )}
          </div>
        </div>
        <span style={{
          color: "#475569", fontSize: 12,
          transition: "transform 0.2s",
          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}>▼</span>
      </div>

      {/* Expanded briefing */}
      {isExpanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {/* How this leader should think about the situation */}
          <div style={{
            margin: "16px 0 14px",
            padding: "12px 16px",
            background: leader.color + "0a",
            borderLeft: `3px solid ${leader.color}`,
            borderRadius: "0 8px 8px 0",
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: leader.color, letterSpacing: "0.1em", marginBottom: 5,
            }}>
              YOUR STRATEGIC QUESTION
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.5 }}>
              "{leader.thinkingFrame}"
            </div>
          </div>

          {/* What's happening in their domain */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: "#64748b", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              SITUATION IN YOUR DOMAIN
            </div>
            {directEvents.map((e, i) => (
              <div key={i} style={{
                padding: "10px 14px", marginBottom: 6,
                background: "rgba(239,68,68,0.04)",
                borderLeft: "3px solid #ef4444",
                borderRadius: "0 6px 6px 0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#ef4444", fontWeight: 700, letterSpacing: "0.08em" }}>DIRECT THREAT</span>
                  <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{e.title}</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                  {e.what_is_happening.split(".").slice(0, 2).join(".") + "."}
                </div>
                <RawEventDetail event={e} />
              </div>
            ))}
            {relatedEvents.map((e, i) => (
              <div key={i} style={{
                padding: "10px 14px", marginBottom: 6,
                background: "rgba(59,130,246,0.04)",
                borderLeft: "3px solid #3b82f6",
                borderRadius: "0 6px 6px 0",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.08em" }}>CASCADE</span>
                  <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{e.title}</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                  Disruption in {e.sector.toLowerCase()} sector is spilling into your domain.
                </div>
                <RawEventDetail event={e} />
              </div>
            ))}
          </div>

          {/* Correlations */}
          {correlations.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9,
                color: "#64748b", letterSpacing: "0.1em", marginBottom: 10,
              }}>
                WHY THIS IS WORSE THAN IT LOOKS
              </div>
              {correlations.map((c, i) => (
                <div key={i} style={{
                  padding: "8px 14px", marginBottom: 4,
                  background: "rgba(245,158,11,0.06)",
                  borderLeft: "3px solid #f59e0b",
                  borderRadius: "0 6px 6px 0",
                  fontSize: 12, color: "#f59e0b", lineHeight: 1.5,
                }}>
                  {c.text}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations — the key section */}
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: "#64748b", letterSpacing: "0.1em", marginBottom: 10,
            }}>
              WHAT YOU SHOULD DO
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recommendations.map((rec, i) => {
                const ps = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.MONITOR;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "10px 14px",
                    background: ps.bg,
                    borderRadius: 6,
                    borderLeft: `3px solid ${ps.border}`,
                  }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 8, fontWeight: 700,
                      color: ps.text, letterSpacing: "0.06em",
                      padding: "3px 8px", borderRadius: 3,
                      background: ps.border + "20",
                      whiteSpace: "nowrap", marginTop: 1,
                      minWidth: 65, textAlign: "center",
                    }}>
                      {ps.label}
                    </span>
                    <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
                      {rec.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Leader View ────────────────────────────────────────────────
export default function LeaderRecommendations({ events, onBack }) {
  const { theme } = useTheme();
  const time = useClock();
  const [expandedId, setExpandedId] = useState(null);

  // Auto-expand the most critical leader on mount
  const analyses = LEADER_PERSONAS
    .map(leader => analyzeForLeader(leader, events))
    .filter(Boolean)
    .sort((a, b) => b.maxRisk - a.maxRisk);

  useEffect(() => {
    if (analyses.length > 0 && expandedId === null) {
      setExpandedId(analyses[0].leader.id);
    }
  }, []);

  // ESC to go back
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onBack(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      background: theme.bg || "#080c14",
      padding: "0 0 40px",
    }}>
      {/* Top bar */}
      <div style={{
        padding: "16px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.01)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "7px 14px", cursor: "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: "#94a3b8", letterSpacing: "0.08em",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            ← COMMAND VIEW
          </button>
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700,
              color: "#e2e8f0", letterSpacing: "0.06em",
            }}>
              LEADER BRIEFING
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: "#475569", letterSpacing: "0.1em",
            }}>
              ATLAS COMMAND · SECTOR INTELLIGENCE · {time.toISOString().split("T")[0]}
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: "#475569", letterSpacing: "0.06em",
        }}>
          {time.toUTCString().split(" ").slice(0, 5).join(" ")}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 28px", maxWidth: 960, margin: "0 auto" }}>
        {/* Situation summary */}
        <SituationSummary events={events} analyses={analyses} />

        {/* Correlation analysis */}
        <CorrelationMap events={events} />

        {/* Sector leaders */}
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: "#3b82f6", letterSpacing: "0.12em", marginBottom: 12,
        }}>
          SECTOR-BY-SECTOR RECOMMENDATIONS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {analyses.map(analysis => (
            <LeaderCard
              key={analysis.leader.id}
              analysis={analysis}
              isExpanded={expandedId === analysis.leader.id}
              onToggle={() => setExpandedId(prev => prev === analysis.leader.id ? null : analysis.leader.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24, padding: "14px 0",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#1e293b", letterSpacing: "0.1em" }}>
            ATLAS COMMAND · LEADER INTELLIGENCE MODULE · CLASSIFIED
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#1e293b", letterSpacing: "0.1em" }}>
            GENERATED {new Date().toISOString().replace("T", " · ").split(".")[0]} UTC
          </div>
        </div>
      </div>
    </div>
  );
}
