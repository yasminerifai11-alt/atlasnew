"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import {
  DEFENSE_PROFILES,
  CAPABILITY_KEYS,
  getRankTier,
  getReadinessColor,
  getReadinessLabel,
  hasUSPresence,
  type DefenseProfile,
} from "@/data/defense-profiles";

const SORTED_PROFILES = Object.values(DEFENSE_PROFILES).sort(
  (a, b) => a.gfp_rank - b.gfp_rank
);

const TREND_COLOR: Record<string, string> = {
  UP: "#22c55e",
  STABLE: "#64748b",
  DOWN: "#ef4444",
};

const TREND_ICON: Record<string, string> = { UP: "▲", STABLE: "―", DOWN: "▼" };

export function DefenseSidebar() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const setSelectedCountry = useCommandStore((s) => s.setSelectedCountry);
  const [search, setSearch] = useState("");

  const filtered = SORTED_PROFILES.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.country.toLowerCase().includes(q) ||
      p.iso3.toLowerCase().includes(q) ||
      p.threat_posture.toLowerCase().includes(q)
    );
  });

  const totalBudget = SORTED_PROFILES.reduce(
    (s, p) => s + p.defense_budget_usd,
    0
  );
  const highReadiness = SORTED_PROFILES.filter(
    (p) => p.current_readiness === "HIGH" || p.current_readiness === "ELEVATED"
  ).length;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01]">
      {/* Search */}
      <div className="border-b border-white/[0.06] p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isAr
              ? "البحث في الملفات الدفاعية..."
              : "Search defense profiles..."
          }
          className={`w-full bg-white/[0.03] border border-white/[0.06] px-3 py-2 font-mono text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30 ${
            isAr ? "arabic-text text-right" : ""
          }`}
        />
      </div>

      {/* Summary stats */}
      <div
        className="flex items-center gap-3 px-3 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex-1">
          <div className="font-mono text-[8px] tracking-widest text-slate-600">
            {isAr ? "الإنفاق الدفاعي" : "DEFENSE SPEND"}
          </div>
          <div className="font-mono text-[11px] font-bold text-slate-300">
            ${totalBudget.toFixed(1)}B
          </div>
        </div>
        <div className="flex-1">
          <div className="font-mono text-[8px] tracking-widest text-slate-600">
            {isAr ? "جاهزية مرتفعة" : "ELEVATED+"}
          </div>
          <div className="font-mono text-[11px] font-bold text-amber-400">
            {highReadiness}/{SORTED_PROFILES.length}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-mono text-[8px] tracking-widest text-slate-600">
            {isAr ? "دول" : "COUNTRIES"}
          </div>
          <div className="font-mono text-[11px] font-bold text-slate-300">
            {SORTED_PROFILES.length}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="font-mono text-[10px] font-semibold tracking-wider text-slate-400">
          {isAr ? "الملفات الدفاعية" : "DEFENSE PROFILES"}
        </div>
        <div className="font-mono text-[9px] text-slate-600">
          {isAr ? `${filtered.length} دولة` : `${filtered.length} countries`}
        </div>
      </div>

      {/* Profile list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((profile) => (
          <DefenseCard
            key={profile.iso3}
            profile={profile}
            isAr={isAr}
            onClick={() => setSelectedCountry(profile.iso3)}
          />
        ))}
      </div>
    </aside>
  );
}

function DefenseCard({
  profile,
  isAr,
  onClick,
}: {
  profile: DefenseProfile;
  isAr: boolean;
  onClick: () => void;
}) {
  const rankTier = getRankTier(profile.gfp_rank);
  const readinessColor = getReadinessColor(profile.current_readiness);
  const trendColor = TREND_COLOR[profile.gfp_trend] || "#64748b";
  const trendIcon = TREND_ICON[profile.gfp_trend] || "―";

  // Calculate overall capability average
  const caps = Object.values(profile.capabilities);
  const avgCap = Math.round(caps.reduce((s, c) => s + c, 0) / caps.length);
  const avgColor =
    avgCap >= 70 ? "#22c55e" : avgCap >= 50 ? "#3b82f6" : "#f59e0b";

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
    >
      {/* Country name + rank */}
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <div className="text-[12px] font-semibold text-slate-200">
            {profile.country}
          </div>
          <div className="font-mono text-[8px] text-yellow-500/70">
            {isAr ? rankTier.labelAr : rankTier.label}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[13px] font-bold text-slate-300">
            #{profile.gfp_rank}
          </div>
          <div
            className="font-mono text-[8px] font-bold"
            style={{ color: trendColor }}
          >
            {trendIcon}
          </div>
        </div>
      </div>

      {/* Quick info row */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5"
          style={{
            color: readinessColor,
            backgroundColor: readinessColor + "15",
            border: `1px solid ${readinessColor}40`,
          }}
        >
          {getReadinessLabel(profile.current_readiness, isAr)}
        </span>
        <span className="font-mono text-[9px] text-slate-500">
          ${profile.defense_budget_usd}B
        </span>
        {hasUSPresence(profile.iso3) && (
          <span className="text-[9px]" title="US Military Presence">
            🇺🇸
          </span>
        )}
      </div>

      {/* Mini capability bars */}
      <div className="space-y-0.5">
        {CAPABILITY_KEYS.map((cap) => {
          const val = profile.capabilities[cap.key];
          const barColor =
            val >= 80
              ? "#22c55e"
              : val >= 60
                ? "#3b82f6"
                : val >= 40
                  ? "#f59e0b"
                  : "#ef4444";
          return (
            <div key={cap.key} className="flex items-center gap-1.5">
              <span className="font-mono text-[6px] tracking-wider text-slate-600 w-14 shrink-0">
                {isAr ? cap.labelAr : cap.label}
              </span>
              <div
                className="flex-1 h-[3px]"
                style={{ backgroundColor: "#1e2530" }}
              >
                <div
                  className="h-full"
                  style={{ width: `${val}%`, backgroundColor: barColor }}
                />
              </div>
              <span className="font-mono text-[7px] text-slate-600 w-4 text-right">
                {val}
              </span>
            </div>
          );
        })}
      </div>

      {/* Overall score */}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="font-mono text-[7px] tracking-wider text-slate-600">
          {isAr ? "إجمالي" : "OVERALL"}
        </span>
        <div
          className="flex-1 h-1"
          style={{ backgroundColor: "#1e2530" }}
        >
          <div
            className="h-full"
            style={{ width: `${avgCap}%`, backgroundColor: avgColor }}
          />
        </div>
        <span
          className="font-mono text-[8px] font-bold"
          style={{ color: avgColor }}
        >
          {avgCap}
        </span>
      </div>
    </button>
  );
}
