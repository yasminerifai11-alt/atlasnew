/**
 * Atlas Command — 4-Component Country Instability Score Calculator
 *
 * COMPONENT 1 — INTERNAL (25%): Civil unrest, political stability, economic indicators
 * COMPONENT 2 — REGIONAL EXPOSURE (35%): Threat from neighboring countries' instability
 * COMPONENT 3 — INFRASTRUCTURE RISK (25%): Exposure of critical infrastructure to current threats
 * COMPONENT 4 — ACTIVE EVENTS (15%): Number and severity of events affecting this country
 */

import type { ApiEvent } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────

export type ThreatLevel =
  | "CRITICAL+"
  | "CRITICAL"
  | "HIGH"
  | "ELEVATED"
  | "MONITORING"
  | "STABLE";

export interface InstabilityResult {
  score: number;
  level: ThreatLevel;
  components: {
    internal: number;
    regional: number;
    infrastructure: number;
    events: number;
  };
}

// ─── Score → Threat Level ───────────────────────────────────────────

export function scoreToLevel(score: number): ThreatLevel {
  if (score >= 91) return "CRITICAL+";
  if (score >= 76) return "CRITICAL";
  if (score >= 61) return "HIGH";
  if (score >= 41) return "ELEVATED";
  if (score >= 21) return "MONITORING";
  return "STABLE";
}

export function levelToColor(level: ThreatLevel | string): string {
  switch (level) {
    case "CRITICAL+": return "#7f1d1d";
    case "CRITICAL": return "#dc2626";
    case "HIGH": return "#ea580c";
    case "ELEVATED": return "#ca8a04";
    case "MONITORING": return "#3b82f6";
    case "STABLE": return "#16a34a";
    default: return "#64748b";
  }
}

// ─── Neighbor Graph ─────────────────────────────────────────────────
// Maps ISO3 → list of neighboring ISO3 codes

const NEIGHBORS: Record<string, string[]> = {
  KWT: ["IRQ", "SAU", "IRN"],
  SAU: ["KWT", "IRQ", "JOR", "YEM", "OMN", "ARE", "QAT", "BHR"],
  ARE: ["SAU", "OMN", "IRN"],
  QAT: ["SAU", "BHR", "IRN"],
  BHR: ["SAU", "QAT", "IRN"],
  OMN: ["SAU", "ARE", "YEM", "IRN"],
  IRQ: ["KWT", "SAU", "JOR", "SYR", "TUR", "IRN"],
  IRN: ["IRQ", "TUR", "AFG", "PAK", "ARE", "KWT", "QAT", "BHR", "OMN"],
  YEM: ["SAU", "OMN", "DJI", "ERI", "SOM"],
  SYR: ["TUR", "IRQ", "JOR", "LBN", "PSE"],
  LBN: ["SYR", "PSE"],
  JOR: ["SAU", "IRQ", "SYR", "PSE", "EGY"],
  PSE: ["EGY", "JOR", "LBN", "SYR"],
  EGY: ["LBY", "SDN", "PSE", "JOR"],
  TUR: ["SYR", "IRQ", "IRN", "GEO", "ARM", "AZE", "BGR", "GRC"],
  PAK: ["IRN", "AFG", "IND", "CHN"],
  AFG: ["IRN", "PAK", "TKM", "UZB", "TJK", "CHN"],
  SDN: ["EGY", "LBY", "TCD", "CAF", "SSD", "ETH", "ERI"],
  SOM: ["ETH", "DJI", "KEN"],
  LBY: ["EGY", "SDN", "TCD", "NER", "DZA", "TUN"],
  UKR: ["RUS", "BLR", "POL", "SVK", "HUN", "ROU", "MDA"],
  RUS: ["UKR", "BLR", "GEO", "AZE", "KAZ", "CHN", "MNG", "FIN", "EST", "LVA", "LTU", "POL", "NOR"],
  DJI: ["ERI", "ETH", "SOM"],
  ERI: ["SDN", "ETH", "DJI"],
};

// ─── Internal Stability Baselines ───────────────────────────────────
// Pre-assessed baseline internal stability scores (higher = more unstable)

const INTERNAL_BASELINE: Record<string, number> = {
  // GCC — internally stable but externally exposed
  KWT: 15, SAU: 25, ARE: 12, QAT: 10, BHR: 20, OMN: 12,
  // Active conflict zones
  IRQ: 72, IRN: 70, YEM: 95, SYR: 94, LBN: 75, PSE: 99,
  UKR: 96, AFG: 90,
  // Fragile/elevated
  JOR: 22, EGY: 38, TUR: 32, PAK: 65, RUS: 55,
  SDN: 85, SOM: 88, LBY: 78, DJI: 32, ERI: 55,
  VEN: 68, MEX: 48,
  HTI: 92, MLI: 80, BFA: 82, MMR: 85, PRK: 55,
  TCD: 72, CAF: 80, COD: 78, NER: 68, ETH: 65,
  NGA: 55, KEN: 32, MOZ: 45, COL: 35, ECU: 38,
  PER: 30, BGD: 40, LKA: 28,
};

