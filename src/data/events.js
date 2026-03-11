export const EVENTS = [
  {
    id: 1,
    title: "Explosion Near Basra Oil Terminal",
    event_type: "STRIKE",
    source: "SIGINT + Satellite",
    event_time: "2026-03-10T06:14:00Z",
    latitude: 30.5,
    longitude: 47.8,
    severity: "CRITICAL",
    confidence: 91,
    risk_score: 88,
    risk_level: "CRITICAL",
    region: "Southern Iraq",
    sector: "ENERGY",
    what_is_happening: "Multiple satellite heat signatures and corroborated social reports confirm a major explosion at the Basra Oil Terminal complex. Fire teams deployed. AIS data shows tankers diverting from the southern approach lane.",
    why_it_matters: "Basra handles ~3.5M bbl/day, approximately 90% of Iraq's oil exports. Disruption here affects global Brent pricing and downstream supply chains into Europe and Asia.",
    what_next: "Probability of further escalation: 67%. Likely next signals: airspace restrictions over southern Iraq, secondary strikes on pipeline infrastructure, maritime diversion from Khor al-Amaya terminal.",
    actions: [
      "Activate energy sector watch protocol immediately",
      "Validate exposure of held tanker positions in Gulf shipping lane",
      "Notify logistics and procurement leads of potential 72-hour disruption window",
      "Monitor Khor al-Amaya and Al-Fao terminal feeds for secondary incidents",
      "Prepare executive brief for 08:00 leadership call"
    ],
    nearby_infra: [
      { name: "Basra Oil Terminal", type: "Oil Export", distance: 4 },
      { name: "Khor al-Amaya SPM", type: "Offshore Terminal", distance: 18 },
      { name: "South Rumaila Field", type: "Oil Field", distance: 22 }
    ]
  },
  {
    id: 2,
    title: "Airspace Closure — Tehran FIR",
    event_type: "AVIATION",
    source: "NOTAM + ADS-B",
    event_time: "2026-03-10T04:55:00Z",
    latitude: 35.7,
    longitude: 51.4,
    severity: "HIGH",
    confidence: 97,
    risk_score: 74,
    risk_level: "HIGH",
    region: "Central Iran",
    sector: "AVIATION",
    what_is_happening: "Iran's NOTAM system has issued FL000–FL600 restrictions over a 200nm radius of Tehran FIR effective immediately. Military radar emissions detected across three northern sectors. Civil overflights rerouting via Ankara corridor.",
    why_it_matters: "Tehran FIR is a primary east-west corridor for Gulf-Europe air traffic. Closure adds 90–120 mins to affected routes and may signal imminent military activity in-theater.",
    what_next: "Probability of airspace remaining closed >6 hours: 72%. Possible spillover to Iraq FIR if military operation is underway. Monitor for fighter sortie uptick on ADS-B Military.",
    actions: [
      "Issue route advisories to all operational flights in affected corridor",
      "Cross-check SIGINT for military launch activity",
      "Prepare alternate routing plans via Arabian Sea corridor",
      "Brief diplomatic liaisons on potential escalation indicator",
      "Increase satellite cadence over northern Iran"
    ],
    nearby_infra: [
      { name: "Imam Khomeini Airport", type: "International Airport", distance: 35 },
      { name: "Tehran Power Grid Node", type: "Power Infrastructure", distance: 12 },
      { name: "Arak Heavy Water Facility", type: "Nuclear Infrastructure", distance: 220 }
    ]
  },
  {
    id: 3,
    title: "Port Congestion — Jebel Ali Surge",
    event_type: "MARITIME",
    source: "AIS + MarineTraffic",
    event_time: "2026-03-10T03:30:00Z",
    latitude: 25.0,
    longitude: 55.1,
    severity: "MEDIUM",
    confidence: 89,
    risk_score: 52,
    risk_level: "MEDIUM",
    region: "UAE — Dubai",
    sector: "SUPPLY CHAIN",
    what_is_happening: "AIS data shows 47 vessels at anchor outside Jebel Ali, up from a 3-day average of 19. Dwell times extending to 96 hours. Suspected cause: customs system slowdown and diverted Basra traffic.",
    why_it_matters: "Jebel Ali is the largest port in the Middle East and a primary transshipment hub for GCC imports. Congestion cascades into container delays across the subcontinent and East Africa.",
    what_next: "Probability of 5-day+ disruption: 44%. If Basra export disruption holds, anchorage overflow may extend to Khor Fakkan. Watch for oil tanker queue buildup.",
    actions: [
      "Review inbound shipment ETAs and flag critical cargo",
      "Assess alternative offload at Khalifa or Sohar ports",
      "Notify ground logistics and last-mile partners of likely delays",
      "Update supply chain risk dashboard"
    ],
    nearby_infra: [
      { name: "Jebel Ali Port", type: "Major Port", distance: 2 },
      { name: "Jebel Ali Free Zone", type: "Economic Zone", distance: 5 },
      { name: "Dubai Airport Cargo", type: "Air Cargo Hub", distance: 28 }
    ]
  },
  {
    id: 4,
    title: "Missile Launch — Red Sea Corridor",
    event_type: "STRIKE",
    source: "SIGINT + Open Source",
    event_time: "2026-03-10T02:10:00Z",
    latitude: 13.5,
    longitude: 43.2,
    severity: "CRITICAL",
    confidence: 78,
    risk_score: 82,
    risk_level: "CRITICAL",
    region: "Red Sea / Yemen",
    sector: "MARITIME",
    what_is_happening: "SIGINT intercepts and visual reports indicate a ballistic missile launch from western Yemen toward Red Sea shipping corridor. Two commercial vessels have activated SSAS alarms. UKMTO advisory issued.",
    why_it_matters: "Red Sea corridor handles ~15% of global seaborne trade including Suez Canal transit. Confirmed attacks are triggering P&I insurance suspensions and re-routing via Cape of Good Hope, adding 10–14 days to transit.",
    what_next: "Escalation probability: 71%. Expect additional attacks within 48–72 hours based on previous pattern. Cape re-routing likely to increase freight rates 20–35%.",
    actions: [
      "Immediate advisory to all vessels in Red Sea corridor",
      "Activate Cape of Good Hope rerouting protocol for vulnerable assets",
      "Notify insurance and P&I club liaisons",
      "Alert executive team — freight cost impact expected within 48 hours",
      "Increase monitoring of Bab el-Mandeb chokepoint AIS feed"
    ],
    nearby_infra: [
      { name: "Bab el-Mandeb Strait", type: "Maritime Chokepoint", distance: 85 },
      { name: "Aden Port", type: "Regional Port", distance: 120 },
      { name: "Djibouti Container Terminal", type: "Port", distance: 180 }
    ]
  },
  {
    id: 5,
    title: "Seismic Event — Kuwait Power Grid Proximity",
    event_type: "EARTHQUAKE",
    source: "USGS",
    event_time: "2026-03-10T01:45:00Z",
    latitude: 29.4,
    longitude: 47.6,
    severity: "LOW",
    confidence: 99,
    risk_score: 28,
    risk_level: "LOW",
    region: "Kuwait",
    sector: "INFRASTRUCTURE",
    what_is_happening: "USGS registered a M4.2 seismic event 12km southwest of Kuwait City. No structural damage reported. Standard automated monitoring alert triggered.",
    why_it_matters: "Event is within 15km of primary power transmission infrastructure. While M4.2 is below damage threshold, it is part of a seismic cluster observed over the past 10 days.",
    what_next: "Low escalation probability. Recommend passive monitoring. Larger event cannot be excluded given cluster pattern.",
    actions: [
      "Log event for seismic pattern tracking",
      "Verify power grid status with infrastructure contacts",
      "No immediate operational action required"
    ],
    nearby_infra: [
      { name: "Kuwait Power Transmission Hub", type: "Power Infrastructure", distance: 12 },
      { name: "Shuaiba Refinery", type: "Refinery", distance: 30 }
    ]
  }
];

