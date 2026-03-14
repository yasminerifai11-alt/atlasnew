import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════
   Atlas Command — Live News Feed Aggregator
   Fetches RSS + JSON feeds server-side (avoids CORS).
   Returns normalized events array matching ApiEvent shape.
   ═══════════════════════════════════════════════════════════════════ */

interface FeedConfig {
  name: string;
  url: string;
  region: string;
  reliability: number;
  type?: "json" | "rss";
  parser?: "usgs" | "eonet" | "gdelt";
}

const NEWS_FEEDS: FeedConfig[] = [
  // TIER 1 — Most reliable, update every few minutes
  { name: "BBC Middle East", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml", region: "Middle East", reliability: 95 },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", region: "Global", reliability: 95 },
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews", region: "Global", reliability: 96 },
  { name: "Reuters Top", url: "https://feeds.reuters.com/reuters/topNews", region: "Global", reliability: 96 },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", region: "Middle East", reliability: 90 },
  { name: "France 24", url: "https://rss.france24.com/rss/en", region: "Global", reliability: 91 },
  { name: "Sky News World", url: "https://feeds.skynews.com/feeds/rss/world.xml", region: "Global", reliability: 85 },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss", region: "Global", reliability: 90 },
  { name: "DW News", url: "https://rss.dw.com/rss/en-all", region: "Global", reliability: 85 },
  // TIER 2 — Regional focus
  { name: "Arab News", url: "https://www.arabnews.com/rss.xml", region: "Middle East", reliability: 80 },
  { name: "Al Arabiya", url: "https://english.alarabiya.net/rss.xml", region: "Middle East", reliability: 82 },
  { name: "Middle East Eye", url: "https://www.middleeasteye.net/rss", region: "Middle East", reliability: 80 },
  { name: "Rudaw", url: "https://rudaw.net/english/rss", region: "Middle East", reliability: 75 },
  // TIER 3 — Defense/Security
  { name: "Defense News", url: "https://www.defensenews.com/rss/", region: "Global", reliability: 85 },
  { name: "Breaking Defense", url: "https://breakingdefense.com/feed/", region: "Global", reliability: 82 },
  { name: "USNI News", url: "https://news.usni.org/feed", region: "Global", reliability: 85 },
  // TIER 4 — Energy
  { name: "OilPrice", url: "https://oilprice.com/rss/main", region: "Global", reliability: 78 },
  // TIER 5 — Wire services
  { name: "GlobalSecurity", url: "https://www.globalsecurity.org/rss/news.rss", region: "Global", reliability: 75 },
  // JSON feeds
  { name: "USGS Earthquakes", url: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson", region: "Global", reliability: 99, type: "json", parser: "usgs" },
  { name: "NASA EONET", url: "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50", region: "Global", reliability: 95, type: "json", parser: "eonet" },
  { name: "GDELT", url: "https://api.gdeltproject.org/api/v2/doc/doc?query=war+attack+strike+missile+conflict+explosion&mode=artlist&maxrecords=25&format=json&timespan=24h", region: "Global", reliability: 85, type: "json", parser: "gdelt" },
];

/* ─── Country Detection ───────────────────────────────── */

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  Lebanon: ["lebanon", "lebanese", "beirut", "hezbollah", "south lebanon", "bekaa", "tripoli lebanon", "litani", "dahiyeh", "nabatieh"],
  Gaza: ["gaza", "hamas", "rafah", "khan younis", "jabalia", "gaza strip", "gazan", "gaza city"],
  Palestine: ["palestine", "palestinian", "west bank", "ramallah", "jenin", "nablus", "hebron", "occupied territories"],
  Yemen: ["yemen", "yemeni", "houthi", "houthis", "sanaa", "aden", "hodeidah", "marib", "ansarallah", "red sea attack"],
  Iran: ["iran", "iranian", "tehran", "irgc", "revolutionary guard", "uranium enrichment", "natanz", "fordow", "isfahan", "khamenei"],
  Iraq: ["iraq", "iraqi", "baghdad", "basra", "mosul", "erbil", "kirkuk", "pmu", "kataib"],
  Syria: ["syria", "syrian", "damascus", "aleppo", "idlib", "deir ezzor", "hts", "isis syria", "latakia"],
  Kuwait: ["kuwait", "kuwaiti", "kuwait city", "mina al-ahmadi", "kpc", "knpc", "camp arifjan"],
  "Saudi Arabia": ["saudi", "riyadh", "jeddah", "aramco", "neom", "mbs", "kingdom of saudi", "mecca", "medina"],
  UAE: ["uae", "emirates", "dubai", "abu dhabi", "sharjah", "adnoc", "jebel ali"],
  Qatar: ["qatar", "qatari", "doha", "qatar energy", "lng qatar"],
  Bahrain: ["bahrain", "bahraini", "manama", "fifth fleet", "5th fleet"],
  Oman: ["oman", "omani", "muscat", "strait of hormuz"],
  Ukraine: ["ukraine", "ukrainian", "kyiv", "kharkiv", "zaporizhzhia", "donbas", "crimea", "zelenskyy", "odesa"],
  Russia: ["russia", "russian", "moscow", "kremlin", "putin", "wagner"],
  Israel: ["israel", "israeli", "tel aviv", "idf", "netanyahu", "jerusalem"],
  Pakistan: ["pakistan", "pakistani", "islamabad", "karachi", "lahore", "peshawar"],
  Sudan: ["sudan", "sudanese", "khartoum", "rsf", "darfur", "rapid support"],
  Ethiopia: ["ethiopia", "ethiopian", "addis ababa", "tigray", "amhara"],
  Somalia: ["somalia", "somali", "mogadishu", "al shabaab", "shabaab"],
  Egypt: ["egypt", "egyptian", "cairo", "suez canal", "sinai"],
  Jordan: ["jordan", "jordanian", "amman"],
  Turkey: ["turkey", "turkish", "ankara", "istanbul", "erdogan", "turkiye"],
  Libya: ["libya", "libyan", "tripoli libya", "benghazi"],
  China: ["china", "chinese", "beijing", "taiwan", "south china sea", "xi jinping"],
};

