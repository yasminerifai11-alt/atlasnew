"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore, type RiskFilter } from "@/stores/command-store";
import { REGION_GROUPS, matchesFilter, getFilterLabel } from "@/data/regions";
import type { ApiEvent } from "@/lib/api";

const RISK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  CRITICAL: { text: "text-red-400", bg: "bg-red-500/15", border: "#ef4444" },
  HIGH: { text: "text-orange-400", bg: "bg-orange-500/15", border: "#f97316" },
  MEDIUM: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "#eab308" },
  LOW: { text: "text-green-400", bg: "bg-green-500/10", border: "#22c55e" },
};

const RISK_LEVELS: RiskFilter[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function Sidebar() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const eventsLoading = useCommandStore((s) => s.eventsLoading);
  const riskFilter = useCommandStore((s) => s.riskFilter);
  const setRiskFilter = useCommandStore((s) => s.setRiskFilter);
  const regionFilter = useCommandStore((s) => s.regionFilter);
  const setRegionFilter = useCommandStore((s) => s.setRegionFilter);
  const searchQuery = useCommandStore((s) => s.searchQuery);
  const setSearchQuery = useCommandStore((s) => s.setSearchQuery);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);

  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

  const filtered = events
    .filter((e) => riskFilter === "ALL" || e.risk_level === riskFilter)
    .filter((e) => matchesFilter(e, regionFilter))
    .filter(
      (e) =>
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.country.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.risk_score - a.risk_score);

  const handleEventClick = (event: ApiEvent) => {
    setSelectedEvent(event);
    setActiveSection("intel");
  };

  const handleRegionSelect = (key: string) => {
    setRegionFilter(key);
    setRegionDropdownOpen(false);
  };

  const isAr = lang === "ar";

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01]">
      {/* Search */}
      <div className="border-b border-white/[0.06] p-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("situation.searchPlaceholder")}
          className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-2 font-mono text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30"
        />
      </div>

      {/* Risk filter */}
      <div className="border-b border-white/[0.06] p-3">
        <div className="flex gap-1">
          {RISK_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`flex-1 py-1 font-mono text-[9px] tracking-wider transition-colors ${
                riskFilter === level
                  ? "bg-white/[0.06] text-slate-200"
                  : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {t(`risk.${level.toLowerCase()}` as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Region/Country filter */}
      <div className="border-b border-white/[0.06] p-3">
        <div className="relative">
          <button
            onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] font-mono text-[10px] tracking-wider text-slate-400 hover:border-white/[0.12] transition-colors"
          >
            <span className={regionFilter !== "GLOBAL" ? "text-atlas-accent" : ""}>
              {getFilterLabel(regionFilter, lang)}
            </span>
            <span className="text-slate-600 text-[8px]">{regionDropdownOpen ? "▲" : "▼"}</span>
          </button>

          {/* Dropdown */}
          {regionDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setRegionDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[50vh] overflow-y-auto border border-white/[0.08] bg-[#0f1219] shadow-2xl">
                {/* Global option */}
                <button
                  onClick={() => handleRegionSelect("GLOBAL")}
                  className={`w-full text-left px-3 py-2 font-mono text-[10px] tracking-wider transition-colors border-b border-white/[0.04] ${
                    regionFilter === "GLOBAL"
                      ? "bg-atlas-accent/10 text-atlas-accent"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  {isAr ? "عالمي — جميع المناطق" : "GLOBAL — All Regions"}
                </button>

                {/* Region groups with countries */}
                {REGION_GROUPS.map((group) => (
                  <div key={group.key}>
                    {/* Group header — clickable to select entire group */}
                    <button
                      onClick={() => handleRegionSelect(group.key)}
                      className={`w-full text-left px-3 py-2 font-mono text-[10px] tracking-wider transition-colors flex items-center justify-between ${
                        regionFilter === group.key
                          ? "bg-atlas-accent/10 text-atlas-accent"
                          : "text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="font-semibold">
                        {isAr ? group.labelAr : group.label}
                      </span>
                      <span className="text-[8px] text-slate-600">
                        {group.countries.length}
                      </span>
                    </button>

                    {/* Individual countries */}
                    {group.countries.map((country) => (
                      <button
                        key={country.key}
                        onClick={() => handleRegionSelect(country.key)}
                        className={`w-full text-left pl-6 pr-3 py-1.5 font-mono text-[9px] tracking-wider transition-colors ${
                          regionFilter === country.key
                            ? "bg-atlas-accent/10 text-atlas-accent"
                            : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
                        }`}
                      >
                        {isAr ? country.labelAr : country.label}
                      </button>
                    ))}

                    <div className="border-b border-white/[0.04]" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active filter tag */}
        {regionFilter !== "GLOBAL" && (
          <div className="mt-2 flex items-center gap-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-atlas-accent/10 border border-atlas-accent/20 font-mono text-[9px] text-atlas-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-atlas-accent/60" />
              {getFilterLabel(regionFilter, lang)}
              <button
                onClick={() => setRegionFilter("GLOBAL")}
                className="ml-0.5 text-atlas-accent/50 hover:text-atlas-accent text-[11px] leading-none"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-mono text-[9px] tracking-widest text-slate-500">
          {t("situation.priorityFeed")}
        </span>
        <span className="font-mono text-[9px] text-slate-600">
          {filtered.length}
        </span>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {eventsLoading ? (
          <div className="py-12 text-center font-mono text-[10px] text-slate-600">
            {t("situation.loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center font-mono text-[10px] text-slate-600">
            {t("situation.noEvents")}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((event) => {
              const colors = RISK_COLORS[event.risk_level] || RISK_COLORS.LOW;
              return (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full text-left border border-white/[0.04] bg-white/[0.015] p-3 transition-colors hover:bg-white/[0.04] group"
                  style={{ borderLeftWidth: 3, borderLeftColor: colors.border }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] tracking-wider text-slate-500">
                      {event.event_type} · {event.sector}
                    </span>
                    <span className={`font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5 ${colors.text} ${colors.bg}`}>
                      {event.risk_level}
                    </span>
                  </div>
                  <div className="text-[13px] font-medium text-slate-200 leading-snug mb-1">
                    {event.title}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-1.5">
                    {isAr && event.situation_ar ? event.situation_ar : event.situation_en}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[9px] text-slate-600">
                    <span>{event.region}</span>
                    <span>·</span>
                    <span>{t("event.riskScore")}: {event.risk_score}</span>
                    <span>·</span>
                    <span>{event.confidence_score}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
