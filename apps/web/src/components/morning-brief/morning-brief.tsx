"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { fetchMorningBrief, generateMorningBrief, type ApiMorningBrief } from "@/lib/api";

export function MorningBrief() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const [brief, setBrief] = useState<ApiMorningBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMorningBrief()
      .then(setBrief)
      .catch(() => setError(true));
  }, []);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await generateMorningBrief();
      setBrief(result);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const isAr = lang === "ar";
  const summary = isAr && brief?.summary_ar ? brief.summary_ar : brief?.summary_en;
  const topRisks = isAr && brief?.top_risks_ar ? brief.top_risks_ar : brief?.top_risks_en;
  const financial = isAr && brief?.financial_outlook_ar ? brief.financial_outlook_ar : brief?.financial_outlook_en;

  const RISK_COLORS: Record<string, string> = {
    CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e",
  };

  // Build a brief from current events if no API brief exists
  const eventsBrief = !brief && events.length > 0;
  const topEvents = events.sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
  const criticalCount = events.filter((e) => e.risk_level === "CRITICAL").length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Print version */}
      <div className="hidden print-only print-brief">
        <h1>ATLAS COMMAND — REALTIME INTELLIGENCE BRIEF</h1>
        <p>{new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        {summary && (
          <>
            <h2>Global Situation Assessment</h2>
            <p className={isAr ? "arabic-text" : ""}>{summary}</p>
          </>
        )}
        <h2>Top Risks</h2>
        {(topRisks || topEvents).map((r: any, i: number) => (
          <div key={i} style={{ marginBottom: "8px" }}>
            <strong>[{r.riskLevel || r.risk_level}]</strong> {r.title} — {r.oneLiner || r.situation_en?.slice(0, 100)}
          </div>
        ))}
        {financial && <><h2>Energy & Markets Outlook</h2><p className={isAr ? "arabic-text" : ""}>{financial}</p></>}
        <div className="branding">ATLAS COMMAND — AI Planetary Decision Intelligence · {new Date().toISOString()}</div>
      </div>

      {/* Screen version */}
      <div className="no-print flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3">
          <div>
            <div className="font-mono text-sm font-semibold tracking-wider text-slate-200">
              {t("morning.title")}
            </div>
            <div className="font-mono text-[9px] tracking-widest text-slate-600">
              {t("morning.subtitle")} · {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/10 disabled:opacity-50"
            >
              {loading ? t("morning.generating") : t("morning.generate")}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-slate-400 border border-white/[0.08] hover:border-white/[0.15]"
            >
              {t("morning.downloadPdf")}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Global Situation */}
          <section>
            <div className="font-mono text-[10px] tracking-widest text-atlas-accent mb-3">
              {t("morning.globalSituation")}
            </div>
            {summary ? (
              <div className={`text-[14px] leading-relaxed text-slate-400 ${isAr && brief?.summary_ar ? "arabic-text" : ""}`}>
                {summary}
              </div>
            ) : eventsBrief ? (
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

          {/* Footer */}
          <div className="border-t border-white/[0.06] pt-4 font-mono text-[9px] text-slate-600 tracking-wider">
            ATLAS COMMAND — AI PLANETARY DECISION INTELLIGENCE ·{" "}
            {new Date().toISOString()}
          </div>
        </div>
      </div>
    </div>
  );
}