function detectCountry(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return country;
  }
  return null;
}

function detectAllCountries(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) found.push(country);
  }
  return found;
}

/* ─── Severity Detection ──────────────────────────────── */

const SEVERITY_KEYWORDS: Record<string, string[]> = {
  CRITICAL: [
    "war", "invasion", "nuclear", "attack", "airstrike", "missile", "explosion",
    "killed", "dead", "casualties", "strike", "bomb", "assassination", "coup",
    "chemical weapon", "genocide", "mass casualty", "warship", "naval clash",
    "airstrikes", "bombard", "offensive", "ground operation",
  ],
  HIGH: [
    "conflict", "fighting", "wounded", "injured", "clashes", "protest",
    "sanctions", "arrested", "detained", "threat", "warning", "alert",
    "escalation", "tension", "gunfire", "shelling", "rocket", "siege",
    "blockade", "ceasefire", "truce", "hostage",
  ],
  ELEVATED: [
    "concern", "monitor", "watchlist", "risk", "crisis", "emergency",
    "displacement", "evacuation", "shutdown", "disruption", "incident",
    "refugee", "humanitarian", "famine", "epidemic",
  ],
};

function detectSeverity(text: string): string {
  const lower = text.toLowerCase();
  for (const [severity, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return severity;
  }
  return "MONITORING";
}

function severityToRiskScore(severity: string): number {
  switch (severity) {
    case "CRITICAL": return 80 + Math.floor(Math.random() * 15); // 80-94
    case "HIGH": return 65 + Math.floor(Math.random() * 15); // 65-79
    case "ELEVATED": return 45 + Math.floor(Math.random() * 15); // 45-59
    default: return 25 + Math.floor(Math.random() * 15); // 25-39
  }
}

function severityToRiskLevel(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "CRITICAL";
    case "HIGH": return "HIGH";
    case "ELEVATED": return "MEDIUM";
    default: return "LOW";
  }
}

/* ─── Sector Detection ────────────────────────────────── */

const SECTOR_KEYWORDS: Record<string, string[]> = {
  ENERGY: ["oil", "gas", "energy", "opec", "brent", "crude", "pipeline", "refinery", "lng", "nuclear power", "power plant", "aramco", "adnoc", "fuel"],
  MARITIME: ["ship", "vessel", "tanker", "port", "strait", "hormuz", "suez", "red sea", "bab el", "naval", "coast guard", "navy", "maritime", "cargo", "shipping"],
  SECURITY: ["military", "attack", "troops", "forces", "war", "conflict", "missile", "drone", "airstrike", "bomb", "terrorist", "insurgent", "soldier", "army", "defense"],
  CYBER: ["cyber", "hack", "ransomware", "data breach", "malware", "infrastructure attack", "internet shutdown", "ddos"],
  FINANCIAL: ["economy", "markets", "stocks", "currency", "inflation", "bank", "sanctions", "trade", "gdp", "debt", "investment"],
  INFRASTRUCTURE: ["airport", "bridge", "dam", "power grid", "water", "road", "hospital", "internet cable", "desalination"],
  AVIATION: ["aircraft", "airline", "flight", "airspace", "aviation", "helicopter", "airport attack"],
};

