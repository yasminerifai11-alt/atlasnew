"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";

type SourceTier = "active" | "premium";

interface IntelSource {
  name: string;
  type: string;
  category: string;
  frequency: string;
  reliability: number;
  description: string;
  tier: SourceTier;
  url?: string;
  lastSynced?: string; // only for active
  eventsToday?: number; // only for active
}

// TIER 1 — ACTIVE INGESTION (free, no key or key in .env)
const ACTIVE_SOURCES: IntelSource[] = [
  { name: "USGS Earthquakes", type: "API", category: "conflict", frequency: "5 min", reliability: 99, description: "Real-time earthquake monitoring — magnitude, depth, location for all global seismic events", tier: "active", url: "earthquake.usgs.gov/fdsnws", lastSynced: "3 min ago", eventsToday: 12 },
  { name: "GDELT Project", type: "API", category: "conflict", frequency: "15 min", reliability: 85, description: "Global Database of Events, Language, and Tone — monitors news media from every country in real-time", tier: "active", url: "api.gdeltproject.org", lastSynced: "8 min ago", eventsToday: 47 },
  { name: "GDACS Disasters", type: "RSS", category: "conflict", frequency: "Real-time", reliability: 97, description: "UN Global Disaster Alert and Coordination System — validated natural disaster early warning", tier: "active", url: "gdacs.org/xml/rss.xml", lastSynced: "12 min ago", eventsToday: 3 },
  { name: "NASA FIRMS", type: "API", category: "satellite", frequency: "6 hours", reliability: 92, description: "Fire Information for Resource Management — satellite thermal anomaly and fire detection via VIIRS/MODIS", tier: "active", url: "firms.modaps.eosdis.nasa.gov", lastSynced: "2h ago", eventsToday: 8 },
  { name: "NASA EONET", type: "API", category: "satellite", frequency: "Hourly", reliability: 95, description: "Earth Observatory Natural Event Tracker — satellite-verified natural events including wildfires, storms, volcanic activity", tier: "active", url: "eonet.gsfc.nasa.gov", lastSynced: "45 min ago", eventsToday: 5 },
  { name: "EIA Energy Data", type: "API", category: "energy", frequency: "Daily", reliability: 99, description: "US Energy Information Administration — oil production, storage, spot prices, petroleum data", tier: "active", url: "api.eia.gov/v2", lastSynced: "1h ago", eventsToday: 2 },
  { name: "EMSC Earthquakes", type: "RSS", category: "conflict", frequency: "Real-time", reliability: 98, description: "European-Mediterranean Seismological Centre — real-time seismic monitoring with felt reports", tier: "active", url: "emsc-csem.org", lastSynced: "5 min ago", eventsToday: 9 },
  { name: "WHO Disease Alerts", type: "RSS", category: "conflict", frequency: "Daily", reliability: 99, description: "World Health Organization Disease Outbreak News — official disease event notifications worldwide", tier: "active", url: "who.int/feeds", lastSynced: "3h ago", eventsToday: 1 },
  { name: "OCHA ReliefWeb", type: "API", category: "conflict", frequency: "Hourly", reliability: 95, description: "UN OCHA humanitarian reports — crisis updates, situation reports, disaster assessments", tier: "active", url: "api.reliefweb.int/v1", lastSynced: "20 min ago", eventsToday: 6 },
  { name: "UN Security Council", type: "RSS", category: "conflict", frequency: "Daily", reliability: 99, description: "UN Security Council press releases and meeting outcomes — resolutions, sanctions, peacekeeping updates", tier: "active", url: "un.org/press/en/feed", lastSynced: "4h ago", eventsToday: 0 },
  { name: "US State Dept Advisories", type: "RSS", category: "conflict", frequency: "As needed", reliability: 99, description: "Travel advisories and worldwide caution alerts — official US government country risk assessments", tier: "active", url: "travel.state.gov", lastSynced: "6h ago", eventsToday: 1 },
  { name: "CISA Cyber Alerts", type: "RSS", category: "cyber", frequency: "As needed", reliability: 99, description: "Cybersecurity & Infrastructure Security Agency — critical vulnerability and threat advisories", tier: "active", url: "us-cert.cisa.gov", lastSynced: "2h ago", eventsToday: 2 },
  { name: "NetBlocks", type: "RSS", category: "cyber", frequency: "As needed", reliability: 94, description: "Internet freedom observatory — verified internet shutdowns, disruptions, and state-level restrictions", tier: "active", url: "netblocks.org/feed", lastSynced: "1h ago", eventsToday: 0 },
  { name: "Reuters World", type: "RSS", category: "conflict", frequency: "Real-time", reliability: 98, description: "Tier 1 wire service — breaking news, geopolitical developments, financial market impact analysis", tier: "active", url: "feeds.reuters.com", lastSynced: "2 min ago", eventsToday: 23 },
  { name: "BBC World", type: "RSS", category: "conflict", frequency: "Real-time", reliability: 97, description: "BBC World Service — global news coverage with strong Middle East and Africa bureaux", tier: "active", url: "feeds.bbci.co.uk", lastSynced: "4 min ago", eventsToday: 18 },
  { name: "Al Jazeera English", type: "RSS", category: "conflict", frequency: "Real-time", reliability: 93, description: "Qatar-based — strongest MENA coverage, Gulf perspective, Arabic source network", tier: "active", url: "aljazeera.com/xml/rss", lastSynced: "6 min ago", eventsToday: 14 },
  { name: "Middle East Eye", type: "RSS", category: "conflict", frequency: "Hourly", reliability: 88, description: "Regional news — focused on Middle East, North Africa, and Turkey with investigative reporting", tier: "active", url: "middleeasteye.net/rss", lastSynced: "15 min ago", eventsToday: 7 },
  { name: "Anthropic Claude AI", type: "API", category: "intelligence", frequency: "Per event", reliability: 95, description: "AI enrichment engine — generates bilingual EN/AR intelligence analysis, consequence chains, and command recommendations for every ingested event", tier: "active", url: "api.anthropic.com", lastSynced: "1 min ago", eventsToday: 35 },
];

