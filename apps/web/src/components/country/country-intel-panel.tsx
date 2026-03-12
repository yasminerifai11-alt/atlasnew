"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore, ROLE_META } from "@/stores/profile-store";
import type { ApiEvent } from "@/lib/api";
import {
  DEFENSE_PROFILES,
  CAPABILITY_KEYS,
  getRankTier,
  getReadinessColor,
  getReadinessLabel,
  hasUSPresence,
} from "@/data/defense-profiles";
import { DefenseComparisonModal } from "./defense-comparison-modal";
import { getSeededIntel, getSeededFullBrief } from "@/data/country-intelligence";
import {
  computeInstabilityScore,
  scoreToLevel,
  levelToColor,
  type InstabilityResult,
} from "@/utils/instability-score";

const RISK_COLORS: Record<string, string> = {
  "CRITICAL+": "#7f1d1d",
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  ELEVATED: "#ca8a04",
  MEDIUM: "#ca8a04",
  MONITORING: "#3b82f6",
  STABLE: "#16a34a",
  LOW: "#16a34a",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  STRIKE: "#dc2626",
  MILITARY: "#dc2626",
  GEOPOLITICAL: "#ea580c",
  MARITIME: "#3b82f6",
  CYBER: "#8b5cf6",
  ECONOMIC: "#ca8a04",
  EARTHQUAKE: "#16a34a",
  NATURAL_DISASTER: "#16a34a",
};

const ISO3_TO_NAME: Record<string, string> = {
  KWT: "Kuwait", SAU: "Saudi Arabia", ARE: "UAE", QAT: "Qatar",
  BHR: "Bahrain", OMN: "Oman", IRQ: "Iraq", IRN: "Iran",
  YEM: "Yemen", EGY: "Egypt", JOR: "Jordan", SYR: "Syria",
  LBN: "Lebanon", PSE: "Palestine", CYP: "Cyprus", TUR: "Turkey",
  AFG: "Afghanistan", PAK: "Pakistan", IND: "India", SDN: "Sudan",
  ERI: "Eritrea", DJI: "Djibouti", SOM: "Somalia", LBY: "Libya",
};

const ISO3_TO_NAME_AR: Record<string, string> = {
  KWT: "الكويت", SAU: "السعودية", ARE: "الإمارات", QAT: "قطر",
  BHR: "البحرين", OMN: "عُمان", IRQ: "العراق", IRN: "إيران",
  YEM: "اليمن", EGY: "مصر", JOR: "الأردن", SYR: "سوريا",
  LBN: "لبنان", PSE: "فلسطين", CYP: "قبرص", TUR: "تركيا",
  AFG: "أفغانستان", PAK: "باكستان", IND: "الهند", SDN: "السودان",
  ERI: "إريتريا", DJI: "جيبوتي", SOM: "الصومال", LBY: "ليبيا",
};

const ISO3_TO_REGION: Record<string, string> = {
  KWT: "GCC · Gulf", SAU: "GCC · Gulf", ARE: "GCC · Gulf", QAT: "GCC · Gulf",
  BHR: "GCC · Gulf", OMN: "GCC · Gulf", IRQ: "Levant · Mesopotamia", IRN: "Persian Gulf",
  YEM: "Arabian Peninsula", EGY: "North Africa", JOR: "Levant", SYR: "Levant",
  LBN: "Levant", PSE: "Levant", TUR: "Anatolia", AFG: "Central Asia",
  PAK: "South Asia", SDN: "East Africa", SOM: "Horn of Africa", LBY: "North Africa",
};

// Map country names in event data to ISO3 for matching
const COUNTRY_TO_ISO3: Record<string, string> = {
  Kuwait: "KWT", "Saudi Arabia": "SAU", UAE: "ARE", Qatar: "QAT",
  Bahrain: "BHR", Oman: "OMN", Iraq: "IRQ", Iran: "IRN",
  Yemen: "YEM", Egypt: "EGY", Jordan: "JOR", Syria: "SYR",
  Lebanon: "LBN", Palestine: "PSE", Cyprus: "CYP", Turkey: "TUR",
  Afghanistan: "AFG", Pakistan: "PAK", India: "IND", Sudan: "SDN",
  Eritrea: "ERI", Djibouti: "DJI", Somalia: "SOM", Libya: "LBY",
};

interface CountryIntel {
  situation: string;
  gcc_significance: string;
  watch_next: string[];
  instability_score: number;
  risk_level: string;
}

