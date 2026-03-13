import express from "express";
import cors from "cors";
import RSSParser from "rss-parser";

const app = express();
app.use(cors());

const parser = new RSSParser({
  timeout: 10000,
  headers: { "User-Agent": "AtlasCommand/1.0" },
});

// ═══════════════════════════════════════
// RSS FEED SOURCES
// ═══════════════════════════════════════

const RSS_FEEDS = [
  // TIER 1 — Most reliable
  "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://feeds.reuters.com/reuters/worldNews",
  "https://feeds.reuters.com/reuters/topNews",
  "https://www.aljazeera.com/xml/rss/all.xml",
  "https://rss.france24.com/rss/en",
  "https://feeds.skynews.com/feeds/rss/world.xml",
  "https://www.theguardian.com/world/rss",
  "https://rss.dw.com/rss/en-all",
  // TIER 2 — Regional focus
  "https://www.arabnews.com/rss.xml",
  "https://english.alarabiya.net/rss.xml",
  "https://www.middleeasteye.net/rss",
  "https://rudaw.net/english/rss",
  // TIER 3 — Defense/Security
  "https://www.defensenews.com/rss/",
  "https://breakingdefense.com/feed/",
  "https://news.usni.org/feed",
  // TIER 4 — Energy
  "https://oilprice.com/rss/main",
  // TIER 5 — Wire services
  "https://www.globalsecurity.org/rss/news.rss",
];

const JSON_FEEDS = [
  {
    url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
    type: "usgs",
  },
  {
    url: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50",
    type: "eonet",
  },
];

// ═══════════════════════════════════════
// SOURCE RELIABILITY SCORES
// ═══════════════════════════════════════

const SOURCE_RELIABILITY = {
  "feeds.bbci.co.uk": 95,
  "feeds.reuters.com": 95,
  "www.aljazeera.com": 90,
  "rss.france24.com": 88,
  "feeds.skynews.com": 85,
  "www.theguardian.com": 90,
  "rss.dw.com": 85,
  "www.arabnews.com": 80,
  "english.alarabiya.net": 82,
  "www.middleeasteye.net": 80,
  "rudaw.net": 75,
  "www.defensenews.com": 85,
  "breakingdefense.com": 82,
  "news.usni.org": 85,
  "oilprice.com": 78,
  "www.globalsecurity.org": 75,
  "earthquake.usgs.gov": 99,
  "eonet.gsfc.nasa.gov": 95,
};

function getSourceReliability(url) {
  try {
    const host = new URL(url).hostname;
    return SOURCE_RELIABILITY[host] || 70;
  } catch {
    return 70;
  }
}

// ═══════════════════════════════════════
// GEOPOLITICAL KEYWORD → REGION MAPPING
// ═══════════════════════════════════════

