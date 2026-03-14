"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore, ROLE_META } from "@/stores/profile-store";
import type { ApiEvent } from "@/lib/api";
import { getLocalizedField, translateTag, translateRiskLevel } from "@/utils/translate";

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

interface ForecastItem {
  probability: number;
  text: string;
}

interface ActionItem {
  number: string;
  timing: string;
  action: string;
  reason: string;
}

interface DetailData {
  regional: string;
  sector: string;
  consequences: Array<{ from: string; to: string; label: string }>;
  infrastructure: Array<{ name: string; status: string; detail: string }>;
  signals: string[];
  sources: Array<{ name: string; time: string; reliability: number }>;
}

interface BriefCache {
  situation: string;
  means: string[] | null;
  forecast: { h24: ForecastItem; h48: ForecastItem; h72: ForecastItem; wildcard: ForecastItem };
  actions: ActionItem[];
  detail: DetailData;
  generatedAt: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════ */

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const SECTOR_AR: Record<string, string> = {
  ENERGY: "الطاقة",
  MARITIME: "البحري",
  SECURITY: "الأمن",
  CYBER: "الإلكتروني",
  FINANCIAL: "المالي",
  AVIATION: "الجوي",
  INFRASTRUCTURE: "البنية التحتية",
  DIPLOMATIC: "الدبلوماسي",
  TRADE: "التجارة",
  MILITARY: "العسكري",
};

const COUNTRY_OPTIONS = [
  { value: "ALL_GCC", labelEn: "All GCC", labelAr: "دول الخليج" },
  { value: "Kuwait", labelEn: "Kuwait", labelAr: "الكويت" },
  { value: "Saudi Arabia", labelEn: "Saudi Arabia", labelAr: "السعودية" },
  { value: "UAE", labelEn: "UAE", labelAr: "الإمارات" },
  { value: "Qatar", labelEn: "Qatar", labelAr: "قطر" },
  { value: "Bahrain", labelEn: "Bahrain", labelAr: "البحرين" },
  { value: "Oman", labelEn: "Oman", labelAr: "عُمان" },
  { value: "Iraq", labelEn: "Iraq", labelAr: "العراق" },
  { value: "Iran", labelEn: "Iran", labelAr: "إيران" },
  { value: "Jordan", labelEn: "Jordan", labelAr: "الأردن" },
  { value: "Egypt", labelEn: "Egypt", labelAr: "مصر" },
  { value: "Turkey", labelEn: "Turkey", labelAr: "تركيا" },
  { value: "Pakistan", labelEn: "Pakistan", labelAr: "باكستان" },
  { value: "Russia", labelEn: "Russia", labelAr: "روسيا" },
  { value: "China", labelEn: "China", labelAr: "الصين" },
  { value: "Ukraine", labelEn: "Ukraine", labelAr: "أوكرانيا" },
  { value: "Yemen", labelEn: "Yemen", labelAr: "اليمن" },
  { value: "Syria", labelEn: "Syria", labelAr: "سوريا" },
  { value: "Lebanon", labelEn: "Lebanon", labelAr: "لبنان" },
];

const GCC_COUNTRIES = new Set(["Kuwait", "Saudi Arabia", "UAE", "Qatar", "Bahrain", "Oman"]);

const SECTOR_OPTIONS = ["ALL", "ENERGY", "SECURITY", "MARITIME", "CYBER", "FINANCIAL", "INFRASTRUCTURE", "AVIATION"] as const;

const TIMING_COLORS: Record<string, string> = {
  IMMEDIATE: "#ef4444",
  TODAY: "#f97316",
  "THIS WEEK": "#eab308",
  STRATEGIC: "#3b82f6",
};

const TIMING_BG: Record<string, string> = {
  IMMEDIATE: "rgba(220,38,38,0.2)",
  TODAY: "rgba(234,88,12,0.2)",
  "THIS WEEK": "rgba(202,138,4,0.2)",
  STRATEGIC: "rgba(37,99,235,0.2)",
};

const TIMING_BORDER: Record<string, string> = {
  IMMEDIATE: "rgba(220,38,38,0.3)",
  TODAY: "rgba(234,88,12,0.3)",
  "THIS WEEK": "rgba(202,138,4,0.3)",
  STRATEGIC: "rgba(37,99,235,0.3)",
};

const TIMING_TEXT: Record<string, string> = {
  IMMEDIATE: "#f87171",
  TODAY: "#fb923c",
  "THIS WEEK": "#fbbf24",
  STRATEGIC: "#60a5fa",
};

const INFRA_STATUS_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  "AT RISK": "#f97316",
  ELEVATED: "#eab308",
  NORMAL: "#22c55e",
};

const CACHE_TTL_MS = 15 * 60 * 1000;

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */

function timeAgo(dateStr: string, isAr: boolean): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 0) return isAr ? "الآن" : "just now";
  if (ms < 60000) return isAr ? `منذ ${Math.round(ms / 1000)} ث` : `${Math.round(ms / 1000)}s ago`;
  if (ms < 3600000) return isAr ? `منذ ${Math.round(ms / 60000)} د` : `${Math.round(ms / 60000)}m ago`;
  if (ms < 86400000) return isAr ? `منذ ${Math.round(ms / 3600000)} س` : `${Math.round(ms / 3600000)}h ago`;
  return isAr ? `منذ ${Math.round(ms / 86400000)} ي` : `${Math.round(ms / 86400000)}d ago`;
}

/** Build structured event context block for Claude prompts */
function buildEventContext(events: ApiEvent[]): string {
  return events
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 10)
    .map((e) => {
      const ago = timeAgo(e.event_time, false);
      return `EVENT: ${e.title}
SEVERITY: ${e.risk_level}
DESCRIPTION: ${e.situation_en || e.description}
RISK SCORE: ${e.risk_score}
TIME: ${ago}
LOCATION: ${e.country}, ${e.region}
SECTORS: ${e.sector}`;
    })
    .join("\n---\n");
}

const arabicSuffix = `\nRespond in formal Arabic MSA. No English words except proper nouns and source names.`;

