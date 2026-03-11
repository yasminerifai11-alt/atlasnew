"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore, ROLE_META, type ProfileRole } from "@/stores/profile-store";
import { fetchRealtimeBrief, generateRealtimeBrief, type ApiRealtimeBrief } from "@/lib/api";

/** Next scheduled generation: 07:00 Gulf Standard Time (03:00 UTC) */
function getNextScheduledTime(): string {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(3, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(11, 16) + " UTC (07:00 GST)";
}

const ROLE_TITLES: Record<ProfileRole, { en: (region: string) => string; ar: (region: string) => string }> = {
  government: {
    en: (r) => `Your ${r} Security & Geopolitical Brief`,
    ar: (r) => `إحاطتك الأمنية والجيوسياسية — ${r}`,
  },
  energy: {
    en: () => "Your Gulf Energy & Infrastructure Brief",
    ar: () => "إحاطتك لقطاع الطاقة والبنية التحتية الخليجية",
  },
  finance: {
    en: () => "Your GCC Financial Intelligence Brief",
    ar: () => "إحاطتك المالية الاستخباراتية لدول التعاون",
  },
  logistics: {
    en: () => "Your Maritime & Supply Chain Brief",
    ar: () => "إحاطتك البحرية وسلاسل الإمداد",
  },
  security: {
    en: () => "Your Regional Security Posture Brief",
    ar: () => "إحاطتك للوضع الأمني الإقليمي",
  },
  research: {
    en: () => "Your Global Intelligence Brief",
    ar: () => "إحاطتك الاستخباراتية العالمية",
  },
};

const ROLE_STRUCTURES: Record<ProfileRole, { en: string[]; ar: string[] }> = {
  government: {
    en: ["Security Posture Today", "Top Events Affecting Your Region", "Diplomatic & Political Signals", "Economic Stability Signals", "What Leadership Should Focus On", "Recommended Actions"],
    ar: ["الوضع الأمني اليوم", "أبرز الأحداث المؤثرة على منطقتك", "إشارات دبلوماسية وسياسية", "إشارات الاستقرار الاقتصادي", "ما يجب أن تركز عليه القيادة", "إجراءات موصى بها"],
  },
  energy: {
    en: ["Gulf Energy Supply Status", "Top Events Affecting Energy Infrastructure", "Oil Price Outlook & Brent Signals", "Maritime Routes Status", "Infrastructure Risk Summary", "Recommended Actions for Energy Operators"],
    ar: ["حالة إمداد الطاقة الخليجية", "أبرز الأحداث المؤثرة على البنية التحتية للطاقة", "توقعات أسعار النفط وإشارات برنت", "حالة الخطوط البحرية", "ملخص مخاطر البنية التحتية", "إجراءات موصى بها لمشغلي الطاقة"],
  },
  finance: {
    en: ["Market Signals — Overnight Developments", "Top Events With Financial Impact", "Oil, Currency & Commodity Outlook", "Geopolitical Risk Premium", "Sector Exposure Summary", "Recommended Risk Actions Today"],
    ar: ["إشارات السوق — التطورات الليلية", "أبرز الأحداث ذات التأثير المالي", "توقعات النفط والعملات والسلع", "علاوة المخاطر الجيوسياسية", "ملخص تعرض القطاعات", "إجراءات مخاطر موصى بها اليوم"],
  },
  logistics: {
    en: ["Route Status — Red Sea, Hormuz, Suez", "Top Events Affecting Shipping & Aviation", "Port Congestion Summary", "Freight Rate Outlook", "Aviation Corridor Status", "Recommended Operational Actions"],
    ar: ["حالة الطرق — البحر الأحمر، هرمز، السويس", "أبرز الأحداث المؤثرة على الشحن والطيران", "ملخص ازدحام الموانئ", "توقعات أسعار الشحن", "حالة ممرات الطيران", "إجراءات تشغيلية موصى بها"],
  },
  security: {
    en: ["Threat Level Assessment Today", "Active Conflicts & Escalation Signals", "Military & Airspace Activity", "Infrastructure & Cyber Threat Status", "Recommended Security Posture Actions"],
    ar: ["تقييم مستوى التهديد اليوم", "النزاعات النشطة وإشارات التصعيد", "النشاط العسكري والمجال الجوي", "حالة تهديدات البنية التحتية والسيبرانية", "إجراءات الوضع الأمني الموصى بها"],
  },
  research: {
    en: ["Global Situation Overview", "Top Events By Risk Score", "Regional Analysis", "Emerging Trends", "Intelligence Gaps", "Recommended Research Focus"],
    ar: ["نظرة عامة على الوضع العالمي", "أبرز الأحداث حسب درجة الخطر", "تحليل إقليمي", "اتجاهات ناشئة", "فجوات استخباراتية", "تركيز بحثي موصى به"],
  },
};

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e",
};