function detectSector(text: string): string {
  const lower = text.toLowerCase();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return sector;
  }
  return "SECURITY";
}

function detectEventType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/earthquake|quake|seismic|tsunami/)) return "EARTHQUAKE";
  if (lower.match(/hurricane|cyclone|storm|flood|wildfire|volcano|eruption/)) return "NATURAL_DISASTER";
  if (lower.match(/nuclear|enrichment|uranium/)) return "NUCLEAR";
  if (lower.match(/cyber|hack|ransomware/)) return "CYBER";
  if (lower.match(/airstrike|missile|bomb|war|military|attack|strike/)) return "MILITARY";
  if (lower.match(/sanctions|diplomacy|treaty|agreement/)) return "GEOPOLITICAL";
  if (lower.match(/oil|gas|energy|pipeline/)) return "ECONOMIC";
  if (lower.match(/ship|naval|maritime|vessel/)) return "MARITIME";
  return "GEOPOLITICAL";
}

/* ─── Region Mapping ──────────────────────────────────── */

const COUNTRY_REGION: Record<string, string> = {
  Lebanon: "Levant", Gaza: "Levant", Palestine: "Levant", Israel: "Levant",
  Syria: "Levant", Jordan: "Levant", Iraq: "Levant",
  Yemen: "Arabian Peninsula", Kuwait: "Persian Gulf", "Saudi Arabia": "Persian Gulf",
  UAE: "Persian Gulf", Qatar: "Persian Gulf", Bahrain: "Persian Gulf", Oman: "Persian Gulf",
  Iran: "Persian Gulf", Egypt: "North Africa", Libya: "North Africa",
  Sudan: "East Africa", Ethiopia: "East Africa", Somalia: "Horn of Africa",
  Turkey: "Anatolia", Pakistan: "South Asia",
  Ukraine: "Eastern Europe", Russia: "Eastern Europe", China: "East Asia",
};

/* ─── Coordinate Mapping ──────────────────────────────── */

const COUNTRY_COORDS: Record<string, [number, number]> = {
  Lebanon: [33.9, 35.5], Gaza: [31.4, 34.4], Palestine: [31.9, 35.2], Israel: [31.8, 35.2],
  Syria: [35.0, 38.0], Jordan: [31.0, 36.0], Iraq: [33.2, 44.4],
  Yemen: [15.6, 48.5], Kuwait: [29.4, 47.9], "Saudi Arabia": [24.7, 46.7],
  UAE: [24.5, 54.4], Qatar: [25.3, 51.2], Bahrain: [26.2, 50.6], Oman: [23.6, 58.5],
  Iran: [35.7, 51.4], Egypt: [30.0, 31.2], Libya: [32.9, 13.2],
  Sudan: [15.6, 32.5], Ethiopia: [9.0, 38.7], Somalia: [2.0, 45.3],
  Turkey: [39.9, 32.9], Pakistan: [33.7, 73.0],
  Ukraine: [50.4, 30.5], Russia: [55.8, 37.6], China: [39.9, 116.4],
};

/* ─── ID Generation ───────────────────────────────────── */

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

/* ─── HTML Stripper ──────────────────────────────────── */

function stripHTML(str: string): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/* ─── RSS Parser (no dependency) ──────────────────────── */

function parseRSSItems(xml: string): Array<{ title: string; description: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; description: string; link: string; pubDate: string }> = [];

  // Match <item> blocks
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const desc = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || "";
    const link = block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";

    // Strip ALL HTML from both title and description
    const cleanTitle = stripHTML(title);
    let cleanDesc = stripHTML(desc);

    // If description after stripping is too short, use the title
    if (cleanDesc.length < 20) {
      cleanDesc = cleanTitle;
    }

    if (cleanTitle) {
      items.push({ title: cleanTitle, description: cleanDesc, link, pubDate });
    }
  }

  return items;
}

/* ─── Event normalization ─────────────────────────────── */

interface NormalizedEvent {
  id: number;
  title: string;
  description: string;
  event_time: string;
  latitude: number;
  longitude: number;
  region: string;
  country: string;
  event_type: string;
  sector: string;
  source: string;
  source_count: number;
  confidence_score: number;
  severity: string;
  risk_score: number;
  risk_level: string;
  situation_en: string;
  why_matters_en: string;
  forecast_en: string;
  actions_en: string[];
  financial_impact_en: string;
  region_impact_en: string;
}