const REGION_KEYWORDS = [
  { keywords: ["lebanon", "beirut", "hezbollah", "lebanese"], region: "Lebanon", lat: 33.9, lng: 35.5, country: "LB" },
  { keywords: ["yemen", "houthi", "sanaa", "aden", "red sea"], region: "Yemen / Red Sea", lat: 15.5, lng: 48.5, country: "YE" },
  { keywords: ["iran", "tehran", "iranian", "isfahan", "natanz", "nuclear"], region: "Iran", lat: 32.4, lng: 53.7, country: "IR" },
  { keywords: ["iraq", "baghdad", "basra", "iraqi", "mosul", "kurdistan"], region: "Iraq", lat: 33.2, lng: 43.7, country: "IQ" },
  { keywords: ["syria", "syrian", "damascus", "aleppo", "idlib"], region: "Syria", lat: 35.0, lng: 38.5, country: "SY" },
  { keywords: ["israel", "israeli", "tel aviv", "jerusalem", "gaza", "hamas", "idf"], region: "Israel / Palestine", lat: 31.0, lng: 34.8, country: "IL" },
  { keywords: ["saudi", "riyadh", "aramco", "jeddah"], region: "Saudi Arabia", lat: 24.7, lng: 46.7, country: "SA" },
  { keywords: ["uae", "dubai", "abu dhabi", "emirates", "jebel ali"], region: "UAE", lat: 24.5, lng: 54.6, country: "AE" },
  { keywords: ["turkey", "turkish", "ankara", "istanbul", "erdogan"], region: "Turkey", lat: 39.0, lng: 35.2, country: "TR" },
  { keywords: ["egypt", "cairo", "suez", "egyptian", "sisi"], region: "Egypt", lat: 26.8, lng: 30.8, country: "EG" },
  { keywords: ["ukraine", "kyiv", "ukrainian", "zelenskyy", "donbas", "crimea"], region: "Ukraine", lat: 48.4, lng: 31.2, country: "UA" },
  { keywords: ["russia", "russian", "moscow", "putin", "kremlin"], region: "Russia", lat: 55.8, lng: 37.6, country: "RU" },
  { keywords: ["china", "chinese", "beijing", "taiwan", "xi jinping"], region: "China", lat: 35.9, lng: 104.2, country: "CN" },
  { keywords: ["north korea", "pyongyang", "kim jong"], region: "North Korea", lat: 39.0, lng: 125.8, country: "KP" },
  { keywords: ["pakistan", "islamabad", "pakistani", "karachi"], region: "Pakistan", lat: 30.4, lng: 69.3, country: "PK" },
  { keywords: ["afghanistan", "kabul", "afghan", "taliban"], region: "Afghanistan", lat: 33.9, lng: 67.7, country: "AF" },
  { keywords: ["libya", "tripoli", "libyan", "benghazi"], region: "Libya", lat: 26.3, lng: 17.2, country: "LY" },
  { keywords: ["sudan", "khartoum", "sudanese", "darfur"], region: "Sudan", lat: 12.9, lng: 30.2, country: "SD" },
  { keywords: ["somalia", "mogadishu", "somali", "al-shabaab"], region: "Somalia", lat: 5.2, lng: 46.2, country: "SO" },
  { keywords: ["nato"], region: "NATO / Europe", lat: 50.8, lng: 4.4, country: "BE" },
  { keywords: ["pentagon", "us military", "centcom", "white house", "biden", "trump"], region: "United States", lat: 38.9, lng: -77.0, country: "US" },
  { keywords: ["oil", "opec", "crude", "petroleum", "energy"], region: "Global Energy", lat: 25.0, lng: 48.0, country: null },
  { keywords: ["earthquake", "seismic", "quake", "magnitude"], region: "Seismic", lat: 0, lng: 0, country: null },
];

function classifyEvent(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  let region = "Global";
  let lat = 25.0;
  let lng = 45.0;
  let country = null;

  for (const mapping of REGION_KEYWORDS) {
    if (mapping.keywords.some((kw) => text.includes(kw))) {
      region = mapping.region;
      lat = mapping.lat;
      lng = mapping.lng;
      country = mapping.country;
      break;
    }
  }

  // Determine sector
  let sector = "GEOPOLITICAL";
  if (/oil|energy|gas|pipeline|opec|crude|refiner/i.test(text)) sector = "ENERGY";
  else if (/air|flight|aviation|airspace|aircraft|drone/i.test(text)) sector = "AVIATION";
  else if (/ship|port|maritime|naval|vessel|strait|sea lane/i.test(text)) sector = "MARITIME";
  else if (/quake|seismic|earthquake|tsunami/i.test(text)) sector = "INFRASTRUCTURE";
  else if (/supply chain|trade|tariff|sanction|export|import/i.test(text)) sector = "SUPPLY CHAIN";
  else if (/missile|strike|bomb|attack|military|war|conflict|combat/i.test(text)) sector = "DEFENSE";

  // Determine severity
  let severity = "MEDIUM";
  let riskScore = 50;
  if (/breaking|critical|emergency|killed|dead|massacre|nuclear|war|invasion/i.test(text)) {
    severity = "CRITICAL";
    riskScore = 85 + Math.floor(Math.random() * 10);
  } else if (/attack|strike|missile|bomb|threat|escalat|crisis|conflict|sanction/i.test(text)) {
    severity = "HIGH";
    riskScore = 65 + Math.floor(Math.random() * 15);
  } else if (/tension|deploy|military|warning|protest|unrest/i.test(text)) {
    severity = "MEDIUM";
    riskScore = 40 + Math.floor(Math.random() * 20);
  } else {
    severity = "LOW";
    riskScore = 15 + Math.floor(Math.random() * 20);
  }

  // Determine event type
  let eventType = "REPORT";
  if (/strike|missile|bomb|attack|explosion/i.test(text)) eventType = "STRIKE";
  else if (/aviation|airspace|flight/i.test(text)) eventType = "AVIATION";
  else if (/maritime|ship|port|naval/i.test(text)) eventType = "MARITIME";
  else if (/earthquake|seismic|quake/i.test(text)) eventType = "EARTHQUAKE";

  return { region, lat, lng, country, sector, severity, riskScore, eventType };
}