export function RealtimeBrief() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const profile = useProfileStore((s) => s.profile);
  const setProfileModalOpen = useProfileStore((s) => s.setModalOpen);
  const [brief, setBrief] = useState<ApiRealtimeBrief | null>(null);
  const [aiBrief, setAiBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const isAr = lang === "ar";
  const topEvents = [...events].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
  const criticalCount = events.filter((e) => e.risk_level === "CRITICAL").length;
  const totalSources = events.reduce((sum, e) => sum + e.source_count, 0);

  // Fetch existing brief
  useEffect(() => {
    fetchRealtimeBrief()
      .then((data) => {
        setBrief(data);
        setLastGenerated(new Date().toISOString());
      })
      .catch(() => {});
  }, []);

  // Generate personalised AI brief when profile exists and events loaded
  useEffect(() => {
    if (!profile || events.length === 0 || aiBrief) return;
    generatePersonalisedBrief();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, events.length]);

  const generatePersonalisedBrief = useCallback(async () => {
    if (!profile || events.length === 0) return;
    setAiLoading(true);

    const roleMeta = ROLE_META[profile.role];
    const structure = ROLE_STRUCTURES[profile.role];
    const structureText = (isAr ? structure.ar : structure.en).map((s, i) => `${i + 1}. ${s}`).join("\n");

    const eventsData = topEvents
      .map((e) => `[${e.risk_level}] ${e.title} — ${e.region} (Risk: ${e.risk_score}/100, Sector: ${e.sector})\nSituation: ${isAr && e.situation_ar ? e.situation_ar : e.situation_en}\nWhy it matters: ${isAr && e.why_matters_ar ? e.why_matters_ar : e.why_matters_en}`)
      .join("\n\n");

    const prompt = `You are Atlas Command, an AI planetary decision intelligence platform.
Generate a personalised realtime intelligence brief.

User profile:
- Role: ${roleMeta.label}
- Region: ${profile.region}
${profile.watchlist ? `- Specific interests: ${profile.watchlist}` : ""}

Active events today ranked by risk:
${eventsData}

Generate using this structure:
${structureText}

Rules:
- Open with: ${isAr ? "صباح الخير." : "Good morning."} [personalised intro for a ${roleMeta.label} focused on ${profile.region}]
- Every section references their specific region
- Recommended actions are specific and operational, not generic
- Maximum 600 words
- Tone: direct, classified memo style, no fluff
- Use section headers with numbers (01, 02, etc.)
- Language: ${isAr ? "Arabic" : "English"}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          events: [],
          lang: isAr ? "ar" : "en",
          profile: { role: roleMeta.label, region: profile.region, watchlist: profile.watchlist },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.response) {
          setAiBrief(data.response);
          setLastGenerated(new Date().toISOString());
        }
      }
    } catch {
      // API not available — fall through to static brief
    }
    setAiLoading(false);
  }, [profile, events, topEvents, isAr]);

  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    if (profile) {
      setAiBrief(null);
      await generatePersonalisedBrief();
    } else {
      try {
        const result = await generateRealtimeBrief();
        setBrief(result);
        setLastGenerated(new Date().toISOString());
      } catch {}
    }
    setLoading(false);
  }, [profile, generatePersonalisedBrief]);

  const handlePrint = useCallback(() => {
    const posture = criticalCount >= 2 ? "CRITICAL" : criticalCount >= 1 ? "ELEVATED" : "GUARDED";
    const postureColor = posture === "CRITICAL" ? "#dc2626" : posture === "ELEVATED" ? "#ea580c" : "#ca8a04";
    const bTitle = profile
      ? (isAr ? ROLE_TITLES[profile.role].ar(profile.region) : ROLE_TITLES[profile.role].en(profile.region))
      : (isAr ? "إحاطة الاستخبارات الآنية" : "REALTIME INTELLIGENCE BRIEF");

    const risksHtml = topEvents.map((ev, i) => {
      const c = RISK_COLORS[ev.risk_level] || "#64748b";
      const sit = isAr && ev.situation_ar ? ev.situation_ar : ev.situation_en;
      return `<div style="border-left:3px solid ${c};padding:8px 12px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:${c};font-weight:600;">#${i + 1} ${ev.risk_level} · ${ev.risk_score}</span>
        </div>
        <div style="font-size:13px;font-weight:500;color:white;margin-bottom:3px;">${ev.title}</div>
        <div style="font-size:11px;color:#94a3b8;line-height:1.6;">${(sit || "").slice(0, 200)}</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;margin-top:4px;">${ev.region} · ${ev.sector}</div>
      </div>`;
    }).join("");

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head>
<title>Atlas Command — ${bTitle}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  @page { size:A4; margin:20mm 25mm; }
  body { background:#0a0e1a; color:#e5e7eb; font-family:'IBM Plex Sans',sans-serif; font-size:12px; line-height:1.6; padding:40px; }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:white;letter-spacing:3px;font-weight:600;">ATLAS COMMAND</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#6b7280;text-align:right;">
      REALTIME INTELLIGENCE BRIEF<br>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
    </div>
  </div>
  <div style="height:1px;background:#3b82f6;margin-bottom:16px;"></div>

  <div style="background:${postureColor};padding:6px 12px;margin-bottom:20px;">
    <span style="font-family:'IBM Plex Mono',monospace;color:white;font-weight:700;font-size:10px;letter-spacing:1px;">THREAT POSTURE: ${posture} · ${events.length} ACTIVE EVENTS · ${totalSources} SOURCES</span>
  </div>

  <div style="margin-bottom:24px;">
    <div style="font-size:22px;font-weight:600;color:white;line-height:1.3;margin-bottom:6px;${isAr ? "direction:rtl;text-align:right;font-family:'Noto Sans Arabic','IBM Plex Sans',sans-serif;" : ""}">${bTitle.toUpperCase()}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;">${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}${profile ? ` · ${ROLE_META[profile.role].label} · ${profile.region}` : ""}</div>
  </div>

  ${aiBrief ? `<div style="font-size:13px;line-height:1.8;color:#e5e7eb;white-space:pre-wrap;${isAr ? "direction:rtl;text-align:right;font-family:'Noto Sans Arabic','IBM Plex Sans',sans-serif;" : ""}">${aiBrief}</div>` : `
    <div style="margin-bottom:24px;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:2px;border-bottom:1px solid #1e2530;padding-bottom:6px;margin-bottom:10px;">TOP RISKS BY SEVERITY</div>
      ${risksHtml}
    </div>
  `}

  <div style="height:1px;background:#3b82f6;margin-top:30px;margin-bottom:12px;"></div>
  <div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;">
    <span>Based on ${events.length} events · ${totalSources} sources</span>
    <span>ATLAS COMMAND</span>
    <span>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
  </div>
</body>
</html>`);
    w.document.close();
    setTimeout(() => w.print(), 1000);
  }, [events, topEvents, aiBrief, isAr, criticalCount, totalSources, profile]);

  const roleMeta = profile ? ROLE_META[profile.role] : null;
  const briefTitle = profile
    ? (isAr ? ROLE_TITLES[profile.role].ar(profile.region) : ROLE_TITLES[profile.role].en(profile.region))
    : t("morning.title");

  // Standard brief content from API
  const summary = isAr && brief?.summary_ar ? brief.summary_ar : brief?.summary_en;
  const topRisks = isAr && brief?.top_risks_ar ? brief.top_risks_ar : brief?.top_risks_en;
  const financial = isAr && brief?.financial_outlook_ar ? brief.financial_outlook_ar : brief?.financial_outlook_en;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Print version — classified document style */}
      <div className="hidden print-only print-brief">
        <div className="doc-header">
          <div className="doc-logo">ATLAS COMMAND</div>
          <div className="doc-class">{profile ? "PERSONALISED BRIEF" : "COMMANDER BRIEF"}</div>
        </div>

        <div className="doc-title">{briefTitle.toUpperCase()}</div>
        <div className="doc-meta">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" · "}THREAT POSTURE: {criticalCount >= 2 ? "CRITICAL" : criticalCount >= 1 ? "ELEVATED" : "GUARDED"}
          {" · "}{events.length} ACTIVE EVENTS · {totalSources} SOURCES
        </div>

        {aiBrief ? (
          <div style={{ whiteSpace: "pre-wrap" }} className={isAr ? "arabic-text" : ""}>{aiBrief}</div>
        ) : (
          <>
            {summary && <><h2>{isAr ? "تقييم الموقف العالمي" : "GLOBAL SITUATION ASSESSMENT"}</h2><p className={isAr && brief?.summary_ar ? "arabic-text" : ""}>{summary}</p></>}
            <h2>{isAr ? "أبرز المخاطر حسب درجة الخطر" : "TOP RISKS BY RISK SCORE"}</h2>
            {(topRisks || topEvents).map((r: any, i: number) => (
              <div key={i} className="consequence-step">
                <strong>#{i + 1} [{r.riskLevel || r.risk_level}]</strong> {r.title} — {r.region || ""} · {r.sector || ""}
              </div>
            ))}
            {financial && <><h2>{isAr ? "توقعات الطاقة والأسواق" : "ENERGY & MARKETS OUTLOOK"}</h2><p className={isAr && brief?.financial_outlook_ar ? "arabic-text" : ""}>{financial}</p></>}
          </>
        )}

        <div className="doc-footer">
          <span>ATLAS COMMAND — AI PLANETARY DECISION INTELLIGENCE</span>
          <span>{new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
          <span>REF: AC-BRIEF-{new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {/* Screen version */}
      <div className="no-print flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3">
          <div className="flex items-center gap-3">
            {profile && roleMeta && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 border border-atlas-accent/20 bg-atlas-accent/[0.05] font-mono text-[9px]">
                <span>{roleMeta.icon}</span>
                <span className="text-atlas-accent">{isAr ? roleMeta.labelAr.split(" ")[0] : profile.role.toUpperCase()}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{profile.region.toUpperCase()}</span>
              </span>
            )}
            <div>
              <div className="font-mono text-sm font-semibold tracking-wider text-slate-200">
                {briefTitle}
              </div>
              <div className="font-mono text-[9px] tracking-widest text-slate-600">
                {t("morning.subtitle")} · {new Date().toLocaleDateString("en-GB", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={() => setProfileModalOpen(true)}
                className="font-mono text-[9px] tracking-wider text-slate-600 hover:text-slate-400"
              >
                {isAr ? "تعديل الملف →" : "Edit profile →"}
              </button>
            )}
            <button
              onClick={handleRegenerate}
              disabled={loading || aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider text-green-400 border border-green-500/30 hover:bg-green-500/10 disabled:opacity-50 transition-colors"
            >
              <span className={loading || aiLoading ? "animate-spin" : ""}>
                {loading || aiLoading ? "⟳" : "▶"}
              </span>
              {loading || aiLoading
                ? (isAr ? "جاري التوليد..." : "REGENERATING...")
                : (isAr ? "توليد الآن" : "REGENERATE NOW")}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-slate-400 border border-white/[0.08] hover:border-white/[0.15]"
            >
              {t("morning.downloadPdf")}
            </button>
          </div>
        </div>

        {/* Schedule bar */}
        <div className="flex items-center justify-between border-b border-white/[0.04] bg-white/[0.01] px-6 py-1.5">
          <div className="flex items-center gap-4 font-mono text-[9px] text-slate-600">
            <span>
              {isAr ? "التوليد التلقائي:" : "AUTO-GENERATE:"}{" "}
              <span className="text-slate-500">{getNextScheduledTime()}</span>
            </span>
            {lastGenerated && (
              <>
                <span className="text-white/[0.08]">|</span>
                <span>
                  {isAr ? "آخر تحديث:" : "LAST UPDATED:"}{" "}
                  <span className="text-slate-500">
                    {new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
                  </span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-500/80">{isAr ? "مباشر" : "LIVE"}</span>
          </div>
        </div>

        {/* Profile prompt for users without profile */}
        {!profile && (
          <div className="border-b border-atlas-accent/10 bg-atlas-accent/[0.03] px-6 py-2.5">
            <button
              onClick={() => setProfileModalOpen(true)}
              className="font-mono text-[10px] tracking-wider text-atlas-accent/80 hover:text-atlas-accent transition-colors"
            >
              <span className="mr-1.5">✦</span>
              {isAr
                ? "أنشئ ملفك القيادي للحصول على إحاطة مصممة لدورك →"
                : "Set up your Command Profile for a brief tailored to your role →"}
            </button>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT COLUMN — Event feed (what's happening) */}
          <div className="w-80 shrink-0 border-r border-white/[0.06] overflow-y-auto">
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <div className="font-mono text-[9px] tracking-widest text-slate-500">
                {isAr ? "الأحداث النشطة حسب الخطورة" : "ACTIVE EVENTS BY SEVERITY"}
              </div>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {[...events].sort((a, b) => b.risk_score - a.risk_score).map((ev, i) => {
                const color = RISK_COLORS[ev.risk_level] || "#64748b";
                return (
                  <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderLeft: `3px solid ${color}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5" style={{ color, backgroundColor: color + "15" }}>
                        {ev.risk_level}
                      </span>
                      <span className="font-mono text-[8px] text-slate-600">{ev.risk_score}/100</span>
                    </div>
                    <div className="text-[12px] font-medium text-slate-300 mb-0.5 line-clamp-1">{ev.title}</div>
                    <div className="font-mono text-[9px] text-slate-600">{ev.region} · {ev.sector}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN — Commander brief with analysis & correlations */}
          <div className="flex-1 overflow-y-auto">
            <div className={`max-w-3xl mx-auto p-6 space-y-6 ${isAr && aiBrief ? "arabic-text" : ""}`}>

              {/* AI-Generated Personalised Brief */}
              {profile && (aiBrief || aiLoading) ? (
                <>
                  {aiLoading ? (
                    <div className="py-12 text-center">
                      <div className="font-mono text-[11px] text-atlas-accent animate-pulse mb-2">
                        {isAr ? "أطلس يولد إحاطتك المخصصة..." : "Atlas generating your personalised brief..."}
                      </div>
                      <div className="font-mono text-[9px] text-slate-600">
                        {isAr ? `تحليل ${events.length} حدث نشط لملفك` : `Analyzing ${events.length} active events for your profile`}
                      </div>
                    </div>
                  ) : aiBrief ? (
                    <div className="text-[14px] leading-[1.8] text-slate-400 whitespace-pre-wrap">
                      {aiBrief}
                    </div>
                  ) : null}
                </>
              ) : (
                /* Standard Commander Brief */
                <>
                  {/* Threat Posture Summary */}
                  <section>
                    <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                      01 — {isAr ? "ملخص الوضع التهديدي" : "THREAT POSTURE SUMMARY"}
                    </div>
                    <div className="border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((level) => {
                          const count = events.filter((e) => e.risk_level === level).length;
                          const color = RISK_COLORS[level];
                          return (
                            <div key={level} className="text-center">
                              <div className="font-mono text-2xl font-bold" style={{ color }}>{count}</div>
                              <div className="font-mono text-[8px] tracking-wider text-slate-600">{level}</div>
                            </div>
                          );
                        })}
                      </div>
                      {summary ? (
                        <div className={`text-[13px] leading-relaxed text-slate-400 ${isAr && brief?.summary_ar ? "arabic-text" : ""}`}>
                          {summary}
                        </div>
                      ) : events.length > 0 ? (
                        <div className="text-[13px] leading-relaxed text-slate-400">
                          {isAr
                            ? `أطلس كوماند يتتبع ${events.length} حادثة نشطة عبر الشرق الأوسط والمناطق المحيطة.${criticalCount > 0 ? ` ${criticalCount} حدث مصنف كحرج.` : ""} أعلى درجة خطر مرصودة: ${topEvents[0]?.risk_score}/100. القطاعات الأكثر تأثراً: ${[...new Set(topEvents.map(e => e.sector))].join("، ")}.`
                            : `Atlas Command is tracking ${events.length} active incidents across the Middle East and surrounding regions.${criticalCount > 0 ? ` ${criticalCount} event${criticalCount > 1 ? "s" : ""} classified as CRITICAL.` : ""} Maximum risk score observed: ${topEvents[0]?.risk_score}/100. Most affected sectors: ${[...new Set(topEvents.map(e => e.sector))].join(", ")}.`}
                        </div>
                      ) : (
                        <div className="font-mono text-[11px] text-slate-600">{t("morning.noData")}</div>
                      )}
                    </div>
                  </section>

                  {/* Regional Correlation Map */}
                  <section>
                    <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                      02 — {isAr ? "التحليل الإقليمي والترابطات" : "REGIONAL ANALYSIS & CORRELATIONS"}
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        // Group events by region and find cross-region correlations
                        const regionMap: Record<string, typeof events> = {};
                        events.forEach((e) => {
                          if (!regionMap[e.region]) regionMap[e.region] = [];
                          regionMap[e.region].push(e);
                        });
                        const regions = Object.entries(regionMap).sort(
                          ([, a], [, b]) => Math.max(...b.map((e) => e.risk_score)) - Math.max(...a.map((e) => e.risk_score))
                        );
                        return regions.map(([region, regionEvents]) => {
                          const maxRisk = Math.max(...regionEvents.map((e) => e.risk_score));
                          const maxLevel = regionEvents.reduce((max, e) => (e.risk_score > (max?.risk_score || 0) ? e : max), regionEvents[0]).risk_level;
                          const sectors = [...new Set(regionEvents.map((e) => e.sector))];
                          const color = RISK_COLORS[maxLevel] || "#64748b";
                          return (
                            <div key={region} className="border border-white/[0.06] bg-white/[0.015] p-4" style={{ borderLeft: `3px solid ${color}` }}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-semibold text-slate-200">{region}</span>
                                  <span className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5" style={{ color, backgroundColor: color + "15" }}>
                                    {maxLevel} · {maxRisk}
                                  </span>
                                </div>
                                <span className="font-mono text-[9px] text-slate-600">
                                  {regionEvents.length} {isAr ? "حدث" : "event"}{regionEvents.length > 1 && !isAr ? "s" : ""}
                                </span>
                              </div>
                              <div className="text-[12px] leading-relaxed text-slate-500 mb-2">
                                {isAr
                                  ? `المنطقة تشهد نشاطاً في قطاعات: ${sectors.join("، ")}. ${regionEvents.length > 1 ? `تتقاطع ${regionEvents.length} أحداث مما يشير إلى تصعيد محتمل.` : ""}`
                                  : `Active across ${sectors.join(", ")} sectors. ${regionEvents.length > 1 ? `${regionEvents.length} concurrent events suggest compounding risk — monitor for escalation.` : ""}`}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {regionEvents.map((e, i) => (
                                  <span key={i} className="font-mono text-[9px] px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] text-slate-500">
                                    {e.title.length > 40 ? e.title.slice(0, 40) + "…" : e.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </section>

                  {/* Sector Impact Analysis */}
                  <section>
                    <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                      03 — {isAr ? "تحليل تأثير القطاعات" : "SECTOR IMPACT ANALYSIS"}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(() => {
                        const sectorMap: Record<string, { count: number; maxRisk: number; maxLevel: string }> = {};
                        events.forEach((e) => {
                          if (!sectorMap[e.sector]) sectorMap[e.sector] = { count: 0, maxRisk: 0, maxLevel: "LOW" };
                          sectorMap[e.sector].count++;
                          if (e.risk_score > sectorMap[e.sector].maxRisk) {
                            sectorMap[e.sector].maxRisk = e.risk_score;
                            sectorMap[e.sector].maxLevel = e.risk_level;
                          }
                        });
                        return Object.entries(sectorMap)
                          .sort(([, a], [, b]) => b.maxRisk - a.maxRisk)
                          .map(([sector, data]) => {
                            const color = RISK_COLORS[data.maxLevel] || "#64748b";
                            return (
                              <div key={sector} className="border border-white/[0.04] bg-white/[0.015] p-3 text-center">
                                <div className="font-mono text-[9px] tracking-wider text-slate-500 mb-1">{sector}</div>
                                <div className="font-mono text-lg font-bold" style={{ color }}>{data.count}</div>
                                <div className="font-mono text-[8px] tracking-wider" style={{ color }}>
                                  {isAr ? "حدث" : "EVENT"}{data.count > 1 && !isAr ? "S" : ""} · MAX {data.maxRisk}
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </section>

                  {/* Top Risks — detailed */}
                  <section>
                    <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                      04 — {isAr ? "أبرز المخاطر" : "TOP RISKS — PRIORITY WATCH"}
                    </div>
                    <div className="space-y-2">
                      {topEvents.map((risk, i) => {
                        const level = risk.risk_level;
                        const oneLiner = isAr && risk.situation_ar ? risk.situation_ar : risk.situation_en;
                        const color = RISK_COLORS[level] || "#64748b";
                        return (
                          <div key={i} className="border border-white/[0.04] bg-white/[0.015] p-4" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-mono text-[10px] font-semibold" style={{ color }}>#{i + 1}</span>
                              <span className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5" style={{ color, backgroundColor: color + "20" }}>
                                {level} · {risk.risk_score}
                              </span>
                              <span className="text-[13px] font-medium text-slate-200">{risk.title}</span>
                            </div>
                            <div className={`text-[12px] leading-relaxed text-slate-500 mb-2 ${isAr && risk.situation_ar ? "arabic-text" : ""}`}>
                              {typeof oneLiner === "string" ? oneLiner.slice(0, 250) : ""}
                            </div>
                            <div className="flex items-center gap-3 font-mono text-[9px] text-slate-600">
                              <span>{risk.region}</span>
                              <span>·</span>
                              <span>{risk.sector}</span>
                              <span>·</span>
                              <span>{risk.source_count} {isAr ? "مصدر" : "sources"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Energy & Markets */}
                  {financial && (
                    <section>
                      <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                        05 — {isAr ? "توقعات الطاقة والأسواق" : "ENERGY & MARKETS OUTLOOK"}
                      </div>
                      <div className={`text-[14px] leading-relaxed text-slate-400 border border-white/[0.06] bg-white/[0.02] p-4 ${isAr && brief?.financial_outlook_ar ? "arabic-text" : ""}`}>
                        {financial}
                      </div>
                    </section>
                  )}

                  {/* Commander's Watch */}
                  <section>
                    <div className="font-mono text-[10px] tracking-widest text-red-400 mb-3">
                      {isAr ? "⚑ ما يجب مراقبته اليوم" : "⚑ COMMANDER'S WATCH — TODAY"}
                    </div>
                    <div className="border border-red-500/10 bg-red-500/[0.03] p-4 space-y-2">
                      {topEvents.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-[13px] text-slate-400">
                          <span className="font-mono text-red-400 mt-0.5 font-bold">{i + 1}.</span>
                          <span>
                            <strong className="text-slate-300">{e.title}</strong>
                            {" — "}
                            <span className="text-slate-500">
                              {isAr && e.forecast_ar ? e.forecast_ar.slice(0, 150) : e.forecast_en?.slice(0, 150)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Footer */}
              <div className="border-t border-white/[0.06] pt-4 font-mono text-[9px] text-slate-600 tracking-wider">
                {isAr
                  ? `بناءً على ${events.length} حدث نشط · ${totalSources} مصدر مراقب · تم التوليد ${lastGenerated ? new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"} UTC · أطلس كوماند`
                  : `Based on ${events.length} active events · ${totalSources} sources monitored · Generated ${lastGenerated ? new Date(lastGenerated).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--"} UTC · Atlas Command`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
