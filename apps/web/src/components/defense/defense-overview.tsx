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
import { DefenseComparisonModal } from "@/components/country/defense-comparison-modal";

const SORTED_PROFILES = Object.values(DEFENSE_PROFILES).sort(
  (a, b) => a.gfp_rank - b.gfp_rank
);

const TREND_ICON: Record<string, string> = { UP: "▲", STABLE: "―", DOWN: "▼" };
const TREND_COLOR: Record<string, string> = {
  UP: "#22c55e",
  STABLE: "#64748b",
  DOWN: "#ef4444",
};

export function DefenseOverview() {
  const { t, lang } = useLanguage();
  const setSelectedCountry = useCommandStore((s) => s.setSelectedCountry);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const isAr = lang === "ar";

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonCountry, setComparisonCountry] = useState("SAU");

  const totalBudget = SORTED_PROFILES.reduce(
    (s, p) => s + p.defense_budget_usd,
    0
  );
  const avgRank = Math.round(
    SORTED_PROFILES.reduce((s, p) => s + p.gfp_rank, 0) /
      SORTED_PROFILES.length
  );
  const highReadiness = SORTED_PROFILES.filter(
    (p) => p.current_readiness === "HIGH" || p.current_readiness === "ELEVATED"
  ).length;

  function openCountryOnMap(iso3: string) {
    setSelectedCountry(iso3);
    setActiveSection("situation");
  }

  function openComparison(iso3: string) {
    setComparisonCountry(iso3);
    setComparisonOpen(true);
  }

  return (
    <>
      <div
        className="flex flex-1 flex-col overflow-y-auto"
        style={{ backgroundColor: "#080b12" }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-8 py-6"
          style={{ borderBottom: "1px solid #1e2530" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-lg font-semibold tracking-wider text-white ${isAr ? "arabic-text" : ""}`}
              >
                {t("defense.title")}
              </h1>
              <div className="font-mono text-[10px] tracking-widest text-slate-600 mt-1">
                {t("defense.source")}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => openComparison("SAU")}
                className="px-4 py-2 font-mono text-[10px] font-semibold tracking-wider text-slate-300 transition-colors hover:text-white"
                style={{
                  backgroundColor: "#1e2530",
                  border: "1px solid #2e3540",
                }}
              >
                {t("defense.compareDefense")}
              </button>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex gap-6 mt-4">
            <StatBox
              label={isAr ? "الدول المغطاة" : "COUNTRIES PROFILED"}
              value={String(SORTED_PROFILES.length)}
            />
            <StatBox
              label={isAr ? "إجمالي الإنفاق" : "COMBINED BUDGET"}
              value={`$${totalBudget.toFixed(1)}B`}
            />
            <StatBox
              label={isAr ? "متوسط التصنيف" : "AVG GFP RANK"}
              value={`#${avgRank}`}
            />
            <StatBox
              label={isAr ? "جاهزية مرتفعة" : "ELEVATED+ READINESS"}
              value={`${highReadiness}/${SORTED_PROFILES.length}`}
              color="#f59e0b"
            />
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SORTED_PROFILES.map((profile) => (
              <CountryCard
                key={profile.iso3}
                profile={profile}
                isAr={isAr}
                isExpanded={selectedCard === profile.iso3}
                onToggle={() =>
                  setSelectedCard(
                    selectedCard === profile.iso3 ? null : profile.iso3
                  )
                }
                onViewOnMap={() => openCountryOnMap(profile.iso3)}
                onCompare={() => openComparison(profile.iso3)}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>

      <DefenseComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        defaultCountry={comparisonCountry}
      />
    </>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="px-4 py-2.5"
      style={{ backgroundColor: "#0d1117", border: "1px solid #1e2530" }}
    >
      <div className="font-mono text-[8px] tracking-widest text-slate-600 mb-1">
        {label}
      </div>
      <div
        className="font-mono text-sm font-bold"
        style={{ color: color || "#e5e7eb" }}
      >
        {value}
      </div>
    </div>
  );
}

function CountryCard({
  profile,
  isAr,
  isExpanded,
  onToggle,
  onViewOnMap,
  onCompare,
  t,
}: {
  profile: DefenseProfile;
  isAr: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onViewOnMap: () => void;
  onCompare: () => void;
  t: (key: any) => string;
}) {
  const rankTier = getRankTier(profile.gfp_rank);
  const readinessColor = getReadinessColor(profile.current_readiness);
  const stars =
    "\u2605".repeat(rankTier.stars) +
    "\u2606".repeat(5 - rankTier.stars);
  const trendIcon = TREND_ICON[profile.gfp_trend] || "―";
  const trendColor = TREND_COLOR[profile.gfp_trend] || "#64748b";

  // Find the strongest capability
  const caps = Object.entries(profile.capabilities) as [string, number][];
  const strongest = caps.reduce((a, b) => (b[1] > a[1] ? b : a));
  const avgCap = Math.round(caps.reduce((s, c) => s + c[1], 0) / caps.length);

  return (
    <div
      className="transition-all"
      style={{
        backgroundColor: "#0d1117",
        border: `1px solid ${isExpanded ? "#3b82f640" : "#1e2530"}`,
      }}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:brightness-110 transition-all"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[14px] font-semibold text-white">
              {profile.country}
            </div>
            <div className="font-mono text-[10px] text-yellow-500/80">
              [{stars}] {isAr ? rankTier.labelAr : rankTier.label}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-white">
              #{profile.gfp_rank}
            </div>
            <div
              className="font-mono text-[9px] font-bold"
              style={{ color: trendColor }}
            >
              {trendIcon} {profile.gfp_trend}
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5"
            style={{
              color: readinessColor,
              backgroundColor: readinessColor + "15",
              border: `1px solid ${readinessColor}40`,
            }}
          >
            {getReadinessLabel(profile.current_readiness, isAr)}
          </span>
          <span className="font-mono text-[10px] text-slate-400">
            ${profile.defense_budget_usd}B
          </span>
          <span className="font-mono text-[9px] text-slate-600">
            {profile.defense_budget_gdp_pct}% GDP
          </span>
          {hasUSPresence(profile.iso3) && (
            <span className="text-[10px]" title="US Military Presence">
              🇺🇸
            </span>
          )}
        </div>

        {/* Mini capability bars */}
        <div className="space-y-1">
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
              <div key={cap.key} className="flex items-center gap-2">
                <span className="font-mono text-[7px] tracking-wider text-slate-600 w-16 shrink-0">
                  {isAr ? cap.labelAr : cap.label}
                </span>
                <div
                  className="flex-1 h-1"
                  style={{ backgroundColor: "#1e2530" }}
                >
                  <div
                    className="h-full"
                    style={{ width: `${val}%`, backgroundColor: barColor }}
                  />
                </div>
                <span className="font-mono text-[8px] text-slate-500 w-4 text-right">
                  {val}
                </span>
              </div>
            );
          })}
        </div>

        {/* Overall score bar */}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-[7px] tracking-wider text-slate-600">
            {isAr ? "إجمالي" : "OVERALL"}
          </span>
          <div
            className="flex-1 h-1.5"
            style={{ backgroundColor: "#1e2530" }}
          >
            <div
              className="h-full"
              style={{
                width: `${avgCap}%`,
                backgroundColor:
                  avgCap >= 70
                    ? "#22c55e"
                    : avgCap >= 50
                      ? "#3b82f6"
                      : "#f59e0b",
              }}
            />
          </div>
          <span className="font-mono text-[9px] font-bold text-slate-400">
            {avgCap}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: "1px solid #1e2530" }}
        >
          {/* Threat posture */}
          <div className="mt-3 mb-3">
            <div className="font-mono text-[8px] tracking-widest text-slate-600 mb-1">
              {t("defense.threatPosture")}
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              {isAr ? profile.threat_posture_ar : profile.threat_posture}
            </div>
          </div>

          {/* Key assets */}
          <div className="mb-3">
            <div className="font-mono text-[8px] tracking-widest text-slate-600 mb-1">
              {t("defense.keyAssets")}
            </div>
            <div className="space-y-0.5">
              {(isAr ? profile.key_assets_ar : profile.key_assets)
                .slice(0, 4)
                .map((asset, i) => (
                  <div
                    key={i}
                    className={`font-mono text-[10px] text-slate-400 ${isAr ? "arabic-text" : ""}`}
                  >
                    · {asset}
                  </div>
                ))}
            </div>
          </div>

          {/* Alliances */}
          <div className="mb-3">
            <div className="font-mono text-[8px] tracking-widest text-slate-600 mb-1">
              {t("defense.alliances")}
            </div>
            <div className="flex flex-wrap gap-1">
              {(isAr ? profile.alliances_ar : profile.alliances).map(
                (a, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 font-mono text-[8px] text-slate-400 ${isAr ? "arabic-text" : ""}`}
                    style={{ border: "1px solid #1e2530" }}
                  >
                    {a}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="mb-3">
            <div className="font-mono text-[8px] tracking-widest text-slate-600 mb-1">
              {t("defense.recentActivity")}
            </div>
            <p
              className={`text-[11px] leading-relaxed text-slate-400 ${isAr ? "arabic-text" : ""}`}
            >
              {isAr ? profile.recent_activity_ar : profile.recent_activity}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onViewOnMap}
              className="flex-1 py-2 font-mono text-[9px] tracking-wider text-slate-300 hover:text-white transition-colors"
              style={{
                backgroundColor: "#1e2530",
                border: "1px solid #2e3540",
              }}
            >
              {isAr ? "عرض على الخريطة" : "VIEW ON MAP"}
            </button>
            <button
              onClick={onCompare}
              className="flex-1 py-2 font-mono text-[9px] tracking-wider text-slate-300 hover:text-white transition-colors"
              style={{
                backgroundColor: "#1e2530",
                border: "1px solid #2e3540",
              }}
            >
              {t("defense.compareDefense")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
