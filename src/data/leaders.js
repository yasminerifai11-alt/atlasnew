// Sector leader personas — each thinks about events through their domain lens
export const LEADER_PERSONAS = [
  {
    id: "energy",
    role: "Energy Minister",
    domain: "ENERGY",
    icon: "⚡",
    color: "#f59e0b",
    concerns: ["oil production", "pipeline security", "export terminal integrity", "fuel reserves", "pricing stability"],
    thinkingFrame: "How does this affect our energy supply, export capacity, and price exposure?",
    sectors: ["ENERGY"],
    relatedSectors: ["MARITIME", "SUPPLY CHAIN", "INFRASTRUCTURE"],
  },
  {
    id: "defense",
    role: "National Security Advisor",
    domain: "DEFENSE",
    icon: "🛡",
    color: "#ef4444",
    concerns: ["military threat", "airspace integrity", "border security", "force readiness", "allied coordination"],
    thinkingFrame: "What is the threat to sovereign territory, and do we need to escalate force posture?",
    sectors: ["ENERGY", "AVIATION", "MARITIME", "INFRASTRUCTURE", "SUPPLY CHAIN"],
    relatedSectors: [],
  },
  {
    id: "maritime",
    role: "Maritime Authority Chief",
    domain: "MARITIME",
    icon: "⚓",
    color: "#06b6d4",
    concerns: ["port operations", "shipping lane safety", "vessel tracking", "chokepoint security", "anchorage capacity"],
    thinkingFrame: "Are our ports operational? Are vessels safe? What rerouting is needed?",
    sectors: ["MARITIME", "SUPPLY CHAIN"],
    relatedSectors: ["ENERGY"],
  },
  {
    id: "aviation",
    role: "Aviation Authority Director",
    domain: "AVIATION",
    icon: "✈",
    color: "#8b5cf6",
    concerns: ["airspace safety", "flight rerouting", "airport operations", "ATC capacity", "NOTAM compliance"],
    thinkingFrame: "Is our airspace safe? What flights need rerouting? What's the capacity impact?",
    sectors: ["AVIATION"],
    relatedSectors: ["INFRASTRUCTURE"],
  },
  {
    id: "trade",
    role: "Trade & Supply Chain Minister",
    domain: "TRADE",
    icon: "📦",
    color: "#22c55e",
    concerns: ["import/export flow", "cargo delays", "port access", "freight costs", "food & medicine supply"],
    thinkingFrame: "What goods are stuck? What costs are rising? What essential supplies are at risk?",
    sectors: ["SUPPLY CHAIN"],
    relatedSectors: ["MARITIME", "ENERGY"],
  },
  {
    id: "infrastructure",
    role: "Infrastructure Minister",
    domain: "INFRASTRUCTURE",
    icon: "🏗",
    color: "#64748b",
    concerns: ["power grid", "water systems", "telecom", "transportation networks", "structural integrity"],
    thinkingFrame: "Is critical infrastructure operational? What damage assessment is needed?",
    sectors: ["INFRASTRUCTURE"],
    relatedSectors: ["ENERGY"],
  },
];

// Analyze events through each leader's lens
export function analyzeForLeader(leader, events) {
  // Events directly in this leader's sector
  const directEvents = events.filter(e => leader.sectors.includes(e.sector));
  // Events in related sectors that cascade
  const relatedEvents = events.filter(
    e => leader.relatedSectors.includes(e.sector) && !leader.sectors.includes(e.sector)
  );

  const allRelevant = [...directEvents, ...relatedEvents];
  if (allRelevant.length === 0) return null;

  // Calculate sector threat level
  const maxRisk = Math.max(...allRelevant.map(e => e.risk_score), 0);
  const threatLevel = maxRisk >= 80 ? "CRITICAL" : maxRisk >= 60 ? "HIGH" : maxRisk >= 40 ? "MEDIUM" : "LOW";

  // Build cross-event correlations
  const correlations = [];
  if (directEvents.length > 1) {
    correlations.push({
      type: "compound",
      text: `${directEvents.length} simultaneous events in your domain create compound risk — each amplifies the other.`,
    });
  }
  if (relatedEvents.length > 0) {
    const sectorNames = [...new Set(relatedEvents.map(e => e.sector))];
    correlations.push({
      type: "cascade",
      text: `Cascading pressure from ${sectorNames.join(", ")} sector${sectorNames.length > 1 ? "s" : ""} — indirect but operationally significant.`,
    });
  }

  // Generate situation summary from leader's perspective
  const situationLines = [];
  directEvents.forEach(e => {
    situationLines.push(`[DIRECT] ${e.title} (Risk: ${e.risk_score}) — ${e.what_is_happening.split(".")[0]}.`);
  });
  relatedEvents.forEach(e => {
    situationLines.push(`[CASCADE] ${e.title} (Risk: ${e.risk_score}) — spillover into your domain via ${e.sector.toLowerCase()} disruption.`);
  });

  // Generate leader-specific recommendations
  const recommendations = generateRecommendations(leader, directEvents, relatedEvents, threatLevel);

  // Calculate urgency window
  const urgencyHours = threatLevel === "CRITICAL" ? 4 : threatLevel === "HIGH" ? 12 : threatLevel === "MEDIUM" ? 48 : 72;

  return {
    leader,
    threatLevel,
    maxRisk,
    directEvents,
    relatedEvents,
    allRelevant,
    correlations,
    situationLines,
    recommendations,
    urgencyHours,
  };
}