export const RISK_COLORS = {
  CRITICAL: { bg: "rgba(220,38,38,0.15)", border: "#dc2626", text: "#ef4444", dot: "#dc2626" },
  HIGH: { bg: "rgba(234,88,12,0.15)", border: "#ea580c", text: "#f97316", dot: "#ea580c" },
  MEDIUM: { bg: "rgba(202,138,4,0.12)", border: "#ca8a04", text: "#eab308", dot: "#ca8a04" },
  LOW: { bg: "rgba(22,163,74,0.12)", border: "#16a34a", text: "#22c55e", dot: "#22a34a" }
};

export const SECTOR_ICONS = {
  ENERGY: "⚡",
  AVIATION: "✈",
  "SUPPLY CHAIN": "🚢",
  MARITIME: "⚓",
  INFRASTRUCTURE: "🏗"
};

export const EVENT_TYPE_LABELS = {
  STRIKE: "STRIKE",
  AVIATION: "AIRSPACE",
  MARITIME: "MARITIME",
  EARTHQUAKE: "SEISMIC"
};

export const RISK_LEVELS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

// Country intelligence database
// Each country has: coordinates, flag, and event mappings with spillover reasons
export const COUNTRIES = {
  ALL: { label: "GLOBAL VIEW", flag: "🌐", lat: 25, lng: 48, zoom: 4 },
  IQ: {
    label: "Iraq", flag: "🇮🇶", lat: 33.2, lng: 43.7, zoom: 6,
    events: {
      1: { type: "direct" },
      2: { type: "spillover", reason: "Tehran FIR closure may extend to Iraq FIR; rerouted military activity could spill into Iraqi airspace" },
    }
  },
  IR: {
    label: "Iran", flag: "🇮🇷", lat: 32.4, lng: 53.7, zoom: 6,
    events: {
      2: { type: "direct" },
      1: { type: "spillover", reason: "Basra terminal disruption may trigger retaliatory accusations; shared waterway escalation risk in Shatt al-Arab" },
    }
  },
  AE: {
    label: "UAE", flag: "🇦🇪", lat: 24.5, lng: 54.6, zoom: 7,
    events: {
      3: { type: "direct" },
      1: { type: "spillover", reason: "Basra disruption diverts tanker traffic to Jebel Ali, compounding port congestion and raising fuel import costs" },
      4: { type: "spillover", reason: "Red Sea attacks increase Cape rerouting costs for UAE-bound cargo; Fujairah bunkering demand surges" },
    }
  },
  KW: {
    label: "Kuwait", flag: "🇰🇼", lat: 29.3, lng: 47.5, zoom: 8,
    events: {
      5: { type: "direct" },
      1: { type: "spillover", reason: "Basra terminal is 60km from Kuwait border; smoke plume and maritime disruption affect shared Gulf corridor" },
    }
  },
  YE: {
    label: "Yemen", flag: "🇾🇪", lat: 15.5, lng: 48.5, zoom: 6,
    events: {
      4: { type: "direct" },
    }
  },
  SA: {
    label: "Saudi Arabia", flag: "🇸🇦", lat: 24.7, lng: 46.7, zoom: 5,
    events: {
      1: { type: "spillover", reason: "Basra disruption shifts global oil demand to Saudi Aramco spare capacity; Ras Tanura terminal on heightened alert" },
      4: { type: "spillover", reason: "Red Sea attacks directly threaten Saudi western coast ports; Yanbu and KAEC face insurance premium hikes" },
      5: { type: "spillover", reason: "Seismic cluster near shared border region; Saudi eastern grid infrastructure shares geological fault line" },
    }
  },
  OM: {
    label: "Oman", flag: "🇴🇲", lat: 21.5, lng: 56.0, zoom: 6,
    events: {
      3: { type: "spillover", reason: "Jebel Ali overflow diverts vessels to Sohar port; Oman faces unexpected cargo surge capacity pressure" },
      4: { type: "spillover", reason: "Cape rerouting increases traffic through Strait of Hormuz and Gulf of Oman; Muscat anchorage congestion risk" },
    }
  },
  QA: {
    label: "Qatar", flag: "🇶🇦", lat: 25.3, lng: 51.2, zoom: 8,
    events: {
      1: { type: "spillover", reason: "Shared Gulf waterway disruption affects Qatar LNG carrier routes; Brent price spike impacts gas pricing benchmarks" },
      3: { type: "spillover", reason: "Jebel Ali congestion delays Qatar-bound transshipment cargo; Hamad Port may face overflow diversion requests" },
    }
  },
  BH: {
    label: "Bahrain", flag: "🇧🇭", lat: 26.0, lng: 50.5, zoom: 9,
    events: {
      1: { type: "spillover", reason: "Bahrain refinery depends on Saudi/Iraq crude pipelines; Basra disruption threatens feedstock supply within 72 hours" },
      5: { type: "spillover", reason: "Seismic activity near Kuwait within felt-range of Bahrain; shared sedimentary basin risk" },
    }
  },
  DJ: {
    label: "Djibouti", flag: "🇩🇯", lat: 11.5, lng: 43.1, zoom: 8,
    events: {
      4: { type: "spillover", reason: "Red Sea missile attacks occur near Djibouti's primary shipping approaches; base security posture elevated" },
    }
  },
  EG: {
    label: "Egypt", flag: "🇪🇬", lat: 26.8, lng: 30.8, zoom: 6,
    events: {
      4: { type: "spillover", reason: "Red Sea attacks reduce Suez Canal transit volumes by ~30%; Egypt loses $15-20M/day in canal revenue" },
    }
  },
  TR: {
    label: "Turkey", flag: "🇹🇷", lat: 39.0, lng: 35.2, zoom: 6,
    events: {
      2: { type: "spillover", reason: "Tehran FIR closure reroutes Gulf-Europe air traffic through Ankara corridor; Turkish ATC capacity under pressure" },
    }
  },
};

