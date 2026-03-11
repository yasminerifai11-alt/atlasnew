"use client";

import { useLanguage } from "@/lib/language";
import { useCommandStore, type RiskFilter } from "@/stores/command-store";
import type { ApiEvent } from "@/lib/api";

const RISK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  CRITICAL: { text: "text-red-400", bg: "bg-red-500/15", border: "#ef4444" },
  HIGH: { text: "text-orange-400", bg: "bg-orange-500/15", border: "#f97316" },
  MEDIUM: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "#eab308" },
  LOW: { text: "text-green-400", bg: "bg-green-500/10", border: "#22c55e" },
};

const RISK_LEVELS: RiskFilter[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

const REGION_GROUPS: { key: string; labelKey: string; countries: string[] }[] = [
  { key: "ALL", labelKey: "region.all", countries: [] },
  { key: "GCC", labelKey: "region.gcc", countries: ["Kuwait", "Saudi Arabia", "United Arab Emirates", "UAE", "Qatar", "Bahrain", "Oman"] },
  { key: "LEVANT", labelKey: "region.levant", countries: ["Iraq", "Syria", "Lebanon", "Israel", "Jordan", "Palestine"] },
  { key: "GULF_WATERS", labelKey: "region.gulfWaters", countries: ["Red Sea", "Persian Gulf", "Gulf of Aden", "Strait of Hormuz"] },
  { key: "IRAN", labelKey: "region.iran", countries: ["Iran"] },
  { key: "NORTH_AFRICA", labelKey: "region.northAfrica", countries: ["Egypt", "Libya", "Sudan", "Yemen"] },
];

function matchesRegion(event: ApiEvent, regionKey: string): boolean {
  if (regionKey === "ALL") return true;
  const group = REGION_GROUPS.find((g) => g.key === regionKey);
  if (!group) return true;
  return group.countries.some(
    (c) =>
      event.country.toLowerCase().includes(c.toLowerCase()) ||
      event.region.toLowerCase().includes(c.toLowerCase())
  );
}

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

  const filtered = events
    .filter((e) => riskFilter === "ALL" || e.risk_level === riskFilter)
    .filter((e) => matchesRegion(e, regionFilter))
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

      {/* Region filter */}
      <div className="border-b border-white/[0.06] p-3">
        <div className="flex flex-wrap gap-1">
          {REGION_GROUPS.map((rg) => (
            <button
              key={rg.key}
              onClick={() => setRegionFilter(rg.key)}
              className={`px-2 py-0.5 font-mono text-[8px] tracking-wider transition-colors border ${
                regionFilter === rg.key
                  ? "bg-atlas-accent/10 text-atlas-accent border-atlas-accent/30"
                  : "text-slate-600 border-white/[0.06] hover:text-slate-400 hover:border-white/[0.12]"
              }`}
            >
              {t(rg.labelKey as any)}
            </button>
          ))}
        </div>
        {regionFilter !== "ALL" && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-atlas-accent/10 border border-atlas-accent/20 font-mono text-[9px] text-atlas-accent">
              {t(REGION_GROUPS.find((g) => g.key === regionFilter)?.labelKey as any)}
              <button
                onClick={() => setRegionFilter("ALL")}
                className="ml-1 text-atlas-accent/60 hover:text-atlas-accent"
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
                    {lang === "ar" && event.situation_ar
                      ? event.situation_ar
                      : event.situation_en}
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
