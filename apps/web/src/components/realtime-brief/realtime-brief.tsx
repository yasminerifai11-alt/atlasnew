"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore, ROLE_META, type ProfileRole } from "@/stores/profile-store";
import { fetchRealtimeBrief, generateRealtimeBrief, type ApiRealtimeBrief } from "@/lib/api";
import { getLocalizedField, translateTag } from "@/utils/translate";

/* ─── Types ──────────────────────────────────────────────── */

interface BriefData {
  situation_now: string;
  threat_level: string;
  active_count: number;
  top_sector: string;
  anticipate: {
    h24: { text: string; probability: number };
    h48: { text: string; probability: number };
    h72: { text: string; probability: number };
    wildcard?: { text: string; probability: number };
  };
  recommendations: string[];
  regional_intel: Array<{ region: string; summary: string; risk: string }>;
  sector_intel: Array<{ sector: string; summary: string; events: number }>;
  signals_to_watch: string[];
}

/* ─── Constants ──────────────────────────────────────────── */

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
};

const POSTURE_COLORS: Record<string, { bg: string; text: string; label: string; labelAr: string }> = {
  CRITICAL: { bg: "#ef4444", text: "#fff", label: "CRITICAL", labelAr: "حرج" },
  ELEVATED: { bg: "#f97316", text: "#fff", label: "ELEVATED", labelAr: "مرتفع" },
  GUARDED: { bg: "#eab308", text: "#000", label: "GUARDED", labelAr: "متحفظ" },
  NOMINAL: { bg: "#22c55e", text: "#000", label: "NOMINAL", labelAr: "طبيعي" },
};

const AUTO_REFRESH_MS = 30 * 60 * 1000; // 30 minutes

/* ─── Component ──────────────────────────────────────────── */