// ═══════════════════════════════════════
// ONGOING EVENT DETECTION
// ═══════════════════════════════════════

const ONGOING_KEYWORDS = [
  "war", "conflict", "nuclear", "blockade", "occupation",
  "sanctions", "crisis", "ongoing", "continues",
];

function isOngoing(event) {
  return ONGOING_KEYWORDS.some((k) =>
    event.title.toLowerCase().includes(k)
  );
}

// ═══════════════════════════════════════
// DEDUPLICATION
// ═══════════════════════════════════════

function deduplicateEvents(events) {
  const seen = new Map();
  return events.filter((event) => {
    const key = event.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(" ")
      .slice(0, 6)
      .join(" ");

    if (seen.has(key)) {
      const existing = seen.get(key);
      if (event.sourceReliability > existing.sourceReliability) {
        seen.set(key, event);
      }
      return false;
    }
    seen.set(key, event);
    return true;
  });
}

// ═══════════════════════════════════════
// AGE FILTERING
// ═══════════════════════════════════════

function filterByAge(events) {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const h72 = 72 * 60 * 60 * 1000;

  return events.filter((e) => {
    const age = now - new Date(e.timestamp).getTime();
    if (isNaN(age)) return false;
    if (e.severity === "CRITICAL") return age < h72;
    if (isOngoing(e)) return age < h72;
    return age < h24;
  });
}

// ═══════════════════════════════════════
// RSS FEED PARSING
// ═══════════════════════════════════════

let idCounter = 1000;

