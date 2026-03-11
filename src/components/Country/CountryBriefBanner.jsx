import { COUNTRIES, getCountryEvents, RISK_COLORS } from "../../data/events";
import { useTheme } from "../../context/ThemeContext";

export default function CountryBriefBanner({ countryCodes }) {
  const { theme } = useTheme();
  if (!countryCodes || countryCodes.includes("ALL")) return null;

  const events = getCountryEvents(countryCodes);
  const directEvents = events.filter(e => e.relevance === "direct");
  const spilloverEvents = events.filter(e => e.relevance === "spillover");
  const maxRisk = events.length > 0 ? Math.max(...events.map(e => e.risk_score)) : 0;
  const threatLevel = maxRisk >= 75 ? "CRITICAL" : maxRisk >= 50 ? "HIGH" : maxRisk >= 25 ? "MODERATE" : "LOW";
  const threatColor = maxRisk >= 75 ? "#ef4444" : maxRisk >= 50 ? "#f97316" : maxRisk >= 25 ? "#eab308" : "#22c55e";

  const isMulti = countryCodes.length > 1;
  const flags = countryCodes.map(c => COUNTRIES[c]?.flag).filter(Boolean).join(" ");
  const names = countryCodes.map(c => COUNTRIES[c]?.label).filter(Boolean);
  const title = isMulti
    ? `${names.length} COUNTRIES — COMBINED VIEW`
    : `${names[0]?.toUpperCase()} COMMAND VIEW`;

  return (
    <div style={{
      background: `${threatColor}10`,
      borderBottom: `1px solid ${threatColor}40`,
      padding: "10px 24px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Top row — stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: isMulti ? 16 : 22 }}>{flags}</span>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color: theme.text, letterSpacing: "0.06em" }}>
              {title}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
              {isMulti ? `Comparing: ${names.join(", ")}` : "National threat assessment for senior leadership"}
            </div>
          </div>
        </div>

        <div style={{ height: 28, width: 1, background: theme.border }} />

        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <Stat label="THREAT LEVEL" value={threatLevel} color={threatColor} />
          <Stat label="DIRECT EVENTS" value={directEvents.length} color={theme.text} />
          <Stat label="SPILLOVER THREATS" value={spilloverEvents.length} color="#f59e0b" />
          <Stat label="MAX RISK SCORE" value={`${maxRisk}/100`} color={threatColor} />
        </div>

        {directEvents.length > 0 && (
          <>
            <div style={{ height: 28, width: 1, background: theme.border }} />
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: theme.textDim, letterSpacing: "0.1em", marginBottom: 3 }}>
                PRIORITY EVENTS
              </div>
              {directEvents.map(e => (
                <div key={e.id} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: RISK_COLORS[e.risk_level]?.text || theme.text }}>
                  ● {e.title}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Spillover reason row */}
      {spilloverEvents.some(e => e.spillover_reason) && (
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#f59e0b", letterSpacing: "0.1em", marginBottom: 5 }}>
            SPILLOVER IMPACT ANALYSIS
          </div>
          {spilloverEvents.filter(e => e.spillover_reason).map(e => (
            <div key={e.id} style={{
              display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start",
            }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9,
                padding: "1px 5px", borderRadius: 2, flexShrink: 0, marginTop: 1,
                background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.3)", whiteSpace: "nowrap",
              }}>
                ● {e.title.split("—")[0].trim().substring(0, 30)}
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: theme.textMuted, lineHeight: 1.4 }}>
                {e.spillover_reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#64748b", letterSpacing: "0.1em" }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}