export function RealtimeBrief() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const profile = useProfileStore((s) => s.profile);
  const openProfileModal = useProfileStore((s) => s.openModal);

  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [highlightedKeys, setHighlightedKeys] = useState<Set<string>>(new Set());
  const refreshTimerRef = useRef<ReturnType<typeof setInterval>>();
  const prevBriefRef = useRef<BriefData | null>(null);

  const isAr = lang === "ar";
  const topEvents = [...events].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
  const criticalCount = events.filter((e) => e.risk_level === "CRITICAL").length;
  const highCount = events.filter((e) => e.risk_level === "HIGH").length;
  const totalSources = events.reduce((sum, e) => sum + e.source_count, 0);

  const posture = criticalCount >= 2 ? "CRITICAL" : criticalCount >= 1 ? "ELEVATED" : highCount >= 1 ? "GUARDED" : "NOMINAL";
  const postureInfo = POSTURE_COLORS[posture];

  // Top sector by event count
  const sectorCounts: Record<string, number> = {};
  events.forEach((e) => { sectorCounts[e.sector] = (sectorCounts[e.sector] || 0) + 1; });
  const topSector = Object.entries(sectorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";

  /* ─── Generate Intelligence Brief ───────────────────── */

  const generateBrief = useCallback(async () => {
    if (events.length === 0) return;
    setLoading(true);

    const roleMeta = profile ? ROLE_META[profile.role] : null;
    const eventsData = topEvents
      .map((e) => `[${e.risk_level}/${e.risk_score}] ${e.title} — ${e.region} (${e.sector})\n${isAr && e.situation_ar ? e.situation_ar : e.situation_en}`)
      .join("\n\n");

    // Regional grouping
    const regionMap: Record<string, typeof events> = {};
    events.forEach((e) => { if (!regionMap[e.region]) regionMap[e.region] = []; regionMap[e.region].push(e); });
    const regionSummary = Object.entries(regionMap)
      .map(([r, evs]) => `${r}: ${evs.length} events, max risk ${Math.max(...evs.map((e) => e.risk_score))}`)
      .join("\n");

    // Sector grouping
    const sectorMap: Record<string, typeof events> = {};
    events.forEach((e) => { if (!sectorMap[e.sector]) sectorMap[e.sector] = []; sectorMap[e.sector].push(e); });
    const sectorSummary = Object.entries(sectorMap)
      .map(([s, evs]) => `${s}: ${evs.length} events, max risk ${Math.max(...evs.map((e) => e.risk_score))}`)
      .join("\n");

    const arabicRules = isAr ? `\n\nCRITICAL ARABIC RULES:
Generate in formal Modern Standard Arabic (الفصحى) suitable for Gulf government and executive audiences.
Do NOT mix English words into Arabic text or use colloquial dialect.
Use proper Arabic equivalents: Cyberattack = هجوم إلكتروني, Infrastructure = بنية تحتية, Geopolitical = جيوسياسي, Sanctions = عقوبات, Escalation = تصعيد, Intelligence = استخبارات, Strike = ضربة عسكرية, Drone = طائرة مسيّرة, Missile = صاروخ, Pipeline = خط أنابيب, Tanker = ناقلة نفط, Refinery = مصفاة نفط, Supply chain = سلسلة الإمداد.
Sentence structure must be natural Arabic, not translated English.` : "";

    const prompt = isAr
      ? `أنت Atlas Command، منصة استخبارات القرار الكوني.
أنشئ نشرة استخباراتية منظمة بصيغة JSON. يجب أن تكون جميع القيم النصية بالعربية الفصحى.
${arabicRules}

التاريخ: ${new Date().toISOString().slice(0, 10)}
إجمالي الأحداث النشطة: ${events.length}
حرج: ${criticalCount}، مرتفع: ${highCount}
مصادر المراقبة: ${totalSources}
${profile ? `دور المستخدم: ${roleMeta?.label}، يركز على ${profile.region}.` : ""}

أبرز الأحداث حسب الخطر:
${eventsData}

التوزيع الإقليمي:
${regionSummary}

التوزيع القطاعي:
${sectorSummary}

أعد فقط JSON صالح بهذا الهيكل بالضبط. جميع النصوص يجب أن تكون بالعربية:
{
  "situation_now": "٣-٤ جمل تلخص الموقف الحالي. أسلوب مذكرات سرية. أشر لأحداث محددة وتداعياتها.",
  "threat_level": "${posture}",
  "active_count": ${events.length},
  "top_sector": "${topSector}",
  "anticipate": {
    "h24": { "text": "ما نتوقعه خلال ٢٤ ساعة — محدد وليس عاماً", "probability": 75 },
    "h48": { "text": "ما نتوقعه خلال ٢٤-٤٨ ساعة", "probability": 60 },
    "h72": { "text": "ما نتوقعه خلال ٤٨-٧٢ ساعة", "probability": 45 },
    "wildcard": { "text": "سيناريو منخفض الاحتمال عالي التأثير", "probability": 15 }
  },
  "recommendations": [
    "٥ توصيات عملية محددة بالعربية",
    "كل توصية قابلة للتنفيذ ومباشرة",
    "أشر لأحداث أو مناطق محددة",
    "صمم حسب دور المستخدم إن وُجد",
    "التوصية الأخيرة نظرة استراتيجية"
  ],
  "regional_intel": [
    { "region": "اسم المنطقة", "summary": "جملتان تحليل إقليمي بالعربية", "risk": "CRITICAL/HIGH/MEDIUM/LOW" }
  ],
  "sector_intel": [
    { "sector": "SECTOR", "summary": "جملتان عن تأثير القطاع بالعربية", "events": 3 }
  ],
  "signals_to_watch": [
    "٥ إشارات محددة قد تغير صورة التهديد",
    "كل إشارة ملموسة وقابلة للرصد"
  ]
}`
      : `You are Atlas Command, an AI planetary decision intelligence platform.
Generate a structured intelligence brief as JSON.

Current date: ${new Date().toISOString().slice(0, 10)}
Total active events: ${events.length}
Critical: ${criticalCount}, High: ${highCount}
Total sources monitoring: ${totalSources}
${profile ? `User role: ${roleMeta?.label}, focused on ${profile.region}.` : ""}

Top events by risk:
${eventsData}

Regional breakdown:
${regionSummary}

Sector breakdown:
${sectorSummary}

Return ONLY valid JSON in this exact structure:
{
  "situation_now": "3-4 sentence synthesis of the current situation. Direct, classified memo style. Reference specific events and their implications.",
  "threat_level": "${posture}",
  "active_count": ${events.length},
  "top_sector": "${topSector}",
  "anticipate": {
    "h24": { "text": "What we expect in the next 24 hours — specific, not generic", "probability": 75 },
    "h48": { "text": "What we expect in 24-48 hours", "probability": 60 },
    "h72": { "text": "What we expect in 48-72 hours", "probability": 45 },
    "wildcard": { "text": "Low-probability high-impact scenario to watch", "probability": 15 }
  },
  "recommendations": [
    "5 specific operational recommendations",
    "Each one actionable and direct",
    "Reference specific events or regions",
    "Tailored to the user's role if profile exists",
    "Final recommendation is a strategic outlook"
  ],
  "regional_intel": [
    { "region": "Region Name", "summary": "2-sentence regional analysis", "risk": "CRITICAL/HIGH/MEDIUM/LOW" }
  ],
  "sector_intel": [
    { "sector": "SECTOR", "summary": "2-sentence sector impact", "events": 3 }
  ],
  "signals_to_watch": [
    "5 specific signals that could change the threat picture",
    "Each one concrete and monitorable"
  ]
}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          events: [],
          lang: isAr ? "ar" : "en",
          profile: profile ? { role: roleMeta?.label, region: profile.region, watchlist: profile.watchlist } : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.response) {
          try {
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]) as BriefData;
              // Highlight changes
              if (prevBriefRef.current && prevBriefRef.current.situation_now !== parsed.situation_now) {
                setHighlightedKeys(new Set(["situation"]));
                setTimeout(() => setHighlightedKeys(new Set()), 3000);
              }
              prevBriefRef.current = parsed;
              setBriefData(parsed);
              setLastGenerated(new Date().toISOString());
            }
          } catch {
            // JSON parse failed — use fallback
            buildFallbackBrief();
          }
        }
      } else {
        buildFallbackBrief();
      }
    } catch {
      buildFallbackBrief();
    }
    setLoading(false);
  }, [events, topEvents, isAr, profile, criticalCount, highCount, totalSources, posture, topSector]);

  const buildFallbackBrief = useCallback(() => {
    const regionMap: Record<string, typeof events> = {};
    events.forEach((e) => { if (!regionMap[e.region]) regionMap[e.region] = []; regionMap[e.region].push(e); });

    const sectorMap: Record<string, typeof events> = {};
    events.forEach((e) => { if (!sectorMap[e.sector]) sectorMap[e.sector] = []; sectorMap[e.sector].push(e); });

    const situationNow = isAr
      ? `Atlas Command يتتبع ${events.length} حادثة نشطة. ${criticalCount > 0 ? `${criticalCount} حدث مصنف كحرج.` : ""} أعلى درجة خطر: ${topEvents[0]?.risk_score || 0}/100. القطاعات الأكثر تأثراً: ${[...new Set(topEvents.map((e) => e.sector))].join("، ")}.`
      : `Atlas Command tracking ${events.length} active incidents. ${criticalCount > 0 ? `${criticalCount} classified CRITICAL.` : ""} Maximum risk score: ${topEvents[0]?.risk_score || 0}/100. Most affected sectors: ${[...new Set(topEvents.map((e) => e.sector))].join(", ")}.`;

    setBriefData({
      situation_now: situationNow,
      threat_level: posture,
      active_count: events.length,
      top_sector: topSector,
      anticipate: {
        h24: { text: isAr ? `مراقبة التطورات في ${topEvents[0]?.region || "المنطقة"} — احتمال تصعيد مرتفع` : `Monitor developments in ${topEvents[0]?.region || "region"} — elevated escalation probability`, probability: 70 },
        h48: { text: isAr ? "تأثيرات متتالية محتملة على أسواق الطاقة والخطوط البحرية" : "Potential cascading effects on energy markets and maritime routes", probability: 55 },
        h72: { text: isAr ? "إعادة تقييم الوضع الأمني الإقليمي بناءً على مسار الأحداث" : "Regional security posture reassessment based on event trajectory", probability: 40 },
        wildcard: { text: isAr ? "تصعيد مفاجئ قد يؤثر على البنية التحتية الحيوية" : "Sudden escalation impacting critical infrastructure", probability: 15 },
      },
      recommendations: isAr
        ? ["رفع مستوى المراقبة للأحداث المصنفة كحرجة", "تنسيق مع فرق الاستجابة في المناطق المتأثرة", "مراجعة خطط الطوارئ للبنية التحتية الحيوية", "متابعة تأثيرات الأحداث على أسواق الطاقة", "إعداد تقييم استراتيجي شامل للأسبوع القادم"]
        : ["Elevate monitoring for CRITICAL-classified events", "Coordinate with response teams in affected regions", "Review contingency plans for critical infrastructure", "Track event impact on energy markets", "Prepare comprehensive strategic assessment for coming week"],
      regional_intel: Object.entries(regionMap)
        .sort(([, a], [, b]) => Math.max(...b.map((e) => e.risk_score)) - Math.max(...a.map((e) => e.risk_score)))
        .map(([region, evs]) => ({
          region,
          summary: isAr
            ? `${evs.length} حدث نشط. أعلى خطر: ${Math.max(...evs.map((e) => e.risk_score))}/100.`
            : `${evs.length} active events. Max risk: ${Math.max(...evs.map((e) => e.risk_score))}/100.`,
          risk: evs.reduce((max, e) => (e.risk_score > (events.find((x) => x.risk_level === max)?.risk_score || 0) ? e.risk_level : max), "LOW"),
        })),
      sector_intel: Object.entries(sectorMap)
        .sort(([, a], [, b]) => b.length - a.length)
        .map(([sector, evs]) => ({
          sector,
          summary: isAr
            ? `${evs.length} حدث يؤثر على هذا القطاع.`
            : `${evs.length} events impacting this sector.`,
          events: evs.length,
        })),
      signals_to_watch: isAr
        ? ["تصريحات رسمية من قادة المنطقة", "تحركات عسكرية غير اعتيادية", "تقلبات مفاجئة في أسعار النفط", "انقطاع في الاتصالات أو الخدمات الإلكترونية", "تحذيرات أمنية جديدة من المنظمات الدولية"]
        : ["Official statements from regional leaders", "Unusual military movements", "Sudden oil price fluctuations", "Communications or cyber service disruptions", "New security advisories from international organizations"],
    });
    setLastGenerated(new Date().toISOString());
  }, [events, topEvents, isAr, criticalCount, posture, topSector]);

  // Auto-generate on mount and when language changes
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (events.length > 0 && !briefData) {
      generateBrief();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  // Regenerate when language changes
  useEffect(() => {
    if (prevLangRef.current !== lang && events.length > 0) {
      prevLangRef.current = lang;
      generateBrief();
    }
  }, [lang, events.length, generateBrief]);

  // Auto-refresh every 30 minutes
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      if (events.length > 0 && !loading) generateBrief();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(refreshTimerRef.current);
  }, [events.length, loading, generateBrief]);

  // Auto-refresh on CRITICAL/HIGH events change
  const prevCritCountRef = useRef(criticalCount);
  useEffect(() => {
    if (criticalCount > prevCritCountRef.current && briefData) {
      generateBrief();
    }
    prevCritCountRef.current = criticalCount;
  }, [criticalCount, briefData, generateBrief]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* ─── PDF Export ────────────────────────────────────── */

  const handlePrint = useCallback(() => {
    const bd = briefData;
    if (!bd) return;

    const postureC = POSTURE_COLORS[posture];
    const arFont = `font-family:'Noto Sans Arabic','IBM Plex Sans',sans-serif;direction:rtl;text-align:right;line-height:2;`;
    const textStyle = isAr ? arFont : "";

    const recsHtml = (bd.recommendations || []).map((r, i) =>
      `<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid #1e2530;">
        <span style="font-family:'IBM Plex Mono',monospace;color:#3b82f6;font-weight:600;min-width:24px;">${String(i + 1).padStart(2, "0")}</span>
        <span style="color:#e5e7eb;font-size:12px;line-height:1.6;${textStyle}">${r}</span>
      </div>`
    ).join("");

    const anticipateHtml = [
      { label: isAr ? "خلال 24 ساعة" : "NEXT 24 HOURS", data: bd.anticipate.h24 },
      { label: isAr ? "خلال 48 ساعة" : "NEXT 48 HOURS", data: bd.anticipate.h48 },
      { label: isAr ? "خلال 72 ساعة" : "NEXT 72 HOURS", data: bd.anticipate.h72 },
    ].map((a) =>
      `<div style="margin-bottom:12px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#3b82f6;letter-spacing:2px;margin-bottom:4px;">${a.label} · P: ${a.data.probability}%</div>
        <div style="font-size:12px;color:#e5e7eb;line-height:1.6;${textStyle}">${a.data.text}</div>
      </div>`
    ).join("");

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
      ${isAr ? "النشرة الاستخباراتية" : "INTELLIGENCE BRIEF"}<br>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
    </div>
  </div>
  <div style="height:1px;background:#3b82f6;margin-bottom:16px;"></div>

  <div style="background:${postureC.bg};padding:6px 12px;margin-bottom:20px;">
    <span style="font-family:'IBM Plex Mono',monospace;color:${postureC.text};font-weight:700;font-size:10px;letter-spacing:1px;">
      ${isAr ? "الوضع التهديدي" : "THREAT POSTURE"}: ${isAr ? postureC.labelAr : postureC.label} · ${events.length} ${isAr ? "حدث نشط" : "ACTIVE EVENTS"} · ${totalSources} ${isAr ? "مصدر" : "SOURCES"}
    </span>
  </div>

  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "الموقف الآن" : "THE SITUATION NOW"}</div>
    <div style="font-family:'IBM Plex Sans',sans-serif;font-size:16px;color:white;line-height:1.9;${textStyle}">${bd.situation_now}</div>
  </div>

  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "ما نتوقعه" : "WHAT WE ANTICIPATE"}</div>
    ${anticipateHtml}
  </div>

  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:3px;margin-bottom:8px;">${isAr ? "التوصيات" : "RECOMMENDATIONS"}</div>
    ${recsHtml}
  </div>

  <div style="height:1px;background:#3b82f6;margin-top:30px;margin-bottom:12px;"></div>
  <div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;">
    <span>${events.length} ${isAr ? "حدث" : "events"} · ${totalSources} ${isAr ? "مصدر" : "sources"}</span>
    <span>${isAr ? "أطلس كوماند" : "ATLAS COMMAND"}</span>
    <span>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
  </div>
</body>
</html>`);
    w.document.close();
    setTimeout(() => w.print(), 1000);
  }, [briefData, events, totalSources, isAr, posture]);

  /* ─── Render ───────────────────────────────────────── */

  const arText = isAr ? "arabic-text" : "";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">

        {/* ═══ BLOCK 1: Live Status Bar ═══ */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-white/[0.06]" style={{ background: "#080d1a" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="font-mono text-[9px] tracking-wider text-green-500">{t("nav.live")}</span>
            </div>
            <span className="font-mono text-[9px] text-slate-600">
              {t("morning.monitoring", { count: String(totalSources) })}
            </span>
            {lastGenerated && (
              <>
                <span className="text-white/[0.08]">|</span>
                <span className="font-mono text-[9px] text-slate-600">
                  {t("morning.lastUpdated")}: {new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateBrief}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider text-green-400 border border-green-500/30 hover:bg-green-500/10 disabled:opacity-50 transition-colors"
            >
              <span className={loading ? "animate-spin" : ""}>
                {loading ? "⟳" : "▶"}
              </span>
              {loading ? t("morning.regenerating") : t("morning.generate")}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-slate-400 border border-white/[0.08] hover:border-white/[0.15]"
            >
              {t("morning.downloadPdf")}
            </button>
          </div>
        </div>

        {/* ═══ BLOCK 2: THE SITUATION NOW ═══ */}
        <div className={`px-6 py-5 border-b border-white/[0.06] transition-colors ${highlightedKeys.has("situation") ? "bg-blue-500/[0.05]" : ""}`} style={{ background: highlightedKeys.has("situation") ? undefined : "#080d1a" }}>
          <div className="font-mono text-[10px] tracking-[3px] text-blue-500 mb-3">
            {t("morning.globalSituation")}
          </div>
          {loading && !briefData ? (
            <div className="py-8 text-center">
              <div className="font-mono text-[11px] text-blue-400 animate-pulse mb-2">
                {t("morning.generatingBrief")}
              </div>
              <div className="font-mono text-[9px] text-slate-600">
                {t("morning.analyzingEvents", { count: String(events.length) })}
              </div>
            </div>
          ) : (
            <div className={`text-[16px] leading-[1.9] text-white max-w-3xl ${arText}`} style={{ fontFamily: isAr ? "'Noto Sans Arabic', 'IBM Plex Sans', sans-serif" : "'IBM Plex Sans', sans-serif" }}>
              {briefData?.situation_now || t("morning.noData")}
            </div>
          )}
        </div>

        {/* ═══ BLOCK 3: Three Columns ═══ */}
        <div className="grid grid-cols-3 border-b border-white/[0.06]" style={{ background: "#080d1a" }}>
          {/* Threat Level */}
          <div className="p-5 border-r border-white/[0.06]">
            <div className="font-mono text-[9px] tracking-[3px] text-slate-600 mb-2">{t("morning.threatPosture")}</div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[11px] font-bold tracking-wider px-2.5 py-1"
                style={{ backgroundColor: postureInfo.bg, color: postureInfo.text }}
              >
                {isAr ? postureInfo.labelAr : postureInfo.label}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((level) => {
                const count = events.filter((e) => e.risk_level === level).length;
                const color = RISK_COLORS[level];
                return (
                  <div key={level} className="text-center">
                    <div className="font-mono text-lg font-bold" style={{ color }}>{count}</div>
                    <div className="font-mono text-[7px] tracking-wider text-slate-600">{t(`risk.${level.toLowerCase()}` as any)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Now */}
          <div className="p-5 border-r border-white/[0.06]">
            <div className="font-mono text-[9px] tracking-[3px] text-slate-600 mb-2">{t("morning.activeNow")}</div>
            <div className="font-mono text-3xl font-bold text-white">{events.length}</div>
            <div className="font-mono text-[9px] text-slate-600 mt-1">
              {totalSources} {isAr ? "مصدر نشط" : "sources active"}
            </div>
          </div>

          {/* Top Sector */}
          <div className="p-5">
            <div className="font-mono text-[9px] tracking-[3px] text-slate-600 mb-2">{t("morning.topSector")}</div>
            <div className="font-mono text-lg font-semibold text-white">{isAr ? (SECTOR_AR[topSector] || topSector) : topSector}</div>
            <div className="font-mono text-[9px] text-slate-600 mt-1">
              {sectorCounts[topSector] || 0} {isAr ? "حدث" : "events"}
            </div>
          </div>
        </div>

        {/* ═══ BLOCK 4: WHAT WE ANTICIPATE ═══ */}
        <div className="px-6 py-5 border-b border-white/[0.06]" style={{ background: "#0c1426" }}>
          <div className="font-mono text-[10px] tracking-[3px] text-blue-500 mb-4">{t("morning.watchToday")}</div>
          {briefData?.anticipate ? (
            <div className="grid grid-cols-3 gap-4">
              {([
                { key: "h24", label: t("morning.next24") },
                { key: "h48", label: t("morning.next48") },
                { key: "h72", label: t("morning.next72") },
              ] as const).map(({ key, label }) => {
                const item = briefData.anticipate[key];
                if (!item) return null;
                const barColor = item.probability >= 70 ? "#ef4444" : item.probability >= 50 ? "#f97316" : "#eab308";
                return (
                  <div key={key} className="border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[9px] tracking-wider text-blue-400">{label}</span>
                      <span className="font-mono text-[10px] font-bold" style={{ color: barColor }}>{item.probability}%</span>
                    </div>
                    <div className={`text-[12px] leading-relaxed text-slate-400 mb-3 ${arText}`}>{item.text}</div>
                    <div className="h-1 w-full bg-white/[0.06]">
                      <div className="h-full transition-all duration-700" style={{ width: `${item.probability}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {briefData?.anticipate?.wildcard && (
            <div className="mt-3 border border-red-500/10 bg-red-500/[0.03] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] tracking-wider text-red-400">⚠ {t("morning.wildcard")}</span>
                <span className="font-mono text-[10px] text-red-400/60">{briefData.anticipate.wildcard.probability}%</span>
              </div>
              <div className={`text-[12px] text-slate-500 ${arText}`}>{briefData.anticipate.wildcard.text}</div>
            </div>
          )}
        </div>

        {/* ═══ BLOCK 5: RECOMMENDATIONS ═══ */}
        <div className="px-6 py-5 border-b border-white/[0.06]" style={{ background: "#080d1a" }}>
          <div className="font-mono text-[10px] tracking-[3px] text-blue-500 mb-3">{t("morning.recommendations")}</div>
          {briefData?.recommendations ? (
            <div className="space-y-2 max-w-3xl">
              {briefData.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[11px] font-bold text-blue-500 mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`text-[13px] leading-relaxed text-slate-400 ${arText}`}>{rec}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* ═══ DIVIDER ═══ */}
        <div className="px-6 py-3 border-b border-blue-500/20 bg-blue-500/[0.03] text-center">
          <span className={`font-mono text-[10px] tracking-wider text-blue-400 ${arText}`}>
            {t("morning.fullDetail")}
          </span>
        </div>

        {/* ═══ DETAIL SECTIONS (Collapsible) ═══ */}
        <div style={{ background: "#080d1a" }}>

          {/* D1: Top Events */}
          <CollapsibleSection
            title={t("morning.topEvents")}
            sectionKey="topEvents"
            expanded={expandedSections.has("topEvents")}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {topEvents.map((ev, i) => {
                const color = RISK_COLORS[ev.risk_level] || "#64748b";
                const sit = isAr && ev.situation_ar ? ev.situation_ar : ev.situation_en;
                return (
                  <div key={i} className="border border-white/[0.04] bg-white/[0.015] p-4" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[10px] font-semibold" style={{ color }}>#{i + 1}</span>
                      <span className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5" style={{ color, backgroundColor: color + "20" }}>
                        {t(`risk.${ev.risk_level.toLowerCase()}` as any)} · {ev.risk_score}
                      </span>
                      <span className="text-[13px] font-medium text-slate-200">{getLocalizedField(ev, "title", lang) || ev.title}</span>
                    </div>
                    <div className={`text-[12px] leading-relaxed text-slate-500 mb-2 ${isAr && ev.situation_ar ? "arabic-text" : ""}`}>
                      {typeof sit === "string" ? sit.slice(0, 250) : ""}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[9px] text-slate-600">
                      <span>{ev.region}</span><span>·</span><span>{translateTag(ev.sector, lang)}</span><span>·</span>
                      <span>{ev.source_count} {isAr ? "مصدر" : "sources"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* D2: Regional Intelligence */}
          <CollapsibleSection
            title={t("morning.regionalIntel")}
            sectionKey="regional"
            expanded={expandedSections.has("regional")}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {(briefData?.regional_intel || []).map((ri, i) => {
                const color = RISK_COLORS[ri.risk] || "#64748b";
                return (
                  <div key={i} className="border border-white/[0.06] bg-white/[0.015] p-4" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold text-slate-200">{ri.region}</span>
                      <span className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5" style={{ color, backgroundColor: color + "15" }}>
                        {ri.risk}
                      </span>
                    </div>
                    <div className={`text-[12px] leading-relaxed text-slate-500 ${arText}`}>{ri.summary}</div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* D3: Sector Intelligence */}
          <CollapsibleSection
            title={t("morning.sectorIntel")}
            sectionKey="sector"
            expanded={expandedSections.has("sector")}
            onToggle={toggleSection}
          >
            <div className="grid grid-cols-3 gap-2">
              {(briefData?.sector_intel || []).map((si, i) => (
                <div key={i} className="border border-white/[0.04] bg-white/[0.015] p-3 text-center">
                  <div className="font-mono text-[9px] tracking-wider text-slate-500 mb-1">{translateTag(si.sector, lang)}</div>
                  <div className="font-mono text-lg font-bold text-blue-400">{si.events}</div>
                  <div className={`text-[11px] text-slate-600 mt-1 ${arText}`}>{si.summary}</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* D4: Consequence Chains */}
          <CollapsibleSection
            title={t("morning.consequenceChains")}
            sectionKey="consequences"
            expanded={expandedSections.has("consequences")}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {topEvents.slice(0, 3).map((ev, i) => {
                const color = RISK_COLORS[ev.risk_level] || "#64748b";
                return (
                  <div key={i} className="border border-white/[0.04] bg-white/[0.015] p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[9px] font-semibold" style={{ color }}>{t(`risk.${ev.risk_level.toLowerCase()}` as any)}</span>
                      <span className="text-[12px] text-slate-300">{getLocalizedField(ev, "title", lang) || ev.title}</span>
                    </div>
                    <div className={`text-[11px] text-slate-500 ${isAr && ev.forecast_ar ? "arabic-text" : ""}`}>
                      {isAr && ev.forecast_ar ? ev.forecast_ar : ev.forecast_en}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* D5: Infrastructure Watch */}
          <CollapsibleSection
            title={t("morning.infraWatch")}
            sectionKey="infra"
            expanded={expandedSections.has("infra")}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {[...new Set(events.map((e) => e.sector))].slice(0, 5).map((sector, i) => {
                const sectorEvents = events.filter((e) => e.sector === sector);
                const maxRisk = Math.max(...sectorEvents.map((e) => e.risk_score));
                const color = RISK_COLORS[maxRisk >= 80 ? "CRITICAL" : maxRisk >= 60 ? "HIGH" : maxRisk >= 40 ? "MEDIUM" : "LOW"];
                return (
                  <div key={i} className="flex items-center justify-between border border-white/[0.04] bg-white/[0.015] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">
                        {sector === "ENERGY" ? "⚡" : sector === "MARITIME" ? "🚢" : sector === "SECURITY" ? "🛡" : sector === "FINANCIAL" ? "💰" : "🏗"}
                      </span>
                      <div>
                        <div className="text-[12px] font-medium text-slate-300">{translateTag(sector, lang)}</div>
                        <div className="font-mono text-[8px] text-slate-600">
                          {sectorEvents.length} {isAr ? "حدث" : "events"} · {isAr ? "أعلى خطر" : "MAX"} {maxRisk}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>

          {/* D6: Signals to Watch */}
          <CollapsibleSection
            title={t("morning.signalsWatch")}
            sectionKey="signals"
            expanded={expandedSections.has("signals")}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              {(briefData?.signals_to_watch || []).map((signal, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="font-mono text-[10px] font-bold text-blue-400 mt-0.5">{i + 1}.</span>
                  <span className={`text-[12px] leading-relaxed text-slate-400 ${arText}`}>{signal}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* D7: Source Intelligence */}
          <CollapsibleSection
            title={t("morning.sourceIntel")}
            sectionKey="sources"
            expanded={expandedSections.has("sources")}
            onToggle={toggleSection}
          >
            <div className="grid grid-cols-3 gap-4 font-mono text-[11px]">
              <div>
                <div className="text-slate-600 text-[9px] tracking-wider mb-1">{isAr ? "إجمالي المصادر" : "TOTAL SOURCES"}</div>
                <div className="text-slate-300">{totalSources}</div>
              </div>
              <div>
                <div className="text-slate-600 text-[9px] tracking-wider mb-1">{isAr ? "الأحداث النشطة" : "ACTIVE EVENTS"}</div>
                <div className="text-slate-300">{events.length}</div>
              </div>
              <div>
                <div className="text-slate-600 text-[9px] tracking-wider mb-1">{isAr ? "آخر تحديث" : "LAST UPDATE"}</div>
                <div className="text-slate-300">
                  {lastGenerated ? new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"} UTC
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] font-mono text-[9px] text-slate-600 tracking-wider" style={{ background: "#080d1a" }}>
          {isAr
            ? `بناءً على ${events.length} حدث نشط · ${totalSources} مصدر مراقب · ${lastGenerated ? `آخر تحديث ${new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC` : ""} · Atlas Command`
            : `Based on ${events.length} active events · ${totalSources} sources monitored · ${lastGenerated ? `Updated ${new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC` : ""} · Atlas Command`}
        </div>
      </div>
    </div>
  );
}

/* ─── Collapsible Section ────────────────────────────── */

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
      >
        <span>{expanded ? "▼" : "▶"} {title}</span>
      </button>
      {expanded && (
        <div className="px-6 pb-4 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}