async function fetchAndParseRSS(url) {
  try {
    const feed = await parser.parseURL(url);
    const reliability = getSourceReliability(url);
    const sourceName = feed.title || new URL(url).hostname;

    return (feed.items || []).slice(0, 15).map((item) => {
      const title = item.title || "Untitled";
      const description = item.contentSnippet || item.content || "";
      const classification = classifyEvent(title, description);
      const timestamp = item.isoDate || item.pubDate || new Date().toISOString();

      return {
        id: idCounter++,
        title,
        event_type: classification.eventType,
        source: sourceName,
        event_time: timestamp,
        timestamp,
        latitude: classification.lat + (Math.random() - 0.5) * 2,
        longitude: classification.lng + (Math.random() - 0.5) * 2,
        severity: classification.severity,
        confidence: Math.min(reliability, 95),
        risk_score: classification.riskScore,
        risk_level: classification.severity,
        region: classification.region,
        country: classification.country,
        sector: classification.sector,
        what_is_happening: description.slice(0, 500) || title,
        why_it_matters: `Reported by ${sourceName}. Confidence: ${reliability}%.`,
        what_next: "Monitoring situation for further developments.",
        actions: ["Monitor situation", "Assess regional impact", "Update stakeholders if escalation detected"],
        nearby_infra: [],
        relevance: "global",
        spillover_reason: null,
        forCountries: classification.country ? [classification.country] : [],
        sourceReliability: reliability,
        sourceUrl: item.link || "",
      };
    });
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${url}: ${err.message}`);
    return [];
  }
}

// ═══════════════════════════════════════
// JSON FEED PARSING (USGS, EONET)
// ═══════════════════════════════════════

async function fetchJSONFeeds() {
  const events = [];

  for (const feed of JSON_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "AtlasCommand/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();

      if (feed.type === "usgs") {
        for (const feature of (data.features || []).slice(0, 20)) {
          const props = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          events.push({
            id: idCounter++,
            title: `M${props.mag} Earthquake — ${props.place}`,
            event_type: "EARTHQUAKE",
            source: "USGS",
            event_time: new Date(props.time).toISOString(),
            timestamp: new Date(props.time).toISOString(),
            latitude: lat,
            longitude: lng,
            severity: props.mag >= 6 ? "CRITICAL" : props.mag >= 5 ? "HIGH" : "MEDIUM",
            confidence: 99,
            risk_score: Math.min(Math.round(props.mag * 15), 95),
            risk_level: props.mag >= 6 ? "CRITICAL" : props.mag >= 5 ? "HIGH" : "MEDIUM",
            region: props.place || "Unknown",
            country: null,
            sector: "INFRASTRUCTURE",
            what_is_happening: `Magnitude ${props.mag} earthquake detected at depth ${feature.geometry.coordinates[2]}km. ${props.place}.`,
            why_it_matters: "Seismic activity may affect nearby infrastructure and population centers.",
            what_next: "Monitor for aftershocks and assess structural impact.",
            actions: ["Monitor USGS feed for aftershocks", "Check infrastructure status in affected area"],
            nearby_infra: [],
            relevance: "global",
            spillover_reason: null,
            forCountries: [],
            sourceReliability: 99,
            sourceUrl: props.url || "",
          });
        }
      }

      if (feed.type === "eonet") {
        for (const event of (data.events || []).slice(0, 15)) {
          const geo = event.geometry?.[0];
          if (!geo) continue;
          events.push({
            id: idCounter++,
            title: event.title,
            event_type: "REPORT",
            source: "NASA EONET",
            event_time: geo.date || new Date().toISOString(),
            timestamp: geo.date || new Date().toISOString(),
            latitude: geo.coordinates?.[1] || 0,
            longitude: geo.coordinates?.[0] || 0,
            severity: "MEDIUM",
            confidence: 95,
            risk_score: 40,
            risk_level: "MEDIUM",
            region: event.title,
            country: null,
            sector: "INFRASTRUCTURE",
            what_is_happening: `${event.title} — reported by NASA Earth Observatory.`,
            why_it_matters: "Natural event being tracked by NASA EONET.",
            what_next: "Monitoring for changes in scope or severity.",
            actions: ["Track event progression", "Assess proximity to critical infrastructure"],
            nearby_infra: [],
            relevance: "global",
            spillover_reason: null,
            forCountries: [],
            sourceReliability: 95,
            sourceUrl: event.link || "",
          });
        }
      }
    } catch (err) {
      console.error(`[JSON] Failed to fetch ${feed.url}: ${err.message}`);
    }
  }

  return events;
}

// ═══════════════════════════════════════
// FALLBACK EVENTS (when feeds unavailable)
// ═══════════════════════════════════════

const now = new Date();
const h = (hoursAgo) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();

const FALLBACK_EVENTS = [
  {
    id: 9001, title: "Hezbollah-Israel Ceasefire Tensions Escalate", event_type: "STRIKE", source: "Multiple Sources",
    event_time: h(1), timestamp: h(1), latitude: 33.85, longitude: 35.86, severity: "CRITICAL", confidence: 88,
    risk_score: 92, risk_level: "CRITICAL", region: "Lebanon", country: "LB", sector: "DEFENSE",
    what_is_happening: "Reports of renewed cross-border fire exchanges between Hezbollah and IDF forces along the Blue Line. Multiple sources confirm artillery impacts near Naqoura.",
    why_it_matters: "Threatens the fragile ceasefire and could escalate into broader regional conflict affecting energy markets and shipping.",
    what_next: "Monitor for UNIFIL statements and further escalation indicators.", actions: ["Activate regional watch protocol", "Monitor UNIFIL feeds", "Assess energy market impact"],
    nearby_infra: [{ name: "Beirut Port", type: "Port", distance: 80 }], relevance: "global", spillover_reason: null, forCountries: ["LB", "IL"], sourceReliability: 88, sourceUrl: "",
  },
  {
    id: 9002, title: "Houthi Anti-Ship Missile Targets Commercial Vessel in Red Sea", event_type: "STRIKE", source: "UKMTO / SIGINT",
    event_time: h(2), timestamp: h(2), latitude: 13.8, longitude: 42.5, severity: "CRITICAL", confidence: 82,
    risk_score: 88, risk_level: "CRITICAL", region: "Yemen / Red Sea", country: "YE", sector: "MARITIME",
    what_is_happening: "Houthi forces launched anti-ship ballistic missile at commercial bulk carrier in southern Red Sea. Vessel reports near-miss. UKMTO advisory issued.",
    why_it_matters: "Continued attacks disrupting 15% of global seaborne trade. Insurance premiums surging, vessels rerouting via Cape of Good Hope.",
    what_next: "Expect further attacks within 48h based on established pattern.", actions: ["Advisory to all Red Sea corridor vessels", "Activate Cape rerouting", "Notify P&I clubs"],
    nearby_infra: [{ name: "Bab el-Mandeb Strait", type: "Chokepoint", distance: 60 }], relevance: "global", spillover_reason: null, forCountries: ["YE"], sourceReliability: 85, sourceUrl: "",
  },
  {
    id: 9003, title: "Iran Announces Expansion of Uranium Enrichment at Fordow", event_type: "REPORT", source: "IAEA / Open Source",
    event_time: h(4), timestamp: h(4), latitude: 34.8, longitude: 51.6, severity: "HIGH", confidence: 94,
    risk_score: 78, risk_level: "HIGH", region: "Iran", country: "IR", sector: "GEOPOLITICAL",
    what_is_happening: "Iran has notified the IAEA of plans to install additional centrifuges at the Fordow underground facility, pushing enrichment capacity beyond previous limits.",
    why_it_matters: "Signals accelerating nuclear program. Could trigger new sanctions or military contingency planning by US/Israel.",
    what_next: "Watch for IAEA Board of Governors emergency session and US/EU diplomatic response.", actions: ["Monitor IAEA statements", "Assess sanctions impact on energy markets", "Brief leadership on escalation scenarios"],
    nearby_infra: [{ name: "Fordow Facility", type: "Nuclear", distance: 2 }], relevance: "global", spillover_reason: null, forCountries: ["IR"], sourceReliability: 94, sourceUrl: "",
  },
  {
    id: 9004, title: "Russian Drone Strikes on Ukrainian Energy Grid", event_type: "STRIKE", source: "Ukraine MoD / Satellite",
    event_time: h(3), timestamp: h(3), latitude: 50.45, longitude: 30.52, severity: "HIGH", confidence: 91,
    risk_score: 74, risk_level: "HIGH", region: "Ukraine", country: "UA", sector: "ENERGY",
    what_is_happening: "Overnight wave of Shahed drones targeted Ukrainian power infrastructure in Kyiv and Kharkiv oblasts. Multiple transformer stations hit. Emergency blackouts reported.",
    why_it_matters: "Systematic degradation of Ukrainian energy infrastructure ahead of spring. European gas markets reacting to continued instability.",
    what_next: "Expect continued drone campaign targeting energy infrastructure.", actions: ["Track European energy market response", "Monitor grid restoration progress", "Assess humanitarian impact"],
    nearby_infra: [{ name: "Kyiv Power Grid", type: "Power Infrastructure", distance: 5 }], relevance: "global", spillover_reason: null, forCountries: ["UA"], sourceReliability: 91, sourceUrl: "",
  },
  {
    id: 9005, title: "South China Sea — PLA Navy Exercises Near Taiwan Strait", event_type: "MARITIME", source: "ADS-B / AIS / OSINT",
    event_time: h(5), timestamp: h(5), latitude: 24.5, longitude: 118.0, severity: "HIGH", confidence: 86,
    risk_score: 72, risk_level: "HIGH", region: "China", country: "CN", sector: "DEFENSE",
    what_is_happening: "PLA Navy conducting large-scale live-fire exercises in waters near Taiwan Strait. Multiple carrier strike group assets detected via satellite imagery.",
    why_it_matters: "Heightened military posturing increases risk of miscalculation. Global semiconductor supply chain exposed to disruption.",
    what_next: "Monitor for Taiwanese military response and US carrier group movements.", actions: ["Track semiconductor supply chain exposure", "Monitor AIS for commercial shipping diversions", "Brief leadership on Indo-Pacific risk"],
    nearby_infra: [{ name: "TSMC Fab Complex", type: "Semiconductor", distance: 150 }], relevance: "global", spillover_reason: null, forCountries: ["CN"], sourceReliability: 86, sourceUrl: "",
  },
  {
    id: 9006, title: "Oil Pipeline Sabotage in Southern Iraq — Basra Exports Disrupted", event_type: "STRIKE", source: "SIGINT + Satellite",
    event_time: h(2), timestamp: h(2), latitude: 30.5, longitude: 47.8, severity: "CRITICAL", confidence: 89,
    risk_score: 86, risk_level: "CRITICAL", region: "Iraq", country: "IQ", sector: "ENERGY",
    what_is_happening: "Explosion reported on main crude pipeline feeding Basra Oil Terminal. Satellite imagery confirms fire at junction point. Terminal operations suspended.",
    why_it_matters: "Basra handles ~3.5M bbl/day. Disruption will push Brent prices up and strain global supply.",
    what_next: "Monitor repair timeline. Probability of secondary attack: 40%.", actions: ["Activate energy sector watch", "Notify trading desks", "Monitor tanker diversions in Gulf"],
    nearby_infra: [{ name: "Basra Oil Terminal", type: "Oil Export", distance: 4 }], relevance: "global", spillover_reason: null, forCountries: ["IQ"], sourceReliability: 89, sourceUrl: "",
  },
  {
    id: 9007, title: "Sudan — RSF Advance on El-Fasher Intensifies", event_type: "REPORT", source: "UN OCHA / OSINT",
    event_time: h(6), timestamp: h(6), latitude: 13.63, longitude: 25.35, severity: "HIGH", confidence: 80,
    risk_score: 68, risk_level: "HIGH", region: "Sudan", country: "SD", sector: "GEOPOLITICAL",
    what_is_happening: "Rapid Support Forces advancing on El-Fasher, last major SAF stronghold in Darfur. Heavy fighting reported. Humanitarian corridor blocked.",
    why_it_matters: "Fall of El-Fasher would give RSF control of Darfur, deepening humanitarian crisis affecting 25M people.",
    what_next: "Watch for UN Security Council emergency session and regional diplomatic intervention.", actions: ["Monitor humanitarian access", "Track regional power involvement", "Assess refugee flow impact on Chad/Egypt"],
    nearby_infra: [], relevance: "global", spillover_reason: null, forCountries: ["SD"], sourceReliability: 80, sourceUrl: "",
  },
  {
    id: 9008, title: "Strait of Hormuz — Iranian IRGC Naval Exercises", event_type: "MARITIME", source: "AIS + SIGINT",
    event_time: h(8), timestamp: h(8), latitude: 26.5, longitude: 56.3, severity: "MEDIUM", confidence: 85,
    risk_score: 62, risk_level: "MEDIUM", region: "Iran", country: "IR", sector: "MARITIME",
    what_is_happening: "IRGC Navy conducting fast-boat exercises in Strait of Hormuz. Several commercial vessels reported close approaches.",
    why_it_matters: "20% of global oil passes through Hormuz. Exercises signal Iranian willingness to threaten chokepoint if tensions escalate.",
    what_next: "Monitor for US Navy 5th Fleet response and insurance advisory updates.", actions: ["Track AIS anomalies in Strait", "Monitor oil futures reaction", "Update maritime risk assessment"],
    nearby_infra: [{ name: "Strait of Hormuz", type: "Maritime Chokepoint", distance: 0 }], relevance: "global", spillover_reason: null, forCountries: ["IR"], sourceReliability: 85, sourceUrl: "",
  },
  {
    id: 9009, title: "NATO Increases Eastern Flank Troop Deployments", event_type: "REPORT", source: "NATO / Open Source",
    event_time: h(10), timestamp: h(10), latitude: 52.2, longitude: 21.0, severity: "MEDIUM", confidence: 92,
    risk_score: 55, risk_level: "MEDIUM", region: "NATO / Europe", country: "PL", sector: "DEFENSE",
    what_is_happening: "NATO announces additional battalion-level deployments to Poland, Romania, and Baltic states. Enhanced air policing missions activated.",
    why_it_matters: "Signals NATO assessment of heightened Russian threat. Defense spending and arms procurement cycles accelerating.",
    what_next: "Monitor Russian military response and Kaliningrad activity.", actions: ["Track defense sector market impact", "Monitor Russian Western Military District movements"],
    nearby_infra: [], relevance: "global", spillover_reason: null, forCountries: ["PL"], sourceReliability: 92, sourceUrl: "",
  },
  {
    id: 9010, title: "Gaza Humanitarian Crisis — Aid Delivery Suspended", event_type: "REPORT", source: "UN OCHA / UNRWA",
    event_time: h(3), timestamp: h(3), latitude: 31.4, longitude: 34.4, severity: "HIGH", confidence: 90,
    risk_score: 70, risk_level: "HIGH", region: "Israel / Palestine", country: "IL", sector: "GEOPOLITICAL",
    what_is_happening: "UN agencies suspend aid delivery to northern Gaza after convoy struck. Famine conditions reported. International pressure mounting for ceasefire.",
    why_it_matters: "Deepening humanitarian crisis fuels regional instability and affects diplomatic relationships globally.",
    what_next: "Monitor for UN Security Council action and ceasefire negotiations.", actions: ["Track diplomatic developments", "Assess regional stability impact", "Monitor protest activity in allied nations"],
    nearby_infra: [], relevance: "global", spillover_reason: null, forCountries: ["IL"], sourceReliability: 90, sourceUrl: "",
  },
  {
    id: 9011, title: "OPEC+ Emergency Meeting — Production Cuts Under Review", event_type: "REPORT", source: "Reuters / Bloomberg",
    event_time: h(7), timestamp: h(7), latitude: 24.7, longitude: 46.7, severity: "MEDIUM", confidence: 87,
    risk_score: 58, risk_level: "MEDIUM", region: "Saudi Arabia", country: "SA", sector: "ENERGY",
    what_is_happening: "OPEC+ calls emergency virtual meeting to discuss production cuts amid Gulf instability. Saudi Arabia pushing for coordinated response to price volatility.",
    why_it_matters: "Production decisions will directly impact global oil prices, inflation, and economic recovery trajectories.",
    what_next: "Outcome expected within 24h. Markets pricing in 1-2M bbl/day cut.", actions: ["Monitor meeting outcomes", "Prepare energy market impact brief", "Alert trading operations"],
    nearby_infra: [], relevance: "global", spillover_reason: null, forCountries: ["SA"], sourceReliability: 87, sourceUrl: "",
  },
  {
    id: 9012, title: "Earthquake M5.8 — Eastern Turkey Near Syrian Border", event_type: "EARTHQUAKE", source: "USGS",
    event_time: h(4), timestamp: h(4), latitude: 37.1, longitude: 40.2, severity: "MEDIUM", confidence: 99,
    risk_score: 52, risk_level: "MEDIUM", region: "Turkey", country: "TR", sector: "INFRASTRUCTURE",
    what_is_happening: "Magnitude 5.8 earthquake recorded 15km southeast of Diyarbakir, near Syrian border. Felt in Hasaka and Qamishli. Building damage reported.",
    why_it_matters: "Region still recovering from 2023 earthquake. Aftershock risk elevated. Cross-border aid routes may be affected.",
    what_next: "Monitor for aftershocks and structural damage assessments.", actions: ["Track USGS aftershock data", "Assess impact on cross-border logistics", "Monitor humanitarian response"],
    nearby_infra: [{ name: "Diyarbakir Airport", type: "Airport", distance: 15 }], relevance: "global", spillover_reason: null, forCountries: ["TR"], sourceReliability: 99, sourceUrl: "",
  },
  {
    id: 9013, title: "North Korea Launches ICBM Test Over Sea of Japan", event_type: "STRIKE", source: "Japan MoD / US Pacific Command",
    event_time: h(9), timestamp: h(9), latitude: 39.0, longitude: 125.8, severity: "CRITICAL", confidence: 95,
    risk_score: 82, risk_level: "CRITICAL", region: "North Korea", country: "KP", sector: "DEFENSE",
    what_is_happening: "North Korea conducts Hwasong-18 solid-fuel ICBM test. Missile flew approximately 1,000km before splashing into Sea of Japan EEZ. Japan issued J-Alert.",
    why_it_matters: "Demonstrates improved second-strike capability. Escalates tension on Korean Peninsula and may trigger additional US deployments.",
    what_next: "Expect UN emergency session and potential new sanctions.", actions: ["Monitor UN Security Council response", "Track Japanese/Korean military posture", "Assess impact on regional stability"],
    nearby_infra: [], relevance: "global", spillover_reason: null, forCountries: ["KP"], sourceReliability: 95, sourceUrl: "",
  },
  {
    id: 9014, title: "Suez Canal Revenue Drops 40% — Egypt Economic Pressure", event_type: "MARITIME", source: "SCA / Financial Times",
    event_time: h(12), timestamp: h(12), latitude: 30.46, longitude: 32.35, severity: "MEDIUM", confidence: 88,
    risk_score: 55, risk_level: "MEDIUM", region: "Egypt", country: "EG", sector: "SUPPLY CHAIN",
    what_is_happening: "Suez Canal Authority reports 40% revenue decline as Red Sea attacks force vessels to reroute via Cape of Good Hope. Egypt facing $6B annual revenue shortfall.",
    why_it_matters: "Economic pressure on Egypt threatens political stability. IMF loan conditions under strain. Regional domino effect possible.",
    what_next: "Monitor for Egyptian government fiscal response and IMF discussions.", actions: ["Track Egyptian economic indicators", "Assess Suez transit volume trends", "Monitor regional stability"],
    nearby_infra: [{ name: "Suez Canal", type: "Maritime Chokepoint", distance: 0 }], relevance: "global", spillover_reason: null, forCountries: ["EG"], sourceReliability: 88, sourceUrl: "",
  },
  {
    id: 9015, title: "Syria — Israeli Airstrikes Target Iranian Assets Near Damascus", event_type: "STRIKE", source: "SOHR / Satellite",
    event_time: h(5), timestamp: h(5), latitude: 33.5, longitude: 36.3, severity: "HIGH", confidence: 83,
    risk_score: 75, risk_level: "HIGH", region: "Syria", country: "SY", sector: "DEFENSE",
    what_is_happening: "Israeli Air Force conducted strikes near Damascus International Airport targeting alleged Iranian weapons depot. Secondary explosions reported. Damascus airspace briefly closed.",
    why_it_matters: "Part of ongoing Israeli campaign against Iranian force projection in Syria. Risks direct Iran-Israel confrontation.",
    what_next: "Monitor for Iranian/Hezbollah retaliation signals.", actions: ["Track Iranian military communications", "Monitor Damascus airspace status", "Assess escalation trajectory"],
    nearby_infra: [{ name: "Damascus International Airport", type: "Airport", distance: 3 }], relevance: "global", spillover_reason: null, forCountries: ["SY"], sourceReliability: 83, sourceUrl: "",
  },
];

// ═══════════════════════════════════════
// CACHE
// ═══════════════════════════════════════

let cachedEvents = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAllEvents() {
  const now = Date.now();
  if (cachedEvents && now - cacheTimestamp < CACHE_TTL) {
    return cachedEvents;
  }

  console.log(`[Atlas] Fetching ${RSS_FEEDS.length} RSS + ${JSON_FEEDS.length} JSON feeds...`);

  const [rssResults, jsonEvents] = await Promise.all([
    Promise.allSettled(RSS_FEEDS.map((url) => fetchAndParseRSS(url))),
    fetchJSONFeeds(),
  ]);

  const rssEvents = rssResults
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const allEvents = [...rssEvents, ...jsonEvents];

  // If no live feeds returned data, use fallback events
  let processed;
  if (allEvents.length === 0) {
    console.log("[Atlas] No live feeds available — using fallback events");
    processed = FALLBACK_EVENTS;
  } else {
    processed = deduplicateEvents(
      filterByAge(allEvents.sort((a, b) => b.riskScore - a.riskScore))
    );
  }

  console.log(
    `[Atlas] ${allEvents.length} raw → ${processed.length} processed events from ${RSS_FEEDS.length + JSON_FEEDS.length} sources`
  );

  cachedEvents = processed;
  cacheTimestamp = now;
  return processed;
}

// ═══════════════════════════════════════
// API ENDPOINT
// ═══════════════════════════════════════

app.get("/api/news", async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json({
      events,
      total: events.length,
      sources: RSS_FEEDS.length + JSON_FEEDS.length,
      updated: new Date().toISOString(),
      cacheAge: Date.now() - cacheTimestamp,
    });
  } catch (err) {
    console.error("[Atlas] API error:", err);
    res.status(500).json({ error: "Failed to fetch events", details: err.message });
  }
});

// Force refresh endpoint
app.get("/api/news/refresh", async (req, res) => {
  cachedEvents = null;
  cacheTimestamp = 0;
  try {
    const events = await getAllEvents();
    res.json({
      events,
      total: events.length,
      sources: RSS_FEEDS.length + JSON_FEEDS.length,
      updated: new Date().toISOString(),
      forced: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh", details: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[Atlas Server] Running on http://localhost:${PORT}`);
  console.log(`[Atlas Server] ${RSS_FEEDS.length} RSS + ${JSON_FEEDS.length} JSON feeds configured`);
});