// ─── Infrastructure Exposure Profiles ───────────────────────────────
// Baseline infrastructure vulnerability (0-100)
// Factors: energy dependency, chokepoint exposure, cyber exposure, critical asset concentration

const INFRA_BASELINE: Record<string, number> = {
  KWT: 55, // Hormuz-only oil route, Mina Al-Ahmadi in missile range
  SAU: 58, // Huge attack surface (Aramco, NEOM, Red Sea coast, Yanbu)
  ARE: 55, // Jebel Ali (15% global containers), Barakah nuclear
  QAT: 58, // North Field LNG concentration, Hormuz-dependent
  BHR: 50, // Financial hub + US 5th Fleet base
  OMN: 35, // More diversified, Duqm alternative routing
  IRQ: 58, // Oil infrastructure degraded, Basra concentration
  IRN: 45, // Self-sufficient but aging, Kharg Island critical
  YEM: 35, // Already degraded, Bab el-Mandeb proximity
  SYR: 30, // Infrastructure largely destroyed
  LBN: 52, // Port dependency, power grid fragile, Beirut concentration
  JOR: 22, // Limited critical infrastructure
  PSE: 15, // Minimal infrastructure, already damaged
  EGY: 48, // Suez Canal critical, power grid
  TUR: 32, // Diversified economy, NATO infrastructure
  PAK: 50, // Nuclear facilities + energy infrastructure
  AFG: 12, // Minimal infrastructure
  SDN: 18, SOM: 8, LBY: 32, DJI: 28, ERI: 12,
  UKR: 60, // Power grid, nuclear plants under threat
  RUS: 42, // Vast but dispersed
};

// ─── Core Computation ───────────────────────────────────────────────

/**
 * Compute the 4-component instability score for a country.
 */
export function computeInstabilityScore(
  iso3: string,
  allEvents: ApiEvent[],
  countryToIso3: Record<string, string>,
): InstabilityResult {
  // ── Map events to ISO3 ──
  const eventsByCountry: Record<string, ApiEvent[]> = {};
  for (const ev of allEvents) {
    const evIso3 = countryToIso3[ev.country] || ev.country;
    if (!eventsByCountry[evIso3]) eventsByCountry[evIso3] = [];
    eventsByCountry[evIso3].push(ev);
  }

  const countryEvents = eventsByCountry[iso3] || [];
  const neighbors = NEIGHBORS[iso3] || [];

  // ── COMPONENT 1: Internal (25%) ──
  // Pure baseline — civil unrest, political stability, economic indicators
  const internal = INTERNAL_BASELINE[iso3] ?? 30;

  // ── COMPONENT 2: Regional Exposure (35%) ──
  // How threatened by neighbors' instability?
  let regional = 0;
  if (neighbors.length > 0) {
    // For each neighbor, their threat = max of internal baseline and active event risk
    const neighborThreats: number[] = [];
    for (const n of neighbors) {
      const nInternal = INTERNAL_BASELINE[n] ?? 30;
      const nEvents = eventsByCountry[n] || [];
      const nMaxRisk = nEvents.length > 0
        ? Math.max(...nEvents.map((e) => e.risk_score))
        : 0;
      neighborThreats.push(Math.max(nInternal, nMaxRisk));
    }
    // Sort descending to weight top threats more
    neighborThreats.sort((a, b) => b - a);
    // Take top 3 neighbors (avoid averaging down by many peaceful neighbors)
    const topThreats = neighborThreats.slice(0, 3);
    // Weighted: heaviest neighbor counts most
    if (topThreats.length >= 3) {
      regional = Math.round(topThreats[0] * 0.50 + topThreats[1] * 0.30 + topThreats[2] * 0.20);
    } else if (topThreats.length === 2) {
      regional = Math.round(topThreats[0] * 0.60 + topThreats[1] * 0.40);
    } else if (topThreats.length === 1) {
      regional = topThreats[0];
    }
  }

  // ── COMPONENT 3: Infrastructure Risk (25%) ──
  // Base vulnerability + boost from events directly threatening infrastructure
  let infrastructure = INFRA_BASELINE[iso3] ?? 25;
  const infraSectors = ["ENERGY", "MARITIME", "FINANCIAL", "CYBER"];
  // Direct infra events boost significantly
  const directInfraEvents = countryEvents.filter((e) =>
    infraSectors.includes(e.sector)
  ).length;
  infrastructure = Math.min(100, infrastructure + directInfraEvents * 10);
  // Nearby infra events (e.g. Hormuz standoff affecting Kuwait) boost modestly
  const nearbyInfraEvents = neighbors.reduce((sum, n) => {
    return sum + (eventsByCountry[n] || []).filter((e) =>
      infraSectors.includes(e.sector)
    ).length;
  }, 0);
  infrastructure = Math.min(100, infrastructure + Math.min(nearbyInfraEvents * 2, 12));

  // ── COMPONENT 4: Active Events (15%) ──
  let events = 0;
  if (countryEvents.length > 0) {
    const maxRisk = Math.max(...countryEvents.map((e) => e.risk_score));
    const avgRisk =
      countryEvents.reduce((s, e) => s + e.risk_score, 0) / countryEvents.length;
    events = Math.round(maxRisk * 0.6 + avgRisk * 0.4);
    // Bonus for multiple simultaneous events
    if (countryEvents.length >= 3) events = Math.min(100, events + 10);
    else if (countryEvents.length >= 2) events = Math.min(100, events + 5);
  } else {
    // No direct events — nearby events contribute at reduced weight
    const nearbyMaxRisk = neighbors.reduce((max, n) => {
      const nEvents = eventsByCountry[n] || [];
      if (nEvents.length === 0) return max;
      return Math.max(max, Math.max(...nEvents.map((e) => e.risk_score)));
    }, 0);
    events = Math.round(nearbyMaxRisk * 0.35);
  }

  // ── FINAL WEIGHTED SCORE ──
  // For countries in active conflict (internal > 75), internal becomes dominant
  // because their instability IS the event — they don't need external events to score high
  let w_int = 0.25, w_reg = 0.35, w_inf = 0.25, w_ev = 0.15;
  if (internal >= 93) {
    // Active war zone (Palestine, Ukraine, Yemen): instability is self-evident
    // Floor at internal score minus small adjustment for other factors
    w_int = 0.70; w_reg = 0.15; w_inf = 0.05; w_ev = 0.10;
  } else if (internal >= 85) {
    // Extreme conflict zone: internal heavily dominates
    w_int = 0.55; w_reg = 0.20; w_inf = 0.10; w_ev = 0.15;
  } else if (internal >= 75) {
    // Active conflict zone: internal is primary driver
    w_int = 0.40; w_reg = 0.25; w_inf = 0.20; w_ev = 0.15;
  } else if (internal >= 60) {
    // Fragile state: internal slightly elevated
    w_int = 0.30; w_reg = 0.30; w_inf = 0.25; w_ev = 0.15;
  }

  const score = Math.round(
    internal * w_int +
    regional * w_reg +
    infrastructure * w_inf +
    events * w_ev
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    level: scoreToLevel(clampedScore),
    components: {
      internal,
      regional,
      infrastructure,
      events,
    },
  };
}