function cacheKey(country: string, sectors: string[], lang: string): string {
  return `brief_${lang}_${country}_${sectors.sort().join("_")}`;
}

/* ═══════════════════════════════════════════════════════════════════
   Brief Cache (in-memory, 15min TTL)
   ═══════════════════════════════════════════════════════════════════ */

const briefCache = new Map<string, BriefCache>();

function getCached(key: string): BriefCache | null {
  const entry = briefCache.get(key);
  if (!entry) return null;
  if (Date.now() - new Date(entry.generatedAt).getTime() > CACHE_TTL_MS) {
    briefCache.delete(key);
    return null;
  }
  return entry;
}

/* ═══════════════════════════════════════════════════════════════════
   Claude API caller — passes events in request body
   ═══════════════════════════════════════════════════════════════════ */

async function callClaude(
  prompt: string,
  events: ApiEvent[],
  lang: string,
  profile?: { role: string; region: string; watchlist?: string } | null,
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      events: events.slice(0, 10).map((e) => ({
        id: e.id,
        title: e.title,
        title_ar: e.title_ar,
        description: e.description,
        risk_score: e.risk_score,
        risk_level: e.risk_level,
        region: e.region,
        country: e.country,
        sector: e.sector,
        event_type: e.event_type,
        event_time: e.event_time,
        situation_en: e.situation_en,
        situation_ar: e.situation_ar,
        source: e.source,
        source_count: e.source_count,
      })),
      lang,
      profile: profile || undefined,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data?.response || "";
}

