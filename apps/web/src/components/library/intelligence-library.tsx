"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";

interface IntelSource {
  name: string;
  type: string;
  category: string;
  frequency: string;
  reliability: number;
  description: string;
}

const SOURCES: IntelSource[] = [
  { name: "ACLED", type: "API", category: "conflict", frequency: "Hourly", reliability: 92, description: "Armed Conflict Location & Event Data — tracks political violence and protests worldwide" },
  { name: "GDELT Project", type: "API", category: "conflict", frequency: "15 min", reliability: 78, description: "Global Database of Events, Language, and Tone — monitors news media from every country" },
  { name: "USGS Earthquake Hazards", type: "API", category: "conflict", frequency: "5 min", reliability: 98, description: "Real-time earthquake monitoring — magnitude, depth, location for all global seismic events" },
  { name: "NASA FIRMS", type: "API", category: "satellite", frequency: "6 hours", reliability: 95, description: "Fire Information for Resource Management — satellite thermal anomaly detection" },
  { name: "OpenSky Network", type: "API", category: "aviation", frequency: "Real-time", reliability: 88, description: "ADS-B flight tracking — global airspace monitoring and anomaly detection" },
  { name: "Marine Traffic AIS", type: "API", category: "maritime", frequency: "Real-time", reliability: 90, description: "Automatic Identification System — vessel tracking for maritime domain awareness" },
  { name: "EIA", type: "API", category: "energy", frequency: "Daily", reliability: 96, description: "US Energy Information Administration — oil production, storage, price data" },
  { name: "OPEC MOMR", type: "Report", category: "energy", frequency: "Monthly", reliability: 85, description: "Monthly Oil Market Report — production quotas, compliance, demand forecasts" },
  { name: "IEA Oil Market Report", type: "Report", category: "energy", frequency: "Monthly", reliability: 93, description: "International Energy Agency — supply/demand balance, strategic reserves" },
  { name: "GDACS", type: "API", category: "conflict", frequency: "Real-time", reliability: 91, description: "Global Disaster Alert and Coordination System — natural disaster early warning" },
  { name: "UKMTO", type: "RSS", category: "maritime", frequency: "As needed", reliability: 97, description: "UK Maritime Trade Operations — shipping advisories and incident reports for Gulf/Red Sea" },
  { name: "OTX AlienVault", type: "API", category: "cyber", frequency: "Hourly", reliability: 82, description: "Open Threat Exchange — cyber threat indicators, malware, and vulnerability feeds" },
  { name: "CISA Alerts", type: "RSS", category: "cyber", frequency: "As needed", reliability: 95, description: "Cybersecurity & Infrastructure Security Agency — critical vulnerability advisories" },
  { name: "Sentinel-2", type: "Satellite", category: "satellite", frequency: "5 days", reliability: 94, description: "ESA optical satellite — infrastructure monitoring, land use change detection" },
  { name: "Planet Labs", type: "API", category: "satellite", frequency: "Daily", reliability: 91, description: "High-resolution daily satellite imagery — infrastructure and activity monitoring" },
  { name: "Bloomberg Terminal", type: "API", category: "financial", frequency: "Real-time", reliability: 97, description: "Financial markets data — commodity prices, FX, sovereign risk indicators" },
  { name: "Reuters Eikon", type: "API", category: "financial", frequency: "Real-time", reliability: 96, description: "Financial and news data — energy trading, geopolitical risk pricing" },
  { name: "ICE Brent Futures", type: "API", category: "financial", frequency: "Real-time", reliability: 99, description: "Intercontinental Exchange — Brent crude oil futures and options" },
  { name: "OpenSanctions", type: "API", category: "conflict", frequency: "Daily", reliability: 87, description: "Sanctions lists, PEPs, and entities of interest — compliance and entity tracking" },
  { name: "FlightRadar24", type: "API", category: "aviation", frequency: "Real-time", reliability: 89, description: "ADS-B flight tracking — military and civilian aviation monitoring" },
];

const CATEGORIES = [
  { key: "all", labelKey: "library.all" },
  { key: "conflict", labelKey: "library.conflict" },
  { key: "energy", labelKey: "library.energy" },
  { key: "financial", labelKey: "library.financial" },
  { key: "maritime", labelKey: "library.maritime" },
  { key: "aviation", labelKey: "library.aviation" },
  { key: "cyber", labelKey: "library.cyber" },
  { key: "satellite", labelKey: "library.satellite" },
];

export function IntelligenceLibrary() {
  const { t } = useLanguage();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = SOURCES.filter(
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
        <div className="font-mono text-sm font-semibold tracking-wider text-slate-200">
          {t("library.title")}
        </div>
        <div className="font-mono text-[9px] tracking-widest text-slate-600">
          {t("library.subtitle")} · {SOURCES.length} sources cataloged
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
                {t(cat.labelKey as any)}
              </button>
            ))}
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
            <div className="col-span-3">{t("library.name")}</div>
            <div className="col-span-1">{t("library.type")}</div>
            <div className="col-span-4">DESCRIPTION</div>
            <div className="col-span-2">{t("library.frequency")}</div>
            <div className="col-span-2">{t("library.reliability")}</div>
          </div>

          {/* Sources */}
          <div className="divide-y divide-white/[0.03]">
            {filtered.map((source) => (
              <div
                key={source.name}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-3">
                  <div className="text-[12px] font-medium text-slate-300">{source.name}</div>
                </div>
                <div className="col-span-1">
                  <span className="font-mono text-[9px] text-slate-500">{source.type}</span>
                </div>
                <div className="col-span-4">
                  <div className="text-[11px] text-slate-500 leading-relaxed">{source.description}</div>
                </div>
                <div className="col-span-2">
                  <span className="font-mono text-[10px] text-slate-400">{source.frequency}</span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/[0.06]">
                      <div
                        className="h-full"
                        style={{
                          width: `${source.reliability}%`,
                          backgroundColor: reliabilityColor(source.reliability),
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: reliabilityColor(source.reliability) }}>
                      {source.reliability}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