function generateRecommendations(leader, directEvents, relatedEvents, threatLevel) {
  const recs = [];
  const hasCritical = directEvents.some(e => e.risk_level === "CRITICAL");

  // Universal urgent actions
  if (hasCritical) {
    recs.push({
      priority: "IMMEDIATE",
      text: `Convene emergency ${leader.domain.toLowerCase()} sector briefing within 2 hours`,
    });
  }

  // Leader-specific recommendations based on events
  switch (leader.id) {
    case "energy":
      if (directEvents.length > 0) {
        recs.push({ priority: "IMMEDIATE", text: "Assess current production and export capacity — identify vulnerable terminals and pipelines" });
        recs.push({ priority: "SHORT-TERM", text: "Activate strategic reserve drawdown contingency if export disruption exceeds 72 hours" });
        recs.push({ priority: "SHORT-TERM", text: "Coordinate with OPEC+ partners on emergency spare capacity allocation" });
      }
      if (relatedEvents.some(e => e.sector === "MARITIME")) {
        recs.push({ priority: "MONITOR", text: "Maritime disruptions are compounding tanker availability — prepare for shipping cost escalation" });
      }
      break;

    case "defense":
      if (directEvents.some(e => e.event_type === "STRIKE")) {
        recs.push({ priority: "IMMEDIATE", text: "Elevate force readiness to DEFCON-equivalent status; brief theater commanders" });
        recs.push({ priority: "IMMEDIATE", text: "Activate ISR assets over affected regions — confirm no secondary threats inbound" });
      }
      if (directEvents.some(e => e.event_type === "AVIATION")) {
        recs.push({ priority: "SHORT-TERM", text: "Coordinate with allied air forces on airspace deconfliction and shared radar coverage" });
      }
      recs.push({ priority: "SHORT-TERM", text: "Issue threat advisory to all diplomatic missions in affected regions" });
      recs.push({ priority: "MONITOR", text: "Cross-reference SIGINT for indicators of follow-on attacks or coordinated multi-vector threat" });
      break;

    case "maritime":
      if (directEvents.length > 0) {
        recs.push({ priority: "IMMEDIATE", text: "Issue vessel advisory for all affected shipping corridors — mandate SSAS activation" });
        recs.push({ priority: "SHORT-TERM", text: "Assess port capacity and activate overflow contingency at secondary ports" });
      }
      if (relatedEvents.some(e => e.sector === "ENERGY")) {
        recs.push({ priority: "MONITOR", text: "Energy disruptions will increase tanker re-routing — monitor anchorage queue buildup" });
      }
      recs.push({ priority: "SHORT-TERM", text: "Coordinate with P&I clubs and insurers on corridor risk re-assessment" });
      break;

    case "aviation":
      if (directEvents.length > 0) {
        recs.push({ priority: "IMMEDIATE", text: "Validate all active NOTAMs and push route advisories to operational flights immediately" });
        recs.push({ priority: "SHORT-TERM", text: "Prepare alternate routing plans — assess ATC capacity on diversion corridors" });
        recs.push({ priority: "SHORT-TERM", text: "Brief airline operators on expected closure duration and cost implications" });
      }
      recs.push({ priority: "MONITOR", text: "Watch for airspace closure expansion into adjacent FIRs" });
      break;

    case "trade":
      if (directEvents.length > 0) {
        recs.push({ priority: "IMMEDIATE", text: "Flag all critical inbound cargo (medical, food, defense) and prioritize alternative routing" });
        recs.push({ priority: "SHORT-TERM", text: "Notify importers/exporters of expected delay windows and freight cost increases" });
      }
      if (relatedEvents.length > 0) {
        recs.push({ priority: "SHORT-TERM", text: "Cross-sector disruptions are compounding — prepare supply chain resilience brief for cabinet" });
      }
      recs.push({ priority: "MONITOR", text: "Track container dwell times and freight rate indices for early warning of prolonged disruption" });
      break;

    case "infrastructure":
      if (directEvents.length > 0) {
        recs.push({ priority: "IMMEDIATE", text: "Dispatch assessment teams to all infrastructure within 20km of event epicenter" });
        recs.push({ priority: "SHORT-TERM", text: "Run grid stress tests — verify backup power systems and redundancy paths" });
      }
      if (relatedEvents.some(e => e.sector === "ENERGY")) {
        recs.push({ priority: "MONITOR", text: "Energy sector disruptions may cascade into power supply — validate fuel reserves for generators" });
      }
      recs.push({ priority: "MONITOR", text: "Continue seismic monitoring — cluster patterns may indicate elevated risk window" });
      break;
  }

  return recs;
}
