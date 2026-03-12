"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useProfileStore, ROLE_META } from "@/stores/profile-store";
import {
  DEFENSE_PROFILES,
  CAPABILITY_KEYS,
  getRankTier,
  getReadinessColor,
  getReadinessLabel,
  type DefenseProfile,
  type DefenseCapabilities,
} from "@/data/defense-profiles";

const ISO3_TO_NAME: Record<string, string> = {
  KWT: "Kuwait", SAU: "Saudi Arabia", ARE: "UAE", QAT: "Qatar",
  BHR: "Bahrain", OMN: "Oman", IRQ: "Iraq", IRN: "Iran", ISR: "Israel",
};
const ISO3_TO_NAME_AR: Record<string, string> = {
  KWT: "الكويت", SAU: "السعودية", ARE: "الإمارات", QAT: "قطر",
  BHR: "البحرين", OMN: "عُمان", IRQ: "العراق", IRN: "إيران", ISR: "إسرائيل",
};

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCountry: string; // ISO3
}

export function DefenseComparisonModal({ open, onClose, defaultCountry }: Props) {
  const { t, lang } = useLanguage();
  const profile = useProfileStore((s) => s.profile);
  const isAr = lang === "ar";

  const [countryA, setCountryA] = useState(defaultCountry);
  const [countryB, setCountryB] = useState(defaultCountry === "IRN" ? "SAU" : "IRN");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const profileA = DEFENSE_PROFILES[countryA];
  const profileB = DEFENSE_PROFILES[countryB];
  const availableCountries = Object.keys(DEFENSE_PROFILES);

  const nameOf = (iso3: string) => isAr ? (ISO3_TO_NAME_AR[iso3] || iso3) : (ISO3_TO_NAME[iso3] || iso3);

  const generateAnalysis = useCallback(async () => {
    if (!profileA || !profileB) return;
    setAiLoading(true);
    setAiAnalysis(null);

    const prompt = `You are Atlas Command defense analyst. Generate a concise comparison analysis.

Compare ${profileA.country} vs ${profileB.country} military capabilities:

${profileA.country}:
- GFP Rank: #${profileA.gfp_rank}, Budget: $${profileA.defense_budget_usd}B
- Air: ${profileA.capabilities.air_power}, Land: ${profileA.capabilities.land_power}, Naval: ${profileA.capabilities.naval_power}, Cyber: ${profileA.capabilities.cyber_power}, Missile: ${profileA.capabilities.missile_systems}
- Key: ${profileA.key_assets.slice(0, 4).join(", ")}
- Posture: ${profileA.threat_posture}, Readiness: ${profileA.current_readiness}

${profileB.country}:
- GFP Rank: #${profileB.gfp_rank}, Budget: $${profileB.defense_budget_usd}B
- Air: ${profileB.capabilities.air_power}, Land: ${profileB.capabilities.land_power}, Naval: ${profileB.capabilities.naval_power}, Cyber: ${profileB.capabilities.cyber_power}, Missile: ${profileB.capabilities.missile_systems}
- Key: ${profileB.key_assets.slice(0, 4).join(", ")}
- Posture: ${profileB.threat_posture}, Readiness: ${profileB.current_readiness}

${profile ? `User role: ${ROLE_META[profile.role].label}, region: ${profile.region}` : ""}

Write 3-4 sentences identifying:
1. Where capability gaps exist and which country is exposed
2. What deterrent factors mitigate or amplify risk
3. One specific operational implication for Gulf leadership

Language: ${isAr ? "Arabic (MSA)" : "English"}
Be specific. Name weapon systems and actual vulnerabilities.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          events: [],
          lang: isAr ? "ar" : "en",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.response) setAiAnalysis(data.response);
      }
    } catch {
      setAiAnalysis(
        isAr
          ? `${nameOf(countryA)} مقابل ${nameOf(countryB)}: تحليل المقارنة الدفاعية قيد الإعداد. تأكد من اتصال خادم API.`
          : `${nameOf(countryA)} vs ${nameOf(countryB)}: Defense comparison analysis initializing. Ensure API server is connected.`
      );
    }
    setAiLoading(false);
  }, [countryA, countryB, profileA, profileB, isAr, profile]);

  if (!open) return null;

  const capBar = (label: string, labelAr: string, key: keyof DefenseCapabilities) => {
    const valA = profileA?.capabilities[key] || 0;
    const valB = profileB?.capabilities[key] || 0;
    const gap = Math.abs(valA - valB);
    const dangerA = valB - valA > 25;
    const dangerB = valA - valB > 25;

    return (
      <div className="mb-3">
        <div className="font-mono text-[9px] tracking-wider text-slate-500 mb-1.5">
          {isAr ? labelAr : label}
        </div>
        {/* Country A bar */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[9px] text-slate-500 w-12 shrink-0 truncate">
            {nameOf(countryA).slice(0, 6)}
          </span>
          <div className="flex-1 h-2" style={{ backgroundColor: "#1e2530" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${valA}%`,
                backgroundColor: dangerA ? "#dc2626" : "#3b82f6",
              }}
            />
          </div>
          <span className={`font-mono text-[10px] w-6 text-right ${dangerA ? "text-red-400 font-bold" : "text-slate-400"}`}>
            {valA}
          </span>
        </div>
        {/* Country B bar */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-slate-500 w-12 shrink-0 truncate">
            {nameOf(countryB).slice(0, 6)}
          </span>
          <div className="flex-1 h-2" style={{ backgroundColor: "#1e2530" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${valB}%`,
                backgroundColor: dangerB ? "#dc2626" : "#f59e0b",
              }}
            />
          </div>
          <span className={`font-mono text-[10px] w-6 text-right ${dangerB ? "text-red-400 font-bold" : "text-slate-400"}`}>
            {valB}
          </span>
        </div>
        {gap > 25 && (
          <div className="font-mono text-[8px] text-red-400/80 mt-0.5 tracking-wider">
            ← {isAr ? "فجوة كبيرة" : "SIGNIFICANT GAP"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-[700px] max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: "#0d1117", border: "1px solid #1e2530" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 backdrop-blur"
          style={{ backgroundColor: "#0d1117ee", borderBottom: "1px solid #1e2530" }}
        >
          <div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500">
              {t("defense.comparison")}
            </div>
            <div className="text-sm font-semibold text-white">
              {nameOf(countryA)} vs {nameOf(countryB)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center font-mono text-slate-500 hover:text-white"
            style={{ border: "1px solid #1e2530" }}
          >
            ✕
          </button>
        </div>

        {/* Country selectors */}
        <div className="flex items-center gap-4 px-6 py-3" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="flex-1">
            <div className="font-mono text-[8px] tracking-wider text-slate-600 mb-1">
              {isAr ? "الدولة الأولى" : "COUNTRY A"}
            </div>
            <select
              value={countryA}
              onChange={(e) => { setCountryA(e.target.value); setAiAnalysis(null); }}
              className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 font-mono text-[11px] text-slate-300 outline-none"
            >
              {availableCountries.map((iso3) => (
                <option key={iso3} value={iso3}>{nameOf(iso3)}</option>
              ))}
            </select>
          </div>
          <div className="font-mono text-[11px] text-slate-600 mt-4">vs</div>
          <div className="flex-1">
            <div className="font-mono text-[8px] tracking-wider text-slate-600 mb-1">
              {isAr ? "الدولة الثانية" : "COUNTRY B"}
            </div>
            <select
              value={countryB}
              onChange={(e) => { setCountryB(e.target.value); setAiAnalysis(null); }}
              className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 font-mono text-[11px] text-slate-300 outline-none"
            >
              {availableCountries.map((iso3) => (
                <option key={iso3} value={iso3}>{nameOf(iso3)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary comparison */}
        {profileA && profileB && (
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e2530" }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Country A summary */}
              <div>
                <div className="font-mono text-[10px] font-bold text-blue-400 tracking-wider mb-1">
                  {nameOf(countryA)}
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  #{profileA.gfp_rank} · ${profileA.defense_budget_usd}B
                </div>
                <div className="font-mono text-[9px] mt-1" style={{ color: getReadinessColor(profileA.current_readiness) }}>
                  {getReadinessLabel(profileA.current_readiness, isAr)}
                </div>
              </div>
              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="font-mono text-[20px] font-bold text-slate-700">VS</div>
              </div>
              {/* Country B summary */}
              <div>
                <div className="font-mono text-[10px] font-bold text-amber-400 tracking-wider mb-1">
                  {nameOf(countryB)}
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  #{profileB.gfp_rank} · ${profileB.defense_budget_usd}B
                </div>
                <div className="font-mono text-[9px] mt-1" style={{ color: getReadinessColor(profileB.current_readiness) }}>
                  {getReadinessLabel(profileB.current_readiness, isAr)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capability comparison bars */}
        {profileA && profileB && (
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e2530" }}>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mb-3">
              {t("defense.capabilityComparison")}
            </div>
            {CAPABILITY_KEYS.map((cap) => capBar(cap.label, cap.labelAr, cap.key))}
          </div>
        )}

        {/* Alliance comparison */}
        {profileA && profileB && (
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e2530" }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-[9px] tracking-wider text-slate-600 mb-2">
                  {nameOf(countryA)} — {isAr ? "التحالفات" : "ALLIANCES"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(isAr ? profileA.alliances_ar : profileA.alliances).map((a, i) => (
                    <span key={i} className="px-2 py-0.5 font-mono text-[9px] text-blue-400/80" style={{ border: "1px solid #1e253080" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-wider text-slate-600 mb-2">
                  {nameOf(countryB)} — {isAr ? "التحالفات" : "ALLIANCES"}
                </div>
                <div className="flex flex-wrap gap-1">
                  {(isAr ? profileB.alliances_ar : profileB.alliances).map((a, i) => (
                    <span key={i} className="px-2 py-0.5 font-mono text-[9px] text-amber-400/80" style={{ border: "1px solid #1e253080" }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <div className="px-6 py-4">
          <div className="font-mono text-[10px] tracking-widest text-slate-500 mb-3">
            {t("defense.atlasAnalysis")}
          </div>
          {aiAnalysis ? (
            <div className={`text-[13px] leading-[1.8] ${isAr ? "arabic-text" : ""}`} style={{ color: "#e5e7eb" }}>
              {aiAnalysis}
            </div>
          ) : aiLoading ? (
            <div className="py-4 text-center">
              <span className="font-mono text-[11px] text-blue-400 animate-pulse">
                {t("defense.analyzing")}
              </span>
            </div>
          ) : (
            <button
              onClick={generateAnalysis}
              className="w-full py-3 font-mono text-[11px] font-semibold tracking-wider text-white transition-colors hover:brightness-110"
              style={{ backgroundColor: "#3b82f6" }}
            >
              {t("defense.generateAnalysis")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