function parseJSON(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function parseJSONArray(text: string): any[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

/** Strip HTML tags and decode entities from a string */
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
    .trim();
}

/* ═══════════════════════════════════════════════════════════════════
   Skeleton Loader
   ═══════════════════════════════════════════════════════════════════ */

const SKELETON_WIDTHS = [100, 80, 90, 85, 75];

function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%`,
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
    </div>
  );
}

function SkeletonBox({ height = 120 }: { height?: number }) {
  return (
    <div
      className="rounded border border-white/[0.04]"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        height,
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Section Header — blue left accent, uppercase, scannable
   ═══════════════════════════════════════════════════════════════════ */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.15em",
        color: "#60a5fa",
        textTransform: "uppercase" as const,
        paddingBottom: 8,
        borderBottom: "1px solid rgba(96,165,250,0.2)",
        marginBottom: 16,
        borderLeft: "2px solid #60a5fa",
        paddingLeft: 8,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Collapsible Section
   ═══════════════════════════════════════════════════════════════════ */

function CollapsibleSection({
  title,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  sectionKey: string;
  expanded: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-6 py-3 font-mono text-[10px] tracking-wider text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] transition-colors"
        style={{ letterSpacing: "0.15em" }}
      >
        <span style={{ borderLeft: "2px solid #60a5fa", paddingLeft: 8, color: expanded ? "#60a5fa" : undefined }}>
          {expanded ? "▼" : "▶"} {title}
        </span>
      </button>
      {expanded && (
        <div className="px-6 pb-4 animate-slide-up">{children}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function RealtimeBrief() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const profile = useProfileStore((s) => s.profile);

  const isAr = lang === "ar";
  const arText = isAr ? "arabic-text" : "";

  /* ─── State ─────────────────────────────────────────── */

  const [selectedCountry, setSelectedCountry] = useState("ALL_GCC");
  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set(["ALL"]));

  const [situation, setSituation] = useState<string | null>(null);
  const [means, setMeans] = useState<string[] | null>(null);
  const [forecast, setForecast] = useState<BriefCache["forecast"] | null>(null);
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);

  const [loadingSituation, setLoadingSituation] = useState(false);
  const [loadingMeans, setLoadingMeans] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [btnLabel, setBtnLabel] = useState<"idle" | "loading" | "done">("idle");

  const generationRef = useRef(0);

  /* ─── Sector toggle ─────────────────────────────────── */

  const toggleSector = useCallback((sector: string) => {
    setSelectedSectors((prev) => {
      if (sector === "ALL") return new Set(["ALL"]);
      const next = new Set(prev);
      next.delete("ALL");
      if (next.has(sector)) {
        next.delete(sector);
        if (next.size === 0) return new Set(["ALL"]);
      } else {
        next.add(sector);
      }
      return next;
    });
  }, []);

  /* ─── Filtered events ───────────────────────────────── */

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const countryMatch =
        selectedCountry === "ALL_GCC"
          ? GCC_COUNTRIES.has(e.country)
          : e.country === selectedCountry || e.region === selectedCountry;
      const sectorMatch = selectedSectors.has("ALL") || selectedSectors.has(e.sector);
      return countryMatch && sectorMatch;
    });
  }, [events, selectedCountry, selectedSectors]);

  const topEvents = useMemo(
    () => [...filteredEvents].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5),
    [filteredEvents],
  );

  const totalSources = useMemo(
    () => filteredEvents.reduce((sum, e) => sum + e.source_count, 0),
    [filteredEvents],
  );

  const isSpecificCountry = selectedCountry !== "ALL_GCC";
  const countryLabel = isAr
    ? (COUNTRY_OPTIONS.find((c) => c.value === selectedCountry)?.labelAr || selectedCountry)
    : (COUNTRY_OPTIONS.find((c) => c.value === selectedCountry)?.labelEn || selectedCountry);
  const sectorsLabel = selectedSectors.has("ALL")
    ? (isAr ? "جميع القطاعات" : "All Sectors")
    : Array.from(selectedSectors).map((s) => isAr ? (SECTOR_AR[s] || s) : s).join(", ");

  // Metrics
  const criticalCount = filteredEvents.filter((e) => e.risk_level === "CRITICAL").length;
  const highCount = filteredEvents.filter((e) => e.risk_level === "HIGH").length;
  const posture = criticalCount >= 2 ? "CRITICAL" : criticalCount >= 1 ? "ELEVATED" : highCount >= 1 ? "GUARDED" : "NOMINAL";
  const postureColor = posture === "CRITICAL" ? "#ef4444" : posture === "ELEVATED" ? "#f97316" : posture === "GUARDED" ? "#eab308" : "#22c55e";

  const sectorCounts: Record<string, number> = {};
  filteredEvents.forEach((e) => { sectorCounts[e.sector] = (sectorCounts[e.sector] || 0) + 1; });
  const topSectorName = Object.entries(sectorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";
  const topSectorPct = topSectorName !== "—" ? Math.round((sectorCounts[topSectorName] / (filteredEvents.length || 1)) * 100) : 0;

  /* ─── Profile ───────────────────────────────────────── */

  const profileCtx = useMemo(() => {
    if (!profile) return null;
    const meta = ROLE_META[profile.role];
    return { role: meta?.label || profile.role, region: profile.region, watchlist: profile.watchlist };
  }, [profile]);

  /* ─── Generate brief — 4 parallel Claude calls ──────── */

  const generateBrief = useCallback(async () => {
    if (filteredEvents.length === 0 && events.length === 0) return;

    const gen = ++generationRef.current;
    const evts = filteredEvents.length > 0 ? filteredEvents : events;
    const eventContext = buildEventContext(evts);
    const langSuffix = isAr ? arabicSuffix : "";
    const sectorsList = selectedSectors.has("ALL") ? "All" : Array.from(selectedSectors).join(", ");
    const countryCtx = selectedCountry === "ALL_GCC" ? "All GCC countries" : selectedCountry;

    // Check cache
    const key = cacheKey(selectedCountry, Array.from(selectedSectors), lang);
    const cached = getCached(key);
    if (cached) {
      setSituation(cached.situation);
      setMeans(cached.means);
      setForecast(cached.forecast);
      setActions(cached.actions);
      setDetail(cached.detail);
      setLastGenerated(cached.generatedAt);
      setIsCached(true);
      return;
    }

    setIsCached(false);
    setBtnLabel("loading");
    setLoadingSituation(true);
    setLoadingMeans(true);
    setLoadingForecast(true);
    setLoadingActions(true);
    setLoadingDetail(true);

    // ── PROMPT 1: SITUATION ──
    const situationPrompt = `You are a senior intelligence analyst at Atlas Command.

Current active events:
${eventContext}

Selected country: ${countryCtx}
Selected sectors: ${sectorsList}

Write a 4-6 sentence intelligence summary of the current situation.

Rules:
- Reference at least 3 of the active events by their exact name
- Include specific numbers (risk scores, percentages, quantities, dollar amounts)
- Name specific locations (Strait of Hormuz, Bab el-Mandeb, Mina Al-Ahmadi etc)
- If country is specific (not All), focus on that country's exposure
- Do NOT use phrases: "elevated tensions", "monitoring the situation", "heightened alert", "remains fluid"
- Write like a professional intelligence report, not news
- Maximum 120 words

Return ONLY the paragraph text, no JSON, no headers.${langSuffix}`;

    // ── PROMPT 2: MEANS (only for specific country) ──
    const meansPrompt = isSpecificCountry
      ? `You are a senior intelligence analyst at Atlas Command.

Current active events:
${eventContext}

Country: ${selectedCountry}

Write 3-5 bullet points explaining what these specific events mean for ${selectedCountry}.

Rules:
- Each bullet starts with a specific asset or institution in ${selectedCountry} followed by colon
- Include specific numbers and metrics
- Reference specific events
- No generic statements
- Format: "• [Asset]: [consequence]"
- Maximum 20 words per bullet

Return ONLY a JSON array of strings. Example: ["Mina Al-Ahmadi terminal: Within Iranian missile range. 1.5M bpd at risk if Hormuz closes.", "KIA $800B fund: ~12% energy exposure."]${langSuffix}`
      : null;

    // ── PROMPT 3: FORECAST ──
    const forecastPrompt = `You are a senior intelligence analyst at Atlas Command.

Current active events:
${eventContext}

Country: ${countryCtx}
Sectors: ${sectorsList}

Generate 4 forecasts based on these specific events.

Return ONLY valid JSON:
{
  "h24": {
    "probability": 70,
    "text": "2-3 sentences referencing specific events and locations"
  },
  "h48": {
    "probability": 55,
    "text": "..."
  },
  "h72": {
    "probability": 40,
    "text": "..."
  },
  "wildcard": {
    "probability": 15,
    "text": "low probability, extremely high impact scenario"
  }
}

Each text must reference at least one specific active event by name. Be specific not generic.${langSuffix}`;

    // ── PROMPT 4: ACTIONS ──
    const actionsPrompt = `You are a senior intelligence analyst at Atlas Command.

Current active events:
${eventContext}

Country: ${countryCtx}
Sectors: ${sectorsList}
User role: ${profileCtx?.role || "Senior Government Official"}

Generate 5 command actions.

Return ONLY valid JSON array:
[
  {
    "number": "01",
    "timing": "IMMEDIATE",
    "action": "specific action with named institution and protocol",
    "reason": "which specific event drives this action"
  }
]

Timing options: IMMEDIATE, TODAY, THIS WEEK, STRATEGIC

Rules:
- Name specific institutions (KPC, KIA, CENTCOM, 5th Fleet, Lloyd's, SWIFT, Aramco, etc)
- Name specific protocols or procedures where possible
- Include numbers and metrics
- Each action must reference a specific active event
- NEVER write: "Elevate monitoring", "Coordinate with teams", "Review contingency plans", "Prepare assessment"${langSuffix}`;

    // ── PROMPT 5: DETAIL SECTIONS ──
    const detailPrompt = `Active events:
${eventContext}

Country: ${countryCtx}
Sectors: ${sectorsList}

Generate intelligence detail in this exact JSON structure:
{
  "regional": "2-3 paragraph analysis of how neighboring countries' events connect and affect ${countryCtx}. Reference specific events.",
  "sector": "2-3 paragraph sector deep dive for ${sectorsList}. Reference specific events and give numbers.",
  "consequences": [
    {"from":"Event A name","to":"Consequence B","label":"mechanism"},
    {"from":"Consequence B","to":"Consequence C","label":"mechanism"}
  ],
  "infrastructure": [
    {"name":"Specific infrastructure name","status":"NORMAL","detail":"Why this status, referencing events"}
  ],
  "signals": [
    "5-7 specific tripwires. NOT generic. e.g. IRGC patrol vessel count in Hormuz exceeds 8"
  ],
  "sources": [
    {"name":"Source name","time":"${new Date().toISOString()}","reliability":85}
  ]
}

Infrastructure: list 5-8 key infrastructure items for ${countryCtx} with current status.
Signals: 5-7 specific, measurable tripwires. Not generic.
Sources: list the top sources.

Return ONLY valid JSON.${langSuffix}`;

    // ── FIRE ALL IN PARALLEL ──
    const [situationResult, meansResult, forecastResult, actionsResult, detailResult] = await Promise.allSettled([
      callClaude(situationPrompt, evts, isAr ? "ar" : "en", profileCtx),
      meansPrompt
        ? callClaude(meansPrompt, evts, isAr ? "ar" : "en", profileCtx)
        : Promise.resolve(null),
      callClaude(forecastPrompt, evts, isAr ? "ar" : "en", profileCtx),
      callClaude(actionsPrompt, evts, isAr ? "ar" : "en", profileCtx),
      callClaude(detailPrompt, evts, isAr ? "ar" : "en", profileCtx),
    ]);

    if (gen !== generationRef.current) return;

    // Parse situation
    if (situationResult.status === "fulfilled" && situationResult.value) {
      setSituation(situationResult.value.replace(/^["']|["']$/g, "").trim());
    }
    setLoadingSituation(false);

    // Parse means
    if (meansResult.status === "fulfilled" && meansResult.value) {
      const arr = parseJSONArray(meansResult.value);
      if (arr) setMeans(arr);
    } else if (!isSpecificCountry) {
      setMeans(null);
    }
    setLoadingMeans(false);

    // Parse forecast
    if (forecastResult.status === "fulfilled" && forecastResult.value) {
      const parsed = parseJSON(forecastResult.value);
      if (parsed?.h24) setForecast(parsed);
    }
    setLoadingForecast(false);

    // Parse actions
    if (actionsResult.status === "fulfilled" && actionsResult.value) {
      const arr = parseJSONArray(actionsResult.value);
      if (arr) setActions(arr as ActionItem[]);
    }
    setLoadingActions(false);

    // Parse detail
    if (detailResult.status === "fulfilled" && detailResult.value) {
      const parsed = parseJSON(detailResult.value);
      if (parsed?.regional) setDetail(parsed);
    }
    setLoadingDetail(false);

    const now = new Date().toISOString();
    setLastGenerated(now);
    setBtnLabel("done");
    setTimeout(() => setBtnLabel("idle"), 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEvents, events, selectedCountry, selectedSectors, isAr, profileCtx, lang]);

  // Save to cache after generation
  useEffect(() => {
    if (situation && forecast && actions && detail && lastGenerated && !isCached) {
      const key = cacheKey(selectedCountry, Array.from(selectedSectors), lang);
      briefCache.set(key, {
        situation,
        means: means || null,
        forecast,
        actions,
        detail,
        generatedAt: lastGenerated,
      });
    }
  }, [situation, means, forecast, actions, detail, lastGenerated, isCached, selectedCountry, selectedSectors, lang]);

  /* ─── Auto-generate on mount and filter change ──────── */

  useEffect(() => {
    if (events.length > 0) generateBrief();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, selectedSectors, events.length]);

  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang && events.length > 0) {
      prevLangRef.current = lang;
      const key = cacheKey(selectedCountry, Array.from(selectedSectors), lang);
      briefCache.delete(key);
      generateBrief();
    }
  }, [lang, events.length, generateBrief, selectedCountry, selectedSectors]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleEventExpand = (id: number) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ─── MAP handler ───────────────────────────────────── */

  const handleViewOnMap = useCallback((ev: ApiEvent) => {
    setSelectedEvent(ev);
    setActiveSection("situation");
  }, [setSelectedEvent, setActiveSection]);

  /* ─── PDF Export ─────────────────────────────────────── */

  const handleGenerateReport = useCallback(() => {
    if (!situation) return;
    const textStyle = isAr ? `font-family:'Noto Sans Arabic','IBM Plex Sans',sans-serif;direction:rtl;text-align:right;line-height:2;` : "";

    const actionsHtml = (actions || []).map((a, i) =>
      `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #1e2530;">
        <span style="font-family:'IBM Plex Mono',monospace;color:#3b82f6;font-weight:600;min-width:28px;">${a.number || String(i + 1).padStart(2, "0")}</span>
        <div>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:${TIMING_COLORS[a.timing] || "#3b82f6"};letter-spacing:1px;">${a.timing}</span>
          <div style="color:#e5e7eb;font-size:12px;line-height:1.6;margin-top:2px;${textStyle}">${a.action}</div>
          <div style="color:#6b7280;font-size:10px;margin-top:2px;${textStyle}">${a.reason}</div>
        </div>
      </div>`).join("");

    const forecastHtml = forecast
      ? (["h24", "h48", "h72", "wildcard"] as const).map((k) => {
          const item = forecast[k];
          if (!item) return "";
          const label = k === "h24" ? "24H" : k === "h48" ? "48H" : k === "h72" ? "72H" : "WILDCARD";
          return `<div style="margin-bottom:12px;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#3b82f6;letter-spacing:2px;margin-bottom:4px;">${label} · ${item.probability}%</div>
            <div style="font-size:12px;color:#e5e7eb;line-height:1.6;${textStyle}">${item.text}</div>
          </div>`;
        }).join("")
      : "";

    const meansHtml = (means || []).map((m) =>
      `<div style="padding:4px 0;color:#e5e7eb;font-size:12px;line-height:1.6;${textStyle}">• ${m}</div>`).join("");

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head>
<title>Atlas Command — Intelligence Brief</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  @page { size:A4; margin:20mm 25mm; }
  body { background:#080d1a; color:#e5e7eb; font-family:'IBM Plex Sans',sans-serif; font-size:12px; line-height:1.6; padding:40px; }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:white;letter-spacing:3px;font-weight:600;">${isAr ? "أطلس كوماند" : "ATLAS COMMAND"}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#6b7280;text-align:${isAr ? "left" : "right"};">
      ${isAr ? "النشرة الاستخباراتية" : "INTELLIGENCE BRIEF"} · ${countryLabel}<br>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
    </div>
  </div>
  <div style="height:1px;background:#3b82f6;margin-bottom:20px;"></div>
  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "الموقف الآن" : "THE SITUATION NOW"}</div>
    <div style="font-size:16px;color:white;line-height:1.9;${textStyle}">${situation}</div>
  </div>
  ${meansHtml ? `<div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "ماذا يعني هذا" : "WHAT THIS MEANS FOR"} ${countryLabel.toUpperCase()}</div>
    ${meansHtml}
  </div>` : ""}
  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "ما نتوقعه" : "WHAT WE ANTICIPATE"}</div>
    ${forecastHtml}
  </div>
  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "إجراءات القيادة" : "COMMAND ACTIONS"}</div>
    ${actionsHtml}
  </div>
  <div style="height:1px;background:#3b82f6;margin-top:30px;margin-bottom:12px;"></div>
  <div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;">
    <span>${filteredEvents.length} ${isAr ? "حدث" : "events"} · ${totalSources} ${isAr ? "مصدر" : "sources"}</span>
    <span>${isAr ? "أطلس كوماند" : "ATLAS COMMAND"}</span>
    <span>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
  </div>
</body>
</html>`);
    w.document.close();
    setTimeout(() => w.print(), 1000);
  }, [situation, means, forecast, actions, isAr, countryLabel, filteredEvents.length, totalSources]);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  const isLoading = loadingSituation || loadingForecast || loadingActions;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Shimmer + pulse keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes shimmer{0%{opacity:.4}50%{opacity:.8}100%{opacity:.4}}@keyframes pulse-glow{0%,100%{opacity:.6}50%{opacity:1}}` }} />

      <div className="flex-1 overflow-y-auto">

        {/* ═══ SECTION 1 — TOP BAR ═══ */}
        <div className="border-b border-white/[0.06]" style={{ background: "#080d1a" }}>
          <div className="flex items-center justify-between px-6 py-2.5">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] tracking-[3px] text-white font-semibold">
                {isAr ? "النشرة الاستخباراتية" : "INTELLIGENCE BRIEF"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="font-mono text-[9px] tracking-wider text-green-500">LIVE</span>
              </div>
              <span className="font-mono text-[9px] text-slate-600">
                {totalSources} {isAr ? "مصدر" : "sources"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {lastGenerated && (
                <span className="font-mono text-[9px] text-slate-600">
                  {isAr ? "آخر تحديث" : "LAST UPDATED"}: {new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
                </span>
              )}
              {isCached && (
                <button
                  onClick={() => { briefCache.delete(cacheKey(selectedCountry, Array.from(selectedSectors), lang)); generateBrief(); }}
                  className="font-mono text-[9px] tracking-wider text-blue-400 border border-blue-500/30 px-2 py-0.5 hover:bg-blue-500/10 transition-colors"
                >
                  {isAr ? "تحديث ↻" : "Cached · Refresh"}
                </button>
              )}
              <button
                onClick={() => { briefCache.delete(cacheKey(selectedCountry, Array.from(selectedSectors), lang)); generateBrief(); }}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider border disabled:opacity-50 transition-colors"
                style={{
                  color: btnLabel === "done" ? "#22c55e" : btnLabel === "loading" ? "#60a5fa" : "#22c55e",
                  borderColor: btnLabel === "done" ? "rgba(34,197,94,0.3)" : btnLabel === "loading" ? "rgba(96,165,250,0.3)" : "rgba(34,197,94,0.3)",
                  animation: btnLabel === "loading" ? "pulse-glow 1.5s infinite" : undefined,
                }}
              >
                {btnLabel === "loading" ? "◌" : btnLabel === "done" ? "✓" : "↻"}
                {" "}
                {btnLabel === "loading"
                  ? (isAr ? "جارٍ التحليل..." : "Generating...")
                  : btnLabel === "done"
                  ? (isAr ? "تم التحديث" : "Updated just now")
                  : (isAr ? "إنشاء" : "Generate")}
              </button>
            </div>
          </div>

          {/* ═══ SECTION 2 — SELECTORS ═══ */}
          <div className="flex items-center gap-4 px-6 py-2.5 border-t border-white/[0.04]" style={{ background: "#0a1020" }}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-wider text-slate-600 uppercase">{isAr ? "الدولة" : "COUNTRY"}</span>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="font-mono text-[10px] tracking-wide text-slate-300 bg-[#0c1426] border border-white/[0.08] px-2 py-1 outline-none focus:border-blue-500/40 hover:border-white/[0.15] transition-colors appearance-none cursor-pointer"
                style={{ minWidth: 120 }}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.labelEn}</option>
                ))}
              </select>
            </div>
            <span className="text-white/[0.08]">|</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[9px] tracking-wider text-slate-600 uppercase">{isAr ? "القطاع" : "SECTOR"}</span>
              {SECTOR_OPTIONS.map((s) => {
                const active = selectedSectors.has(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className={`font-mono text-[9px] tracking-wider px-2.5 py-1 border transition-colors ${
                      active ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "text-slate-500 border-white/[0.08] hover:border-white/[0.15] hover:text-slate-400"
                    }`}
                  >
                    {s === "ALL" ? (isAr ? "الكل" : "ALL") : (isAr ? (SECTOR_AR[s] || s) : s)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3 — TWO COLUMN ROW ═══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "55fr 45fr",
            alignItems: "start",
            background: "#080d1a",
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {/* LEFT COLUMN: Situation + Metrics */}
          <div style={{ paddingRight: 24, paddingTop: 32, paddingBottom: 32, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <SectionHeader>
              {isAr ? "الموقف الآن" : "THE SITUATION NOW"}
            </SectionHeader>
            {loadingSituation ? (
              <Skeleton lines={4} />
            ) : situation ? (
              <div
                className={arText}
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.85)",
                  fontFamily: isAr ? "'Noto Sans Arabic', 'IBM Plex Sans', sans-serif" : "'IBM Plex Sans', sans-serif",
                }}
              >
                {situation}
              </div>
            ) : (
              <Skeleton lines={4} />
            )}

            {/* Three metric tiles */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {/* THREAT POSTURE */}
              <div className="border border-white/[0.06] bg-white/[0.02]" style={{ padding: 12 }}>
                <div className="font-mono tracking-wider text-slate-600 mb-1" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{isAr ? "مستوى التهديد" : "THREAT POSTURE"}</div>
                <div className="font-mono font-bold" style={{ fontSize: 20, color: postureColor }}>
                  {isAr ? translateRiskLevel(posture, "ar") : posture}
                </div>
              </div>
              {/* ACTIVE EVENTS */}
              <div className="border border-white/[0.06] bg-white/[0.02]" style={{ padding: 12 }}>
                <div className="font-mono tracking-wider text-slate-600 mb-1" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{isAr ? "أحداث نشطة" : "ACTIVE EVENTS"}</div>
                <div className="font-mono font-bold text-white" style={{ fontSize: 20 }}>
                  {filteredEvents.length}
                  {criticalCount > 0 && (
                    <span className="font-normal text-red-400 ml-2" style={{ fontSize: 11 }}>{criticalCount} {isAr ? "حرج" : "CRIT"}</span>
                  )}
                </div>
              </div>
              {/* TOP SECTOR */}
              <div className="border border-white/[0.06] bg-white/[0.02]" style={{ padding: 12 }}>
                <div className="font-mono tracking-wider text-slate-600 mb-1" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{isAr ? "أبرز قطاع" : "TOP SECTOR"}</div>
                <div className="font-mono font-bold text-blue-400" style={{ fontSize: 20 }}>
                  {isAr ? (SECTOR_AR[topSectorName] || topSectorName) : topSectorName}
                  <span className="font-normal text-slate-500 ml-2" style={{ fontSize: 11 }}>{topSectorPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Top Events */}
          <div style={{ paddingLeft: 24, paddingTop: 32, paddingBottom: 32 }}>
            <SectionHeader>
              <div className="flex items-center justify-between">
                <span>{isAr ? "أبرز الأحداث الآن" : "TOP EVENTS RIGHT NOW"}</span>
                <span className="font-mono text-slate-600" style={{ fontSize: 9, letterSpacing: "0.05em" }}>
                  {filteredEvents.length} {isAr ? "حدث" : "events"}
                </span>
              </div>
            </SectionHeader>

            <div style={{ maxHeight: 420, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "rgba(96,165,250,0.3) transparent" }} className="space-y-2">
              {topEvents.length === 0 ? (
                <div className="py-8 text-center font-mono text-[11px] text-slate-600">
                  {isAr ? "لا توجد أحداث مطابقة" : "No matching events"}
                </div>
              ) : (
                topEvents.map((ev) => {
                  const color = RISK_COLORS[ev.risk_level] || "#64748b";
                  const rawTitle = getLocalizedField(ev, "title", lang) || ev.title;
                  const title = stripHTML(rawTitle);
                  const rawSit = isAr && ev.situation_ar ? ev.situation_ar : ev.situation_en;
                  const cleanSit = stripHTML(typeof rawSit === "string" ? rawSit : (ev.description || ""));
                  const desc = cleanSit.length < 20 ? title : cleanSit.slice(0, 100);
                  const ago = timeAgo(ev.event_time, isAr);
                  const isExpanded = expandedEvents.has(ev.id);

                  return (
                    <div
                      key={ev.id}
                      className="border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.03] transition-colors"
                      style={{ borderLeftWidth: 3, borderLeftColor: color, padding: 14 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5 uppercase" style={{ color, backgroundColor: color + "15" }}>
                          {isAr ? translateRiskLevel(ev.risk_level, "ar") : ev.risk_level}
                        </span>
                      </div>
                      <div className={`text-[12px] font-medium text-slate-200 mb-1 ${arText}`}>{title}</div>
                      <div className={`text-[10px] leading-relaxed text-slate-500 mb-2 ${arText}`}>
                        {isExpanded ? cleanSit : desc}{!isExpanded && desc.length >= 100 ? "..." : ""}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono text-[9px] text-slate-600">
                          <span>{isAr ? "خطر" : "Risk"}: <span className="font-bold" style={{ color }}>{ev.risk_score}</span></span>
                          <span>·</span>
                          <span>{ago}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewOnMap(ev)}
                            className="font-mono text-[8px] tracking-wider text-blue-400 border border-blue-500/30 px-2 py-0.5 hover:bg-blue-500/10 transition-colors uppercase"
                          >
                            {isAr ? "خريطة" : "MAP"}
                          </button>
                          <button
                            onClick={() => toggleEventExpand(ev.id)}
                            className="font-mono text-[8px] tracking-wider text-slate-400 border border-white/[0.08] px-2 py-0.5 hover:bg-white/[0.05] transition-colors uppercase"
                          >
                            {isExpanded ? (isAr ? "أقل" : "LESS") : (isAr ? "تفاصيل" : "BRIEF")}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-2">
                          {ev.why_matters_en && (
                            <div>
                              <div className="font-mono text-[8px] tracking-wider text-blue-400 mb-1">{isAr ? "لماذا يهم" : "WHY IT MATTERS"}</div>
                              <div className={`text-[10px] text-slate-400 ${arText}`}>{isAr ? (ev.why_matters_ar || ev.why_matters_en) : ev.why_matters_en}</div>
                            </div>
                          )}
                          {ev.forecast_en && (
                            <div>
                              <div className="font-mono text-[8px] tracking-wider text-blue-400 mb-1">{isAr ? "التوقعات" : "FORECAST"}</div>
                              <div className={`text-[10px] text-slate-400 ${arText}`}>{isAr ? (ev.forecast_ar || ev.forecast_en) : ev.forecast_en}</div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 font-mono text-[8px] text-slate-600 pt-1">
                            <span>{translateTag(ev.sector, lang)}</span>
                            <span>·</span>
                            <span>{ev.region}</span>
                            <span>·</span>
                            <span>{ev.source_count} {isAr ? "مصدر" : "sources"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ═══ SECTION 4 — WHAT THIS MEANS (specific country only) ═══ */}
        {isSpecificCountry && (
          <div style={{ background: "#0c1426", maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
            <SectionHeader>
              {isAr ? `ماذا يعني هذا لـ${countryLabel}` : `WHAT THIS MEANS FOR ${countryLabel.toUpperCase()}`}
            </SectionHeader>
            {loadingMeans ? (
              <Skeleton lines={5} />
            ) : means && means.length > 0 ? (
              <div className="space-y-3">
                {means.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="font-mono text-[11px] font-bold text-blue-500 mt-0.5 shrink-0">•</span>
                    <span
                      className={`text-[13px] leading-relaxed text-slate-300 ${arText}`}
                      style={{ fontFamily: isAr ? "'Noto Sans Arabic', 'IBM Plex Sans', sans-serif" : "'IBM Plex Sans', sans-serif" }}
                    >
                      {m}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-mono text-[11px] text-slate-600">
                {isAr ? "لا توجد بيانات كافية." : "Insufficient data for country-specific analysis."}
              </div>
            )}
          </div>
        )}

        {isSpecificCountry && <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />}

        {/* ═══ SECTION 5 — WHAT WE ANTICIPATE ═══ */}
        <div style={{ background: "#080d1a", maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <SectionHeader>
            {isAr ? "ما نتوقعه" : "WHAT WE ANTICIPATE"}
          </SectionHeader>
          {loadingForecast ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => <SkeletonBox key={i} height={140} />)}
            </div>
          ) : forecast ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {([
                { key: "h24" as const, label: isAr ? "خلال ٢٤ ساعة" : "NEXT 24H" },
                { key: "h48" as const, label: isAr ? "خلال ٤٨ ساعة" : "NEXT 48H" },
                { key: "h72" as const, label: isAr ? "خلال ٧٢ ساعة" : "NEXT 72H" },
                { key: "wildcard" as const, label: isAr ? "سيناريو مفاجئ" : "WILDCARD" },
              ]).map(({ key, label }) => {
                const item = forecast[key];
                if (!item) return null;
                const barColor = key === "wildcard" ? "#ef4444" : item.probability >= 70 ? "#ef4444" : item.probability >= 50 ? "#f97316" : "#eab308";
                return (
                  <div
                    key={key}
                    style={{
                      padding: 16,
                      background: key === "wildcard" ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.04)",
                      border: key === "wildcard" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-mono text-[9px] tracking-wider font-semibold ${key === "wildcard" ? "text-red-400" : "text-blue-400"}`}>{label}</span>
                      <span className="font-mono text-[11px] font-bold" style={{ color: barColor }}>{item.probability}%</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 8 }} />
                    <div className={`text-[11px] leading-relaxed text-slate-400 mb-3 ${arText}`}>{item.text}</div>
                    <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.probability}%`, backgroundColor: barColor }} />
                    </div>
                    <div className="font-mono text-right mt-1" style={{ fontSize: 9, color: barColor }}>{item.probability}%</div>
                  </div>
                );
              })}
            </div>
          ) : <Skeleton lines={3} />}
        </div>

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ═══ SECTION 6 — COMMAND ACTIONS ═══ */}
        <div style={{ background: "#0c1426", maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          <SectionHeader>
            {isAr ? "إجراءات القيادة" : "COMMAND ACTIONS"}
          </SectionHeader>
          <div className="font-mono text-slate-600" style={{ fontSize: 9, marginBottom: 16, marginTop: -8 }}>
            {isAr
              ? `بناءً على الاستخبارات الحالية — ${countryLabel} · ${sectorsLabel}`
              : `Based on current intelligence — ${countryLabel} · ${sectorsLabel}`}
          </div>
          {loadingActions ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-4 w-6 rounded" style={{ backgroundColor: "rgba(255,255,255,0.08)", animation: "shimmer 1.5s infinite" }} />
                  <Skeleton lines={2} className="flex-1" />
                </div>
              ))}
            </div>
          ) : actions && actions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {actions.map((a, i) => {
                const timingColor = TIMING_TEXT[a.timing] || "#60a5fa";
                const timingBg = TIMING_BG[a.timing] || "rgba(37,99,235,0.2)";
                const timingBorder = TIMING_BORDER[a.timing] || "rgba(37,99,235,0.3)";
                return (
                  <div key={i} className="flex items-start gap-4" style={{ border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", padding: 14, borderRadius: 4 }}>
                    <div className="shrink-0 font-mono font-bold text-blue-500" style={{ fontSize: 14, minWidth: 28 }}>
                      {a.number || String(i + 1).padStart(2, "0")}
                    </div>
                    <div
                      className="shrink-0 font-mono font-semibold"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        color: timingColor,
                        background: timingBg,
                        border: `1px solid ${timingBorder}`,
                        padding: "2px 8px",
                        borderRadius: 3,
                        marginTop: 2,
                      }}
                    >
                      {a.timing}
                    </div>
                    <div className="flex-1">
                      <div className={`text-[12px] leading-relaxed text-slate-200 ${arText}`}>{a.action}</div>
                      <div className={`text-slate-500 mt-1 ${arText}`} style={{ fontSize: 11 }}>
                        {isAr ? "المحرك" : "Driver"}: {a.reason}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Skeleton lines={4} />
          )}
        </div>

        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />

        {/* ═══ SECTION 7 — FULL INTELLIGENCE DETAIL ═══ */}
        <div style={{ background: "#080d1a" }}>
          <CollapsibleSection title={isAr ? "الاستخبارات الإقليمية" : "REGIONAL INTELLIGENCE"} sectionKey="regional" expanded={expandedSections.has("regional")} onToggle={toggleSection}>
            {loadingDetail ? <Skeleton lines={5} /> : detail?.regional ? (
              <div className={`text-[12px] leading-relaxed text-slate-400 whitespace-pre-line ${arText}`}>{detail.regional}</div>
            ) : <div className="font-mono text-[11px] text-slate-600">{isAr ? "لا توجد بيانات" : "No data available"}</div>}
          </CollapsibleSection>

          <CollapsibleSection title={isAr ? "تحليل القطاعات" : "SECTOR DEEP DIVE"} sectionKey="sector" expanded={expandedSections.has("sector")} onToggle={toggleSection}>
            {loadingDetail ? <Skeleton lines={5} /> : detail?.sector ? (
              <div className={`text-[12px] leading-relaxed text-slate-400 whitespace-pre-line ${arText}`}>{detail.sector}</div>
            ) : <div className="font-mono text-[11px] text-slate-600">{isAr ? "لا توجد بيانات" : "No data available"}</div>}
          </CollapsibleSection>

          <CollapsibleSection title={isAr ? "سلاسل العواقب" : "CONSEQUENCE CHAINS"} sectionKey="consequences" expanded={expandedSections.has("consequences")} onToggle={toggleSection}>
            {loadingDetail ? <Skeleton lines={4} /> : detail?.consequences && detail.consequences.length > 0 ? (
              <div className="space-y-1">
                {detail.consequences.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <div className="border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-300 max-w-[220px]">{c.from}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="h-px w-4 bg-blue-500/50" />
                      <span className="font-mono text-[8px] text-blue-400 whitespace-nowrap">{c.label}</span>
                      <div className="h-px w-4 bg-blue-500/50" />
                      <span className="text-blue-400 text-[10px]">→</span>
                    </div>
                    <div className="border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-300 max-w-[220px]">{c.to}</div>
                  </div>
                ))}
              </div>
            ) : <div className="font-mono text-[11px] text-slate-600">{isAr ? "لا توجد بيانات" : "No data available"}</div>}
          </CollapsibleSection>

          <CollapsibleSection title={isAr ? "مراقبة البنية التحتية" : "INFRASTRUCTURE WATCH"} sectionKey="infra" expanded={expandedSections.has("infra")} onToggle={toggleSection}>
            {loadingDetail ? <Skeleton lines={5} /> : detail?.infrastructure && detail.infrastructure.length > 0 ? (
              <div className="space-y-2">
                {detail.infrastructure.map((inf, i) => {
                  const sc = INFRA_STATUS_COLORS[inf.status] || "#22c55e";
                  return (
                    <div key={i} className="flex items-center justify-between border border-white/[0.04] bg-white/[0.015] p-3">
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-slate-200">{inf.name}</div>
                        <div className={`text-[11px] text-slate-500 mt-0.5 ${arText}`}>{inf.detail}</div>
                      </div>
                      <span className="font-mono text-[8px] font-bold tracking-wider px-2 py-0.5 shrink-0 ml-3" style={{ color: sc, backgroundColor: sc + "15", border: `1px solid ${sc}30` }}>
                        {inf.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : <div className="font-mono text-[11px] text-slate-600">{isAr ? "لا توجد بيانات" : "No data available"}</div>}
          </CollapsibleSection>

          <CollapsibleSection title={isAr ? "إشارات للمراقبة" : "SIGNALS TO WATCH"} sectionKey="signals" expanded={expandedSections.has("signals")} onToggle={toggleSection}>
            {loadingDetail ? <Skeleton lines={5} /> : detail?.signals && detail.signals.length > 0 ? (
              <div className="space-y-2">
                {detail.signals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 py-1">
                    <span className="font-mono text-[11px] font-bold text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>
                    <span className={`text-[12px] leading-relaxed text-slate-400 ${arText}`}>{signal}</span>
                  </div>
                ))}
              </div>
            ) : <div className="font-mono text-[11px] text-slate-600">{isAr ? "لا توجد بيانات" : "No data available"}</div>}
          </CollapsibleSection>

          <CollapsibleSection title={isAr ? "استخبارات المصادر" : "SOURCE INTELLIGENCE"} sectionKey="sources" expanded={expandedSections.has("sources")} onToggle={toggleSection}>
            {loadingDetail ? <Skeleton lines={4} /> : detail?.sources && detail.sources.length > 0 ? (
              <div className="space-y-2">
                {detail.sources.map((src, i) => (
                  <div key={i} className="flex items-center justify-between border border-white/[0.04] bg-white/[0.015] p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-slate-300">{src.name}</span>
                      <span className="font-mono text-[9px] text-slate-600">{src.time ? timeAgo(src.time, isAr) : "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${src.reliability}%`, backgroundColor: src.reliability >= 80 ? "#22c55e" : src.reliability >= 60 ? "#eab308" : "#ef4444" }} />
                      </div>
                      <span className="font-mono text-[9px] text-slate-500">{src.reliability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 font-mono text-[11px]">
                <div>
                  <div className="text-slate-600 text-[9px] tracking-wider mb-1">{isAr ? "إجمالي المصادر" : "TOTAL SOURCES"}</div>
                  <div className="text-slate-300">{totalSources}</div>
                </div>
                <div>
                  <div className="text-slate-600 text-[9px] tracking-wider mb-1">{isAr ? "الأحداث النشطة" : "ACTIVE EVENTS"}</div>
                  <div className="text-slate-300">{filteredEvents.length}</div>
                </div>
                <div>
                  <div className="text-slate-600 text-[9px] tracking-wider mb-1">{isAr ? "آخر تحديث" : "LAST UPDATE"}</div>
                  <div className="text-slate-300">{lastGenerated ? new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"} UTC</div>
                </div>
              </div>
            )}
          </CollapsibleSection>
        </div>

        {/* ═══ SECTION 8 — BOTTOM BAR + REPORT BUTTON ═══ */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]" style={{ background: "#0a1020" }}>
          <div className="font-mono text-[9px] text-slate-500 tracking-wider">
            {isAr
              ? `بناءً على ${filteredEvents.length} حدث نشط · ${totalSources} مصدر مراقب · ${lastGenerated ? `تحديث ${new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC` : ""}`
              : `Based on ${filteredEvents.length} active events · ${totalSources} sources monitored · ${lastGenerated ? `Updated ${new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC` : ""}`}
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={!situation}
            className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-wider font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isAr ? "إنشاء التقرير الكامل" : "GENERATE FULL REPORT"}
          </button>
        </div>
      </div>
    </div>
  );
}