// TIER 2 — PREMIUM / COMING SOON
const PREMIUM_SOURCES: IntelSource[] = [
  { name: "ACLED", type: "API", category: "conflict", frequency: "Hourly", reliability: 92, description: "Armed Conflict Location & Event Data — tracks political violence and protests worldwide with sub-national precision", tier: "premium" },
  { name: "MarineTraffic AIS", type: "API", category: "maritime", frequency: "Real-time", reliability: 95, description: "Full AIS vessel tracking — maritime domain awareness, port activity, and shipping route analysis", tier: "premium" },
  { name: "FlightAware", type: "API", category: "aviation", frequency: "Real-time", reliability: 94, description: "Global flight tracking — military and civilian aviation monitoring, airspace closures", tier: "premium" },
  { name: "Sentinel Hub", type: "Satellite", category: "satellite", frequency: "5 days", reliability: 94, description: "ESA Copernicus satellite data — change detection, infrastructure monitoring, environmental analysis", tier: "premium" },
  { name: "Lloyd's List Intelligence", type: "API", category: "maritime", frequency: "Daily", reliability: 97, description: "Premium maritime intelligence — shipping risk, sanctions tracking, port security assessments", tier: "premium" },
  { name: "Bloomberg Terminal", type: "API", category: "financial", frequency: "Real-time", reliability: 99, description: "Institutional-grade financial data — commodity prices, sovereign CDS, FX, geopolitical risk pricing", tier: "premium" },
  { name: "ICIS Energy", type: "API", category: "energy", frequency: "Daily", reliability: 96, description: "Energy commodity intelligence — LNG, gas, power, carbon markets, supply/demand analysis", tier: "premium" },
  { name: "S&P Global Platts", type: "API", category: "energy", frequency: "Real-time", reliability: 98, description: "Benchmark energy pricing — Brent, Dubai crude, LNG spot, refining margins", tier: "premium" },
  { name: "OpenSky Network", type: "API", category: "aviation", frequency: "Real-time", reliability: 88, description: "ADS-B flight tracking — open airspace monitoring and anomaly detection", tier: "premium" },
  { name: "LiveUAMap", type: "Scrape", category: "conflict", frequency: "Real-time", reliability: 80, description: "Crowd-sourced conflict mapping — geolocated military activity, incidents, and territorial control", tier: "premium" },
  { name: "OPEC MOMR", type: "Report", category: "energy", frequency: "Monthly", reliability: 85, description: "Monthly Oil Market Report — production quotas, compliance, demand forecasts", tier: "premium" },
  { name: "IEA Oil Market Report", type: "Report", category: "energy", frequency: "Monthly", reliability: 93, description: "International Energy Agency — supply/demand balance, strategic reserves, transition analysis", tier: "premium" },
  { name: "Reuters Eikon", type: "API", category: "financial", frequency: "Real-time", reliability: 96, description: "Institutional financial and news data — energy trading, geopolitical risk pricing", tier: "premium" },
  { name: "ICE Brent Futures", type: "API", category: "financial", frequency: "Real-time", reliability: 99, description: "Intercontinental Exchange — Brent crude oil futures and options, forward curves", tier: "premium" },
  { name: "OpenSanctions", type: "API", category: "conflict", frequency: "Daily", reliability: 87, description: "Sanctions lists, PEPs, and entities of interest — compliance and entity tracking", tier: "premium" },
  { name: "FlightRadar24", type: "API", category: "aviation", frequency: "Real-time", reliability: 89, description: "ADS-B flight tracking — military and civilian aviation monitoring", tier: "premium" },
  { name: "Planet Labs", type: "API", category: "satellite", frequency: "Daily", reliability: 91, description: "High-resolution daily satellite imagery — infrastructure and activity monitoring", tier: "premium" },
  { name: "OTX AlienVault", type: "API", category: "cyber", frequency: "Hourly", reliability: 82, description: "Open Threat Exchange — cyber threat indicators, malware, and vulnerability feeds", tier: "premium" },
  { name: "UKMTO", type: "RSS", category: "maritime", frequency: "As needed", reliability: 97, description: "UK Maritime Trade Operations — shipping advisories and incident reports for Gulf/Red Sea", tier: "premium" },
  { name: "Jane's Defence", type: "API", category: "conflict", frequency: "Daily", reliability: 96, description: "Military intelligence — order of battle, equipment, defence procurement, threat assessments", tier: "premium" },
  { name: "Maxar Satellite", type: "API", category: "satellite", frequency: "Daily", reliability: 97, description: "High-resolution satellite imagery — military base monitoring, damage assessment, before/after analysis", tier: "premium" },
  { name: "Recorded Future", type: "API", category: "cyber", frequency: "Real-time", reliability: 91, description: "Threat intelligence — dark web monitoring, vulnerability exploitation, nation-state actor tracking", tier: "premium" },
  { name: "Palantir Gotham", type: "Platform", category: "intelligence", frequency: "Real-time", reliability: 93, description: "Intelligence fusion platform — entity resolution, network analysis, pattern detection", tier: "premium" },
];