// ─── Batch Compute for All Countries ────────────────────────────────

export function computeAllInstabilityScores(
  allEvents: ApiEvent[],
  countryToIso3: Record<string, string>,
): Record<string, InstabilityResult> {
  const allIso3 = new Set<string>();

  // Add all countries with baselines
  for (const iso3 of Object.keys(INTERNAL_BASELINE)) allIso3.add(iso3);
  for (const iso3 of Object.keys(INFRA_BASELINE)) allIso3.add(iso3);

  // Add all countries from events
  for (const ev of allEvents) {
    const iso3 = countryToIso3[ev.country] || ev.country;
    allIso3.add(iso3);
  }

  const results: Record<string, InstabilityResult> = {};
  for (const iso3 of allIso3) {
    results[iso3] = computeInstabilityScore(iso3, allEvents, countryToIso3);
  }
  return results;
}

// ─── Map ISO3 → ISO2 ────────────────────────────────────────────────

const ISO3_TO_ISO2: Record<string, string> = {
  KWT: "KW", SAU: "SA", ARE: "AE", QAT: "QA", BHR: "BH", OMN: "OM",
  IRQ: "IQ", IRN: "IR", YEM: "YE", EGY: "EG", JOR: "JO", SYR: "SY",
  LBN: "LB", PSE: "PS", CYP: "CY", TUR: "TR", AFG: "AF", PAK: "PK",
  SDN: "SD", ERI: "ER", DJI: "DJ", SOM: "SO", LBY: "LY",
  UKR: "UA", RUS: "RU", VEN: "VE", MEX: "MX",
  HTI: "HT", MLI: "ML", BFA: "BF", MMR: "MM", PRK: "KP",
  TCD: "TD", CAF: "CF", COD: "CD", NER: "NE", ETH: "ET",
  NGA: "NG", KEN: "KE", MOZ: "MZ", COL: "CO", ECU: "EC",
  PER: "PE", BGD: "BD", LKA: "LK", IND: "IN",
};

/**
 * Convert instability results (ISO3-keyed) to ISO2-keyed map threat levels
 * for use by the map component.
 */
/** Map-compatible threat level (no CRITICAL+) */
export type MapThreatLevel = "CRITICAL" | "HIGH" | "ELEVATED" | "MONITORING" | "STABLE";

export function instabilityToMapLevels(
  results: Record<string, InstabilityResult>,
): Record<string, MapThreatLevel> {
  const levels: Record<string, MapThreatLevel> = {};
  for (const [iso3, result] of Object.entries(results)) {
    const iso2 = ISO3_TO_ISO2[iso3];
    if (iso2) {
      // Map CRITICAL+ to CRITICAL for the 5-level map system
      levels[iso2] = result.level === "CRITICAL+" ? "CRITICAL" : result.level;
    }
  }
  return levels;
}