function normalizeRSSEvent(
  item: { title: string; description: string; link: string; pubDate: string },
  feed: FeedConfig,
): NormalizedEvent | null {
  const fullText = `${item.title} ${item.description}`;
  const country = detectCountry(fullText);
  if (!country) return null;

  const severity = detectSeverity(fullText);
  const sector = detectSector(fullText);
  const eventType = detectEventType(fullText);
  const riskScore = severityToRiskScore(severity);
  const riskLevel = severityToRiskLevel(severity);
  const region = COUNTRY_REGION[country] || feed.region;
  const coords = COUNTRY_COORDS[country] || [0, 0];
  const eventTime = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

  return {
    id: hashCode(item.link || item.title) % 100000 + 10000,
    title: item.title,
    description: item.description.slice(0, 200),
    event_time: eventTime,
    latitude: coords[0] + (Math.random() - 0.5) * 2,
    longitude: coords[1] + (Math.random() - 0.5) * 2,
    region,
    country,
    event_type: eventType,
    sector,
    source: feed.name,
    source_count: 1,
    confidence_score: feed.reliability,
    severity,
    risk_score: riskScore,
    risk_level: riskLevel,
    situation_en: item.description.slice(0, 300),
    why_matters_en: "",
    forecast_en: "",
    actions_en: [],
    financial_impact_en: "",
    region_impact_en: "",
  };
}

/* ─── JSON Parsers ────────────────────────────────────── */

function parseUSGS(data: any): NormalizedEvent[] {
  if (!data?.features) return [];
  return data.features.slice(0, 10).map((f: any) => {
    const props = f.properties || {};
    const coords = f.geometry?.coordinates || [0, 0, 0];
    const mag = props.mag || 0;
    const severity = mag >= 7 ? "CRITICAL" : mag >= 6 ? "HIGH" : mag >= 5 ? "ELEVATED" : "MONITORING";
    const country = detectCountry(props.place || "") || "Unknown";
    return {
      id: hashCode(props.url || props.title || String(props.time)) % 100000 + 50000,
      title: `M${mag.toFixed(1)} Earthquake — ${props.place || "Unknown Location"}`,
      description: `Magnitude ${mag.toFixed(1)} earthquake detected at depth ${(coords[2] || 0).toFixed(0)}km. ${props.place || ""}`,
      event_time: new Date(props.time || Date.now()).toISOString(),
      latitude: coords[1] || 0,
      longitude: coords[0] || 0,
      region: COUNTRY_REGION[country] || "Global",
      country,
      event_type: "EARTHQUAKE",
      sector: "INFRASTRUCTURE",
      source: "USGS",
      source_count: 1,
      confidence_score: 99,
      severity,
      risk_score: severityToRiskScore(severity),
      risk_level: severityToRiskLevel(severity),
      situation_en: `Magnitude ${mag.toFixed(1)} earthquake detected. ${props.place || ""}`,
      why_matters_en: "",
      forecast_en: "",
      actions_en: [],
      financial_impact_en: "",
      region_impact_en: "",
    } as NormalizedEvent;
  }).filter((e: NormalizedEvent) => e.country !== "Unknown");
}

function parseEONET(data: any): NormalizedEvent[] {
  if (!data?.events) return [];
  return data.events.slice(0, 15).map((ev: any) => {
    const geom = ev.geometry?.[0] || {};
    const coords = geom.coordinates || [0, 0];
    const title = ev.title || "Natural Event";
    const country = detectCountry(title) || "Unknown";
    const category = ev.categories?.[0]?.title || "Natural Disaster";
    return {
      id: hashCode(ev.id || title) % 100000 + 60000,
      title,
      description: `${category} event detected by NASA EONET. ${ev.sources?.[0]?.url || ""}`,
      event_time: geom.date || new Date().toISOString(),
      latitude: coords[1] || 0,
      longitude: coords[0] || 0,
      region: COUNTRY_REGION[country] || "Global",
      country,
      event_type: "NATURAL_DISASTER",
      sector: "INFRASTRUCTURE",
      source: "NASA EONET",
      source_count: 1,
      confidence_score: 95,
      severity: "ELEVATED",
      risk_score: severityToRiskScore("ELEVATED"),
      risk_level: "MEDIUM",
      situation_en: `${category}: ${title}`,
      why_matters_en: "",
      forecast_en: "",
      actions_en: [],
      financial_impact_en: "",
      region_impact_en: "",
    } as NormalizedEvent;
  }).filter((e: NormalizedEvent) => e.country !== "Unknown");
}