const ALL_SOURCES = [...ACTIVE_SOURCES, ...PREMIUM_SOURCES];

const CATEGORIES = [
  { key: "all", labelKey: "library.all" },
  { key: "conflict", labelKey: "library.conflict" },
  { key: "energy", labelKey: "library.energy" },
  { key: "financial", labelKey: "library.financial" },
  { key: "maritime", labelKey: "library.maritime" },
  { key: "aviation", labelKey: "library.aviation" },
  { key: "cyber", labelKey: "library.cyber" },
  { key: "satellite", labelKey: "library.satellite" },
  { key: "intelligence", label: "AI / INTEL" },
];

type TierFilter = "all" | "active" | "premium";

export function IntelligenceLibrary() {
  const { t, lang } = useLanguage();
  const [category, setCategory] = useState("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [search, setSearch] = useState("");
  const isAr = lang === "ar";

  const sources = tierFilter === "active" ? ACTIVE_SOURCES
    : tierFilter === "premium" ? PREMIUM_SOURCES
    : ALL_SOURCES;

  const filtered = sources.filter(
    (s) =>
      (category === "all" || s.category === category) &&
      (!search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const reliabilityColor = (score: number) =>
    score >= 95 ? "#22c55e" : score >= 85 ? "#eab308" : score >= 75 ? "#f97316" : "#ef4444";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-sm font-semibold tracking-wider text-slate-200">
              {t("library.title")}
            </div>
            <div className="font-mono text-[9px] tracking-widest text-slate-600">
              {t("library.subtitle")} · {ALL_SOURCES.length} {isAr ? "مصدر مفهرس" : "sources cataloged"} · {ACTIVE_SOURCES.length} {isAr ? "نشط الآن" : "active now"}
            </div>
          </div>
          {/* Tier filter toggle */}
          <div className="flex items-center gap-0.5 font-mono text-[10px]">
            {([
              { key: "all" as TierFilter, label: isAr ? "جميع المصادر" : "ALL SOURCES", count: ALL_SOURCES.length },
              { key: "active" as TierFilter, label: isAr ? "نشط الآن" : "ACTIVE NOW", count: ACTIVE_SOURCES.length },
              { key: "premium" as TierFilter, label: isAr ? "متميز" : "PREMIUM", count: PREMIUM_SOURCES.length },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setTierFilter(f.key)}
                className={`px-3 py-1.5 tracking-wider transition-colors ${
                  tierFilter === f.key
                    ? f.key === "active"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : f.key === "premium"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-white/[0.06] text-slate-200 border border-white/[0.08]"
                    : "text-slate-500 border border-transparent hover:text-slate-400"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category sidebar */}
        <div className="w-48 shrink-0 border-r border-white/[0.06] p-3">
          <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
            {t("library.categories")}
          </div>
          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`w-full text-left px-3 py-1.5 font-mono text-[10px] tracking-wider transition-colors ${
                  category === cat.key
                    ? "bg-white/[0.06] text-slate-200"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                {cat.label || t(cat.labelKey as any)}
              </button>
            ))}
          </div>

          {/* Active sources summary */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
              {isAr ? "ملخص الاستيعاب" : "INGESTION SUMMARY"}
            </div>
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? "نشط" : "Active"}</span>
                <span className="text-green-400">{ACTIVE_SOURCES.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? "متميز" : "Premium"}</span>
                <span className="text-purple-400">{PREMIUM_SOURCES.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{isAr ? "اليوم" : "Events today"}</span>
                <span className="text-atlas-accent">
                  {ACTIVE_SOURCES.reduce((sum, s) => sum + (s.eventsToday || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Source list */}
        <div className="flex-1 overflow-y-auto">
          {/* Search */}
          <div className="border-b border-white/[0.06] p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("library.search")}
              className="w-full max-w-md bg-white/[0.03] border border-white/[0.06] px-3 py-2 font-mono text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30"
            />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 font-mono text-[8px] tracking-widest text-slate-600 border-b border-white/[0.04]">
            <div className="col-span-1">{isAr ? "الحالة" : "STATUS"}</div>
            <div className="col-span-3">{t("library.name")}</div>
            <div className="col-span-4">DESCRIPTION</div>
            <div className="col-span-2">{t("library.frequency")}</div>
            <div className="col-span-2">{t("library.reliability")}</div>
          </div>

          {/* Sources */}
          <div className="divide-y divide-white/[0.03]">
            {filtered.map((source) => (
              <div
                key={source.name}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors items-center"
              >
                {/* Status indicator */}
                <div className="col-span-1">
                  {source.tier === "active" ? (
                    <div className="flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                      </span>
                    </div>
                  ) : (
                    <span className="text-[12px] text-slate-600">🔒</span>
                  )}
                </div>

                {/* Name + sync info */}
                <div className="col-span-3">
                  <div className="text-[12px] font-medium text-slate-300">{source.name}</div>
                  {source.tier === "active" ? (
                    <div className="font-mono text-[8px] text-slate-600 mt-0.5">
                      {isAr ? "آخر مزامنة:" : "Last synced:"} {source.lastSynced} · {source.eventsToday || 0} {isAr ? "اليوم" : "today"}
                    </div>
                  ) : (
                    <div className="font-mono text-[8px] text-purple-400/60 mt-0.5">
                      {isAr ? "طبقة متقدمة" : "ENHANCED TIER"}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-4">
                  <div className="text-[11px] text-slate-500 leading-relaxed">{source.description}</div>
                </div>

                {/* Frequency */}
                <div className="col-span-2">
                  <span className="font-mono text-[10px] text-slate-400">{source.frequency}</span>
                </div>

                {/* Reliability */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/[0.06]">
                      <div
                        className="h-full"
                        style={{
                          width: `${source.reliability}%`,
                          backgroundColor: reliabilityColor(source.reliability),
                          opacity: source.tier === "premium" ? 0.4 : 1,
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-[10px]"
                      style={{
                        color: reliabilityColor(source.reliability),
                        opacity: source.tier === "premium" ? 0.5 : 1,
                      }}
                    >
                      {source.reliability}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Count footer */}
          <div className="px-4 py-3 border-t border-white/[0.04] font-mono text-[9px] text-slate-600">
            {isAr ? `عرض ${filtered.length} من ${sources.length} مصدر` : `Showing ${filtered.length} of ${sources.length} sources`}
          </div>
        </div>
      </div>
    </div>
  );
}
