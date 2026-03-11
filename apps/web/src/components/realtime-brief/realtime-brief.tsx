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
    window.print();
  }, []);

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
      {/* Print version */}
      <div className="hidden print-only print-brief">
        <h1>ATLAS COMMAND — {briefTitle.toUpperCase()}</h1>
        <p>{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        {aiBrief ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{aiBrief}</div>
        ) : (
          <>
            {summary && <><h2>Global Situation Assessment</h2><p>{summary}</p></>}
            <h2>Top Risks</h2>
            {(topRisks || topEvents).map((r: any, i: number) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <strong>[{r.riskLevel || r.risk_level}]</strong> {r.title}
              </div>
            ))}
          </>
        )}
        <div className="branding">ATLAS COMMAND — AI Planetary Decision Intelligence · {new Date().toISOString()}</div>
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
            /* Standard Brief (no profile) */
            <>
              {/* Global Situation */}
              <section>
                <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                  {t("morning.globalSituation")}
                </div>
                {summary ? (
                  <div className={`text-[14px] leading-relaxed text-slate-400 ${isAr && brief?.summary_ar ? "arabic-text" : ""}`}>
                    {summary}
                  </div>
                ) : events.length > 0 ? (
                  <div className="text-[14px] leading-relaxed text-slate-400">
                    Atlas Command is tracking {events.length} active incidents across the Middle East and surrounding regions.
                    {criticalCount > 0 && ` ${criticalCount} event${criticalCount > 1 ? "s" : ""} classified as CRITICAL.`}
                    {" "}Maximum risk score observed: {topEvents[0]?.risk_score}/100.
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-slate-600">
                    {t("morning.noData")}
                  </div>
                )}
              </section>

              {/* Top Risks */}
              <section>
                <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                  {t("morning.topRisks")}
                </div>
                <div className="space-y-2">
                  {(topRisks || topEvents).map((risk: any, i: number) => {
                    const title = risk.title;
                    const level = risk.riskLevel || risk.risk_level;
                    const oneLiner = risk.oneLiner || (isAr && risk.situation_ar ? risk.situation_ar : risk.situation_en);
                    const color = RISK_COLORS[level] || "#64748b";
                    return (
                      <div
                        key={i}
                        className="border border-white/[0.04] bg-white/[0.015] p-4"
                        style={{ borderLeftWidth: 3, borderLeftColor: color }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[10px] font-semibold" style={{ color }}>
                            #{i + 1}
                          </span>
                          <span
                            className="font-mono text-[8px] font-semibold tracking-wider px-1.5 py-0.5"
                            style={{ color, backgroundColor: color + "20" }}
                          >
                            {level}
                          </span>
                          <span className="text-[13px] font-medium text-slate-200">{title}</span>
                        </div>
                        <div className={`text-[12px] leading-relaxed text-slate-500 line-clamp-2 ${isAr && risk.situation_ar ? "arabic-text" : ""}`}>
                          {typeof oneLiner === "string" ? oneLiner.slice(0, 200) : ""}
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
                    {t("morning.energyMarkets")}
                  </div>
                  <div className={`text-[14px] leading-relaxed text-slate-400 ${isAr && brief?.financial_outlook_ar ? "arabic-text" : ""}`}>
                    {financial}
                  </div>
                </section>
              )}

              {/* What to Watch */}
              <section>
                <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
                  {t("morning.watchToday")}
                </div>
                <div className="space-y-1.5">
                  {topEvents.slice(0, 3).map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-[13px] text-slate-400">
                      <span className="font-mono text-atlas-accent mt-0.5">▸</span>
                      <span>
                        <strong className="text-slate-300">{e.title}</strong>
                        {" — "}
                        {isAr && e.forecast_ar ? e.forecast_ar.slice(0, 120) : e.forecast_en?.slice(0, 120)}
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
  );
}