// Helper: get events relevant to a country (or multiple countries) with their relevance type
export function getCountryEvents(countryCodes) {
  // Normalize to array
  const codes = Array.isArray(countryCodes) ? countryCodes : [countryCodes];

  if (codes.includes("ALL")) return EVENTS.map(e => ({ ...e, relevance: "global", spillover_reason: null, forCountries: [] }));

  // Merge events across all selected countries
  const eventMap = new Map();
  for (const code of codes) {
    const country = COUNTRIES[code];
    if (!country || !country.events) continue;
    for (const [id, info] of Object.entries(country.events)) {
      const numId = Number(id);
      const event = EVENTS.find(e => e.id === numId);
      if (!event) continue;
      const existing = eventMap.get(numId);
      if (!existing) {
        eventMap.set(numId, {
          ...event,
          relevance: info.type,
          spillover_reason: info.reason || null,
          forCountries: [code],
        });
      } else {
        // Upgrade to "direct" if any country has direct
        if (info.type === "direct" && existing.relevance !== "direct") {
          existing.relevance = "direct";
          existing.spillover_reason = null;
        }
        // Collect reasons from all spillover countries
        if (info.type === "spillover" && info.reason && existing.relevance === "spillover") {
          existing.spillover_reason = existing.spillover_reason
            ? `${existing.spillover_reason} | ${COUNTRIES[code].flag} ${info.reason}`
            : `${COUNTRIES[code].flag} ${info.reason}`;
        }
        if (!existing.forCountries.includes(code)) {
          existing.forCountries.push(code);
        }
      }
    }
  }

  return Array.from(eventMap.values()).sort((a, b) => {
    if (a.relevance === "direct" && b.relevance !== "direct") return -1;
    if (b.relevance === "direct" && a.relevance !== "direct") return 1;
    return b.risk_score - a.risk_score;
  });
}