function parseGDELT(data: any): NormalizedEvent[] {
  if (!data?.articles) return [];
  return data.articles.slice(0, 20).map((art: any) => {
    const title = art.title || "";
    const desc = art.seendate ? `${title}` : title;
    const country = detectCountry(`${title} ${art.domain || ""}`);
    if (!country) return null;

    const severity = detectSeverity(title);
    const sector = detectSector(title);
    return {
      id: hashCode(art.url || title) % 100000 + 70000,
      title,
      description: desc.slice(0, 200),
      event_time: art.seendate ? new Date(art.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z")).toISOString() : new Date().toISOString(),
      latitude: COUNTRY_COORDS[country]?.[0] || 0,
      longitude: COUNTRY_COORDS[country]?.[1] || 0,
      region: COUNTRY_REGION[country] || "Global",
      country,
      event_type: detectEventType(title),
      sector,
      source: `GDELT/${art.domain || "unknown"}`,
      source_count: 1,
      confidence_score: 80,
      severity,
      risk_score: severityToRiskScore(severity),
      risk_level: severityToRiskLevel(severity),
      situation_en: desc.slice(0, 300),
      why_matters_en: "",
      forecast_en: "",
      actions_en: [],
      financial_impact_en: "",
      region_impact_en: "",
    } as NormalizedEvent;
  }).filter(Boolean) as NormalizedEvent[];
}

/* ─── In-memory cache ─────────────────────────────────── */

let cachedEvents: NormalizedEvent[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/* ─── Main handler ────────────────────────────────────── */

export async function GET() {
  const now = Date.now();

  // Return cached if fresh
  if (cachedEvents.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({
      events: cachedEvents,
      updated: new Date(cacheTimestamp).toISOString(),
      cached: true,
      source_count: new Set(cachedEvents.map((e) => e.source)).size,
    });
  }

  const allEvents: NormalizedEvent[] = [];
  const errors: string[] = [];

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: { "User-Agent": "AtlasCommand/2.0 (intelligence-platform)" },
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        if (feed.type === "json") {
          const data = await res.json();
          if (feed.parser === "usgs") return { feed: feed.name, events: parseUSGS(data) };
          if (feed.parser === "eonet") return { feed: feed.name, events: parseEONET(data) };
          if (feed.parser === "gdelt") return { feed: feed.name, events: parseGDELT(data) };
          return { feed: feed.name, events: [] };
        } else {
          const xml = await res.text();
          const items = parseRSSItems(xml);
          const events = items
            .map((item) => normalizeRSSEvent(item, feed))
            .filter(Boolean) as NormalizedEvent[];
          return { feed: feed.name, events };
        }
      } catch (err: any) {
        clearTimeout(timeout);
        throw new Error(`${feed.name}: ${err.message}`);
      }
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allEvents.push(...result.value.events);
    } else {
      errors.push(result.reason?.message || "Unknown error");
    }
  }

  // Deduplicate by first 6 words of title
  const seenMap = new Map<string, NormalizedEvent>();
  for (const e of allEvents) {
    const key = e.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(" ").slice(0, 6).join(" ");
    const existing = seenMap.get(key);
    if (!existing || e.confidence_score > existing.confidence_score) {
      seenMap.set(key, e);
    }
  }
  let deduped = Array.from(seenMap.values());

  // Age filter: 24h for regular, 72h for critical/ongoing
  const ONGOING_KEYWORDS = ["war", "conflict", "nuclear", "blockade", "occupation", "sanctions", "crisis", "ongoing", "continues"];
  const h24 = 24 * 60 * 60 * 1000;
  const h72 = 72 * 60 * 60 * 1000;
  deduped = deduped.filter((e) => {
    const age = now - new Date(e.event_time).getTime();
    if (isNaN(age) || age < 0) return true;
    if (e.severity === "CRITICAL") return age < h72;
    if (ONGOING_KEYWORDS.some((k) => e.title.toLowerCase().includes(k))) return age < h72;
    return age < h24;
  });

  // Sort by risk score desc, then by time desc
  deduped.sort((a, b) => b.risk_score - a.risk_score || new Date(b.event_time).getTime() - new Date(a.event_time).getTime());

  // Update cache
  cachedEvents = deduped;
  cacheTimestamp = now;

  return NextResponse.json({
    events: deduped,
    updated: new Date().toISOString(),
    cached: false,
    source_count: new Set(deduped.map((e) => e.source)).size,
    feed_errors: errors.length > 0 ? errors : undefined,
  });
}