export function CountryIntelPanel() {
  const { t, lang } = useLanguage();
  const selectedCountry = useCommandStore((s) => s.selectedCountry);
  const setSelectedCountry = useCommandStore((s) => s.setSelectedCountry);
  const events = useCommandStore((s) => s.events);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const profile = useProfileStore((s) => s.profile);

  const [intel, setIntel] = useState<CountryIntel | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  const [fullBrief, setFullBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isAr = lang === "ar";
  const countryName = isAr
    ? (ISO3_TO_NAME_AR[selectedCountry || ""] || selectedCountry)
    : (ISO3_TO_NAME[selectedCountry || ""] || selectedCountry);
  const regionTag = ISO3_TO_REGION[selectedCountry || ""] || "Middle East";

  // Filter events for this country
  const countryEvents = events.filter((e) => {
    const evIso3 = COUNTRY_TO_ISO3[e.country] || e.country;
    return evIso3 === selectedCountry;
  });

  // Also find nearby events (events in the same region)
  const nearbyEvents = events.filter((e) => {
    const evIso3 = COUNTRY_TO_ISO3[e.country] || e.country;
    return evIso3 !== selectedCountry && e.region === regionTag?.split(" · ")[0];
  });

  // Compute 4-component instability score
  const instabilityResult: InstabilityResult = useMemo(() => {
    if (!selectedCountry) return { score: 0, level: "STABLE" as const, components: { internal: 0, regional: 0, infrastructure: 0, events: 0 } };
    return computeInstabilityScore(selectedCountry, events, COUNTRY_TO_ISO3);
  }, [selectedCountry, events]);
  const maxRiskScore = instabilityResult.score;
  const computedRiskLevel = instabilityResult.level;

  // ESC key closes panel
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCountry) {
        setSelectedCountry(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedCountry, setSelectedCountry]);

  // Generate AI intel when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setIntel(null);
      setFullBrief(null);
      return;
    }
    generateCountryIntel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  // Build a structured event list for Claude context
  const buildEventContext = useCallback(
    (evList: ApiEvent[]) => {
      if (evList.length === 0) return "";
      return evList
        .sort((a, b) => b.risk_score - a.risk_score)
        .map((e, i) => {
          const ago = (() => {
            const diff = Date.now() - new Date(e.event_time).getTime();
            const h = Math.floor(diff / 3600000);
            if (h < 1) return "just now";
            if (h < 24) return `${h}h ago`;
            return `${Math.floor(h / 24)}d ago`;
          })();
          return `${i + 1}. ${e.risk_level} — ${e.title}\n   Risk: ${e.risk_score}/100 — ${ago}\n   ${isAr && e.situation_ar ? e.situation_ar : e.situation_en || e.description || ""}`;
        })
        .join("\n\n");
    },
    [isAr]
  );

  const generateCountryIntel = useCallback(async () => {
    if (!selectedCountry) return;
    setIntelLoading(true);
    setIntel(null);

    const allRelevantEvents = [...countryEvents, ...nearbyEvents.slice(0, 3)];
    const eventContext = buildEventContext(allRelevantEvents);
    const hasEvents = allRelevantEvents.length > 0;

    const prompt = isAr
      ? `أنت محلل استخبارات Atlas Command. أنشئ تقييماً موجزاً ومحدداً لكبار القادة.

الأحداث النشطة التي تؤثر على ${ISO3_TO_NAME_AR[selectedCountry] || ISO3_TO_NAME[selectedCountry] || selectedCountry} الآن:
${eventContext || "لم تُكتشف أحداث نشطة. أنشئ تقييماً بناءً على السياق الإقليمي."}
${profile ? `\nدور المستخدم: ${ROLE_META[profile.role].label}، يركز على ${profile.region}.` : ""}

${hasEvents ? `بناءً فقط على هذه الأحداث المحددة، صف وضع ${ISO3_TO_NAME_AR[selectedCountry] || selectedCountry} الحالي.
اذكر هذه الأحداث بالاسم. أعطِ أرقاماً محددة.
لا تخترع أحداثاً. لا تكن عاماً.
كل جملة يجب أن تتصل بأحد الأحداث أعلاه.` : ""}

أعد فقط JSON صالح، جميع النصوص بالعربية:
{
  "situation": "٢-٣ جمل عن الوضع الحالي — اذكر أحداثاً بعينها",
  "gcc_significance": "٢-٣ جمل عن أهمية ذلك لدول الخليج — بأرقام محددة",
  "watch_next": [
    "٣ أشياء محددة للمراقبة مرتبطة بالأحداث أعلاه",
    "كل واحدة جملة واحدة",
    "ملموسة وعملية"
  ],
  "instability_score": ${Math.round(maxRiskScore) || 25},
  "risk_level": "${computedRiskLevel}"
}`
      : `You are Atlas Command intelligence analyst. Generate concise, specific intelligence for senior leaders.

Current active events affecting ${ISO3_TO_NAME[selectedCountry] || selectedCountry} right now:
${eventContext || "No active events detected. Generate assessment based on regional context."}
${profile ? `\nUser role: ${ROLE_META[profile.role].label}, focused on ${profile.region}.` : ""}

${hasEvents ? `Based ONLY on these specific events, describe ${ISO3_TO_NAME[selectedCountry] || selectedCountry}'s current situation.
Reference these events by name. Give specific numbers.
Do not invent events. Do not be generic.
Every sentence must connect to one of the events above.` : ""}

Generate this JSON only, no other text:
{
  "situation": "2-3 sentences referencing the specific events above",
  "gcc_significance": "2-3 sentences on Gulf impact — use specific numbers",
  "watch_next": [
    "3 specific things to monitor tied to events above",
    "each one sentence",
    "concrete and operational"
  ],
  "instability_score": ${Math.round(maxRiskScore) || 25},
  "risk_level": "${computedRiskLevel}"
}`;

    const useFallback = () => {
      // Try seeded intelligence data first
      const seeded = getSeededIntel(selectedCountry, isAr ? "ar" : "en");
      if (seeded) {
        setIntel(seeded);
        return;
      }
      // Generic fallback
      setIntel({
        situation: isAr
          ? `${countryName} تشهد حالياً ${countryEvents.length} حدث نشط. ${countryEvents.length > 0 ? `أعلى مستوى خطر: ${computedRiskLevel} (${Math.round(maxRiskScore)}/100).` : "لا توجد أحداث مباشرة حالياً، المراقبة مستمرة."}`
          : `${countryName} currently has ${countryEvents.length} active event${countryEvents.length !== 1 ? "s" : ""}. ${countryEvents.length > 0 ? `Highest risk level: ${computedRiskLevel} (${Math.round(maxRiskScore)}/100).` : "No direct events detected. Continuous monitoring active."}`,
        gcc_significance: isAr
          ? `أي تصعيد في ${countryName} يؤثر مباشرة على استقرار منطقة الخليج وطرق التجارة البحرية.`
          : `Any escalation in ${countryName} directly impacts Gulf regional stability and maritime trade routes.`,
        watch_next: isAr
          ? ["مراقبة التطورات الأمنية", "متابعة تأثير الأحداث على أسعار النفط", "رصد التحركات الدبلوماسية الإقليمية"]
          : ["Monitor security developments along borders", "Track impact on oil prices and energy infrastructure", "Watch for diplomatic signals from regional actors"],
        instability_score: Math.round(maxRiskScore) || 25,
        risk_level: computedRiskLevel,
      });
    };

    // Race between API call and 5s timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          events: allRelevantEvents,
          lang: isAr ? "ar" : "en",
        }),
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.response) {
          try {
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setIntel(parsed);
            } else {
              setIntel({
                situation: data.response.slice(0, 300),
                gcc_significance: isAr
                  ? "التقييم قيد التحليل. الأحداث النشطة في المنطقة تتطلب مراقبة مستمرة."
                  : "Assessment under analysis. Active events in the region require continuous monitoring.",
                watch_next: [
                  isAr ? "مراقبة التطورات الأمنية على الحدود" : "Monitor border security developments",
                  isAr ? "متابعة تحركات الأسواق المالية الإقليمية" : "Track regional financial market movements",
                  isAr ? "مراقبة تصريحات القيادة والمبعوثين الدبلوماسيين" : "Monitor leadership statements and diplomatic envoys",
                ],
                instability_score: Math.round(maxRiskScore) || 25,
                risk_level: computedRiskLevel,
              });
            }
          } catch {
            setIntel({
              situation: data.response.slice(0, 300),
              gcc_significance: isAr
                ? "التقييم قيد التحليل. الأحداث النشطة في المنطقة تتطلب مراقبة مستمرة."
                : "Assessment under analysis. Active events in the region require continuous monitoring.",
              watch_next: [
                isAr ? "مراقبة التطورات الأمنية على الحدود" : "Monitor border security developments",
                isAr ? "متابعة تحركات الأسواق المالية الإقليمية" : "Track regional financial market movements",
                isAr ? "مراقبة تصريحات القيادة والمبعوثين الدبلوماسيين" : "Monitor leadership statements and diplomatic envoys",
              ],
              instability_score: Math.round(maxRiskScore) || 25,
              risk_level: computedRiskLevel,
            });
          }
        } else {
          useFallback();
        }
      } else {
        useFallback();
      }
    } catch {
      clearTimeout(timeoutId);
      useFallback();
    }
    setIntelLoading(false);
  }, [selectedCountry, countryEvents, nearbyEvents, isAr, maxRiskScore, computedRiskLevel, profile, countryName]);

  const generateFullBrief = useCallback(async () => {
    if (!selectedCountry) return;
    setBriefLoading(true);
    setBriefModalOpen(true);

    const eventsData = countryEvents
      .map((e) => `[${e.risk_level}/${e.risk_score}] ${e.title} — ${e.region} (${e.sector})\n${isAr && e.situation_ar ? e.situation_ar : e.situation_en}`)
      .join("\n\n");

    const prompt = isAr
      ? `أنت Atlas Command.
أنشئ نشرة استخباراتية شاملة عن ${ISO3_TO_NAME_AR[selectedCountry] || ISO3_TO_NAME[selectedCountry] || selectedCountry}. اكتب بالكامل بالعربية الفصحى.
الأحداث النشطة: ${eventsData || "لا أحداث نشطة."}
التاريخ: ${new Date().toISOString().slice(0, 10)}
${profile ? `دور المستخدم: ${ROLE_META[profile.role].label}، يركز على ${profile.region}.` : ""}

الهيكل:
١. الملخص التنفيذي (٣ جمل)
٢. الوضع الحالي (مفصل)
٣. الأحداث والإشارات الرئيسية
٤. تعرض البنية التحتية
٥. التداعيات الخليجية والإقليمية
٦. التوقعات — ٧٢ ساعة القادمة
٧. الإجراءات الموصى بها (٥ محددة)
٨. ما يجب مراقبته

القواعد:
- أسلوب مذكرات سرية
- محدد وليس عاماً
- سمِّ أصولاً ومواقع فعلية
- ٥٠٠ كلمة كحد أقصى
- بالعربية الفصحى فقط`
      : `You are Atlas Command.
Generate a complete intelligence brief for ${ISO3_TO_NAME[selectedCountry] || selectedCountry}.
Active events: ${eventsData || "No active events."}
Date: ${new Date().toISOString().slice(0, 10)}
${profile ? `User role: ${ROLE_META[profile.role].label}, focused on ${profile.region}.` : ""}

Structure:
1. EXECUTIVE SUMMARY (3 sentences)
2. CURRENT SITUATION (detailed)
3. KEY EVENTS AND SIGNALS
4. INFRASTRUCTURE EXPOSURE
5. GCC AND REGIONAL IMPLICATIONS
6. FORECAST — NEXT 72 HOURS
7. RECOMMENDED ACTIONS (5 specific)
8. WHAT TO WATCH

Rules:
- Classified memo style
- Specific, not generic
- Name actual assets and locations
- Maximum 500 words
- Language: English`;

    const briefFallback = () => {
      const seeded = getSeededFullBrief(selectedCountry, isAr ? "ar" : "en");
      if (seeded) return seeded;
      return isAr
        ? `إحاطة استخباراتية — ${countryName}\n\nالملخص التنفيذي: ${countryName} تشهد ${countryEvents.length} حدث نشط. الوضع يتطلب مراقبة مستمرة.`
        : `Intelligence Brief — ${countryName}\n\nExecutive Summary: ${countryName} has ${countryEvents.length} active events. Situation requires continuous monitoring.`;
    };

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          events: [...countryEvents, ...nearbyEvents.slice(0, 3)],
          lang: isAr ? "ar" : "en",
        }),
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.response) setFullBrief(data.response);
        else setFullBrief(briefFallback());
      } else {
        setFullBrief(briefFallback());
      }
    } catch {
      clearTimeout(timeoutId);
      setFullBrief(briefFallback());
    }
    setBriefLoading(false);
  }, [selectedCountry, countryEvents, nearbyEvents, isAr, profile, countryName]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return isAr ? "الآن" : "now";
    if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isAr ? `منذ ${days} يوم` : `${days}d ago`;
  };

  if (!selectedCountry) return null;

  const riskLevel = computedRiskLevel;
  const riskColor = RISK_COLORS[riskLevel] || levelToColor(riskLevel) || "#64748b";
  const instabilityScore = instabilityResult.score;

  // 7-day signal timeline
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEvents = countryEvents.filter((e) => new Date(e.event_time).getTime() > sevenDaysAgo);

  return (
    <>
      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 z-20 h-full w-[380px] overflow-y-auto border-l animate-slide-in-right"
        style={{ backgroundColor: "#0d1117", borderColor: "#1e2530" }}
      >
        {/* Close button */}
        <button
          onClick={() => setSelectedCountry(null)}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center font-mono text-sm text-slate-500 hover:text-slate-200 transition-colors"
          style={{ border: "1px solid #1e2530" }}
        >
          ✕
        </button>

        {/* 1. Country Header */}
        <div className="p-5 pb-4" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="pr-8">
            <h2 className={`text-xl font-semibold text-white mb-1 ${isAr ? "arabic-text" : ""}`}>
              {countryName}
            </h2>
            <div className="font-mono text-[10px] tracking-wider text-slate-500 mb-3">
              {regionTag}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[10px] font-bold tracking-wider px-2.5 py-1"
              style={{
                color: riskColor,
                backgroundColor: riskColor + "15",
                border: `1px solid ${riskColor}40`,
              }}
            >
              {riskLevel}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono text-[9px] text-slate-600">
                  {t("country.instabilityScore")}
                </span>
                <span className="font-mono text-[11px] font-bold" style={{ color: riskColor }}>
                  {instabilityScore}/100
                </span>
              </div>
              <div className="h-1 w-full" style={{ backgroundColor: "#1e2530" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${instabilityScore}%`, backgroundColor: riskColor }}
                />
              </div>
            </div>
          </div>
          {/* Component breakdown */}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {([
              { key: "internal", label: isAr ? "داخلي" : "INTERNAL", weight: "25%" },
              { key: "regional", label: isAr ? "إقليمي" : "REGIONAL", weight: "35%" },
              { key: "infrastructure", label: isAr ? "بنية تحتية" : "INFRA", weight: "25%" },
              { key: "events", label: isAr ? "أحداث" : "EVENTS", weight: "15%" },
            ] as const).map((comp) => {
              const val = instabilityResult.components[comp.key as keyof typeof instabilityResult.components];
              const barColor = val >= 76 ? "#dc2626" : val >= 61 ? "#ea580c" : val >= 41 ? "#ca8a04" : val >= 21 ? "#3b82f6" : "#16a34a";
              return (
                <div key={comp.key} className="text-center">
                  <div className="font-mono text-[7px] tracking-wider text-slate-600 mb-0.5">
                    {comp.label}
                  </div>
                  <div className="h-1 w-full mx-auto" style={{ backgroundColor: "#1e2530" }}>
                    <div className="h-full transition-all duration-700" style={{ width: `${val}%`, backgroundColor: barColor }} />
                  </div>
                  <div className="font-mono text-[8px] mt-0.5" style={{ color: barColor }}>
                    {val}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 font-mono text-[8px] tracking-wider text-slate-600">
            {t("morning.lastUpdated")}: {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
          </div>
        </div>

        {/* 2. Situation */}
        <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#6b7280" }}>
            {t("country.situation")}
          </div>
          {intelLoading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
              <div className="h-3 w-4/5 animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
              <div className="h-3 w-3/5 animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
            </div>
          ) : (
            <p className={`text-[13px] leading-relaxed ${isAr ? "arabic-text" : ""}`} style={{ color: "#e5e7eb" }}>
              {intel?.situation || (isAr ? "جاري تحليل البيانات..." : "Analyzing data...")}
            </p>
          )}
        </div>

        {/* 3. Active Events */}
        <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#6b7280" }}>
            {t("country.activeEvents")}
            <span className="ml-2 text-slate-600">({countryEvents.length})</span>
          </div>
          {countryEvents.length === 0 ? (
            <div className="font-mono text-[11px] text-slate-600 py-2">
              {t("country.noEvents")}
            </div>
          ) : (
            <div className="space-y-2">
              {countryEvents.map((ev, i) => {
                const evColor = RISK_COLORS[ev.risk_level] || "#64748b";
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedEvent(ev);
                      setActiveSection("intel");
                    }}
                    className="w-full text-left p-3 hover:brightness-125 transition-all"
                    style={{ backgroundColor: "#0d1117", border: "1px solid #1e2530" }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: evColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-slate-200 line-clamp-1">
                          {ev.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="font-mono text-[8px] tracking-wider px-1.5 py-0.5"
                            style={{
                              color: EVENT_TYPE_COLORS[ev.event_type] || "#64748b",
                              backgroundColor: (EVENT_TYPE_COLORS[ev.event_type] || "#64748b") + "15",
                            }}
                          >
                            {ev.event_type}
                          </span>
                          <span className="font-mono text-[9px] text-slate-600">
                            {timeAgo(ev.event_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. GCC Significance */}
        <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#6b7280" }}>
            {t("country.gccSignificance")}
          </div>
          {intelLoading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
              <div className="h-3 w-3/4 animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
            </div>
          ) : (
            <p className={`text-[13px] leading-relaxed ${isAr ? "arabic-text" : ""}`} style={{ color: "#e5e7eb" }}>
              {intel?.gcc_significance || (isAr ? "جاري التحليل..." : "Analyzing...")}
            </p>
          )}
        </div>

        {/* 5. 7-Day Signal Timeline */}
        <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#6b7280" }}>
            {t("country.signals7day")}
          </div>
          <div className="relative h-8">
            {/* Timeline line */}
            <div className="absolute top-1/2 left-0 right-0 h-px" style={{ backgroundColor: "#1e2530" }} />
            {/* Day labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
                return (
                  <span key={i} className="font-mono text-[7px] text-slate-700">
                    {d.toLocaleDateString("en-GB", { day: "2-digit" })}
                  </span>
                );
              })}
            </div>
            {/* Event dots */}
            {recentEvents.length === 0 ? (
              <div className="absolute top-0 left-0 right-0 flex items-center justify-center h-5">
                <span className="font-mono text-[9px] text-slate-700">
                  {t("country.signalsNominal")}
                </span>
              </div>
            ) : (
              recentEvents.map((ev, i) => {
                const evTime = new Date(ev.event_time).getTime();
                const position = ((evTime - sevenDaysAgo) / (7 * 24 * 60 * 60 * 1000)) * 100;
                const dotColor = EVENT_TYPE_COLORS[ev.event_type] || "#64748b";
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-3 w-3 rounded-full -translate-x-1/2"
                    style={{
                      left: `${Math.min(100, Math.max(0, position))}%`,
                      backgroundColor: dotColor,
                      boxShadow: `0 0 6px ${dotColor}60`,
                    }}
                    title={ev.title}
                  />
                );
              })
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(EVENT_TYPE_COLORS).slice(0, 6).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-mono text-[7px] text-slate-700">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. What to Watch */}
        <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#6b7280" }}>
            {t("country.watch")}
          </div>
          {intelLoading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
              <div className="h-3 w-5/6 animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
              <div className="h-3 w-4/5 animate-pulse rounded" style={{ backgroundColor: "#1e2530" }} />
            </div>
          ) : (
            <div className="space-y-2">
              {(intel?.watch_next || []).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-mono text-[10px] font-bold mt-0.5" style={{ color: riskColor }}>
                    {i + 1}.
                  </span>
                  <span className={`text-[12px] leading-relaxed ${isAr ? "arabic-text" : ""}`} style={{ color: "#e5e7eb" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Key Infrastructure */}
        <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
          <div className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#6b7280" }}>
            {t("country.criticalInfra")}
          </div>
          {countryEvents.length === 0 ? (
            <div className="font-mono text-[11px] text-slate-600 py-1">
              {t("country.noInfraRisk")}
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Show infrastructure from event sectors */}
              {[...new Set(countryEvents.map((e) => e.sector))].slice(0, 5).map((sector, i) => {
                const relatedEvents = countryEvents.filter((e) => e.sector === sector);
                const maxRisk = Math.max(...relatedEvents.map((e) => e.risk_score));
                const sectorColor = RISK_COLORS[maxRisk >= 80 ? "CRITICAL" : maxRisk >= 60 ? "HIGH" : maxRisk >= 40 ? "MEDIUM" : "LOW"];
                return (
                  <div key={i} className="flex items-center justify-between p-2" style={{ border: "1px solid #1e2530" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">
                        {sector === "ENERGY" ? "⚡" : sector === "MARITIME" ? "🚢" : sector === "SECURITY" ? "🛡" : sector === "FINANCIAL" ? "💰" : "🏗"}
                      </span>
                      <div>
                        <div className="text-[11px] font-medium text-slate-300">{sector}</div>
                        <div className="font-mono text-[8px] text-slate-600">
                          {relatedEvents.length} {isAr ? "حدث" : "event"}{relatedEvents.length > 1 && !isAr ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: sectorColor }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. Defense Profile */}
        {(() => {
          const defProfile = DEFENSE_PROFILES[selectedCountry || ""];
          if (!defProfile) return null;
          const rankTier = getRankTier(defProfile.gfp_rank);
          const readinessColor = getReadinessColor(defProfile.current_readiness);
          const stars = "★".repeat(rankTier.stars) + "☆".repeat(5 - rankTier.stars);
          return (
            <div className="p-5" style={{ borderBottom: "1px solid #1e2530" }}>
              <div className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#6b7280" }}>
                {t("defense.title")}
              </div>

              {/* Rank + tier */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-mono text-[11px] text-slate-300">
                    {t("defense.globalRank")}: <span className="text-white font-bold">#{defProfile.gfp_rank}</span>
                  </div>
                  <div className="font-mono text-[10px] text-yellow-500/80">
                    [{stars}] {isAr ? rankTier.labelAr : rankTier.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] text-slate-400">
                    ${defProfile.defense_budget_usd}B
                  </div>
                  <div className="font-mono text-[8px] text-slate-600">
                    {defProfile.defense_budget_gdp_pct}% {t("defense.gdp")}
                  </div>
                </div>
              </div>

              {/* Capability bars */}
              <div className="space-y-2 mb-3">
                {CAPABILITY_KEYS.map((cap) => {
                  const val = defProfile.capabilities[cap.key];
                  const barColor = val >= 80 ? "#22c55e" : val >= 60 ? "#3b82f6" : val >= 40 ? "#f59e0b" : "#ef4444";
                  return (
                    <div key={cap.key} className="flex items-center gap-2">
                      <span className="font-mono text-[8px] tracking-wider text-slate-500 w-20 shrink-0">
                        {isAr ? cap.labelAr : cap.label}
                      </span>
                      <div className="flex-1 h-1.5" style={{ backgroundColor: "#1e2530" }}>
                        <div
                          className="h-full transition-all duration-700"
                          style={{ width: `${val}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-slate-400 w-5 text-right">{val}</span>
                    </div>
                  );
                })}
              </div>

              {/* Readiness + Posture */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5"
                  style={{
                    color: readinessColor,
                    backgroundColor: readinessColor + "15",
                    border: `1px solid ${readinessColor}40`,
                  }}
                >
                  {getReadinessLabel(defProfile.current_readiness, isAr)}
                </span>
                <span className="font-mono text-[9px] text-slate-500">
                  {isAr ? defProfile.threat_posture_ar : defProfile.threat_posture}
                </span>
              </div>

              {/* Key Assets (collapsible) */}
              <div className="mb-3">
                <button
                  onClick={() => setAssetsExpanded(!assetsExpanded)}
                  className="font-mono text-[9px] tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {assetsExpanded ? "▼" : "▶"} {t("defense.keyAssets")}
                </button>
                {assetsExpanded && (
                  <div className="mt-2 space-y-1">
                    {(isAr ? defProfile.key_assets_ar : defProfile.key_assets).map((asset, i) => (
                      <div key={i} className={`font-mono text-[10px] text-slate-400 ${isAr ? "arabic-text" : ""}`}>
                        · {asset}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alliances */}
              <div className="flex flex-wrap gap-1 mb-3">
                {(isAr ? defProfile.alliances_ar : defProfile.alliances).map((a, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 font-mono text-[8px] text-slate-400 ${isAr ? "arabic-text" : ""}`}
                    style={{ border: "1px solid #1e2530" }}
                  >
                    {a}
                  </span>
                ))}
              </div>

              {/* US Presence indicator */}
              {hasUSPresence(selectedCountry || "") && (
                <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5" style={{ backgroundColor: "#3b82f610", border: "1px solid #3b82f625" }}>
                  <span className="text-[10px]">🇺🇸</span>
                  <span className="font-mono text-[9px] text-blue-400/80 tracking-wider">
                    {t("defense.usPresence")}
                  </span>
                </div>
              )}

              {/* Recent Activity */}
              <div className="mb-3">
                <div className="font-mono text-[9px] tracking-wider text-slate-600 mb-1">
                  {t("defense.recentActivity")}
                </div>
                <p className={`text-[11px] leading-relaxed text-slate-400 ${isAr ? "arabic-text" : ""}`}>
                  {isAr ? defProfile.recent_activity_ar : defProfile.recent_activity}
                </p>
              </div>

              {/* Compare Defense button */}
              <button
                onClick={() => setComparisonOpen(true)}
                className="w-full py-2 font-mono text-[10px] font-semibold tracking-wider text-slate-300 transition-colors hover:text-white"
                style={{ backgroundColor: "#1e2530", border: "1px solid #2e3540" }}
              >
                ⚔ {t("defense.compareDefense")}
              </button>

              {/* Source */}
              <div className="font-mono text-[7px] text-slate-700 mt-2 tracking-wider">
                {t("defense.source")}
              </div>
            </div>
          );
        })()}

        {/* 9. Generate Full Country Brief Button */}
        <div className="p-5">
          <button
            onClick={generateFullBrief}
            disabled={briefLoading}
            className="w-full py-3 font-mono text-[11px] font-semibold tracking-wider text-white transition-colors hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: "#3b82f6" }}
          >
            {briefLoading
              ? t("country.generatingBrief")
              : t("country.generateBrief")}
          </button>
        </div>
      </div>

      {/* Defense Comparison Modal */}
      <DefenseComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        defaultCountry={selectedCountry || "SAU"}
      />

      {/* Full Brief Modal */}
      {briefModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setBriefModalOpen(false); }}
        >
          <div
            className="relative w-[700px] max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: "#0d1117", border: "1px solid #1e2530" }}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 backdrop-blur" style={{ backgroundColor: "#0d1117ee", borderBottom: "1px solid #1e2530" }}>
              <div>
                <div className="font-mono text-[10px] tracking-widest text-slate-500">
                  {t("country.fullBrief")}
                </div>
                <div className="text-sm font-semibold text-white">{countryName}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-slate-400 hover:text-white transition-colors"
                  style={{ border: "1px solid #1e2530" }}
                >
                  {t("intel.exportPdf")}
                </button>
                <button
                  onClick={() => setBriefModalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center font-mono text-slate-500 hover:text-white"
                  style={{ border: "1px solid #1e2530" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Brief content */}
            <div className="p-6">
              {briefLoading ? (
                <div className="py-12 text-center">
                  <div className="font-mono text-[11px] text-blue-400 animate-pulse mb-2">
                    {t("country.atlasGenerating")}
                  </div>
                  <div className="font-mono text-[9px] text-slate-600">
                    {t("country.analyzingCount", { count: String(countryEvents.length) })}
                  </div>
                </div>
              ) : fullBrief ? (
                <div className={`text-[13px] leading-[1.8] whitespace-pre-wrap ${isAr ? "arabic-text" : ""}`} style={{ color: "#e5e7eb" }}>
                  {fullBrief}
                </div>
              ) : null}
            </div>

            {/* Print version — dark classified document */}
            <div className="hidden print-only print-brief">
              <div className="doc-classification">
                {isAr ? "سري — للاستخدام الرسمي فقط" : "CLASSIFIED — OFFICIAL USE ONLY"}
              </div>
              <div className="doc-header">
                <div className="doc-logo">{isAr ? "أطلس كوماند" : "ATLAS COMMAND"}</div>
                <div className="doc-class">{isAr ? "نشرة الدولة" : "COUNTRY BRIEF"}</div>
              </div>
              <div className="doc-title">{(countryName || "").toUpperCase()} — {isAr ? "نشرة استخباراتية" : "INTELLIGENCE BRIEF"}</div>
              <div className="doc-meta">
                {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {" · "}{isAr ? "الخطر" : "RISK"}: {riskLevel} · {isAr ? "عدم الاستقرار" : "INSTABILITY"}: {instabilityScore}/100
              </div>
              <div className="doc-metrics">
                <div className="doc-metric-box">
                  <span className="metric-label">{isAr ? "مستوى التهديد" : "THREAT LEVEL"}</span>
                  <span className={`metric-value metric-${riskLevel === "CRITICAL" || riskLevel === "CRITICAL+" ? "critical" : riskLevel === "HIGH" ? "high" : riskLevel === "ELEVATED" ? "medium" : "low"}`}>{riskLevel}</span>
                </div>
                <div className="doc-metric-box">
                  <span className="metric-label">{isAr ? "درجة عدم الاستقرار" : "INSTABILITY"}</span>
                  <span className={`metric-value metric-${instabilityScore >= 70 ? "critical" : instabilityScore >= 50 ? "high" : instabilityScore >= 30 ? "medium" : "low"}`}>{instabilityScore}/100</span>
                </div>
                <div className="doc-metric-box">
                  <span className="metric-label">{isAr ? "أحداث نشطة" : "ACTIVE EVENTS"}</span>
                  <span className="metric-value metric-blue">{countryEvents.length}</span>
                </div>
                <div className="doc-metric-box">
                  <span className="metric-label">{isAr ? "المنطقة" : "REGION"}</span>
                  <span className="metric-value metric-blue" style={{ fontSize: "10pt" }}>{regionTag}</span>
                </div>
              </div>
              <div style={{ whiteSpace: "pre-wrap" }} className={isAr ? "arabic-text" : ""}>{fullBrief}</div>
              <div className="doc-footer">
                <span>{isAr ? "أطلس كوماند — منصة الذكاء الاستراتيجي" : "ATLAS COMMAND — AI PLANETARY DECISION INTELLIGENCE"}</span>
                <span>{new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
              </div>
              <div className="doc-classification-bottom">
                {isAr ? "سري — للاستخدام الرسمي فقط" : "CLASSIFIED — OFFICIAL USE ONLY"}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
