"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore, ROLE_META } from "@/stores/profile-store";
import {
  fetchEventInfra,
  fetchEventConsequences,
  generateEventBrief,
  type ApiInfraLink,
  type ApiConsequenceStep,
} from "@/lib/api";

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const DOMAIN_COLORS: Record<string, string> = {
  ENERGY: "#f59e0b",
  MARKETS: "#3b82f6",
  TRADE: "#22c55e",
  SECURITY: "#ef4444",
  DIPLOMATIC: "#8b5cf6",
  HUMANITARIAN: "#ec4899",
};

export function DetailPanel() {
  const { t, lang } = useLanguage();
  const selectedEvent = useCommandStore((s) => s.selectedEvent);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const [infra, setInfra] = useState<ApiInfraLink[]>([]);
  const [consequences, setConsequences] = useState<ApiConsequenceStep[]>([]);
  const [briefLoading, setBriefLoading] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const event = selectedEvent;

  // Load infra and consequences when event selected
  useEffect(() => {
    if (!event) return;
    fetchEventInfra(event.id).then(setInfra).catch(() => setInfra([]));
    fetchEventConsequences(event.id).then(setConsequences).catch(() => setConsequences([]));
  }, [event]);

  const handleGenerateBrief = useCallback(async () => {
    if (!event) return;
    setBriefLoading(true);
    try {
      await generateEventBrief(event.id, lang);
    } catch {
      // Brief generation attempted
    }
    setBriefLoading(false);
  }, [event, lang]);

  const handlePrint = useCallback(() => {
    if (!event) return;
    const isArabic = lang === "ar";
    const sit = isArabic && event.situation_ar ? event.situation_ar : event.situation_en;
    const whyM = isArabic && event.why_matters_ar ? event.why_matters_ar : event.why_matters_en;
    const fore = isArabic && event.forecast_ar ? event.forecast_ar : event.forecast_en;
    const acts = isArabic && event.actions_ar?.length ? event.actions_ar : event.actions_en;
    const fin = isArabic && event.financial_impact_ar ? event.financial_impact_ar : event.financial_impact_en;
    const reg = isArabic && event.region_impact_ar ? event.region_impact_ar : event.region_impact_en;
    const rc = RISK_COLORS[event.risk_level] || "#3b82f6";

    const DOMAIN_CLR: Record<string, string> = {
      ENERGY: "#ea580c", MARKETS: "#16a34a", SECURITY: "#dc2626",
      TRADE: "#3b82f6", DIPLOMATIC: "#7c3aed", HUMANITARIAN: "#6b7280",
    };

    const actionsHtml = (acts || []).map((a, i) =>
      `<div style="display:flex;gap:10px;padding:8px 12px;border-left:3px solid #3b82f6;margin-bottom:4px;">
        <span style="color:#3b82f6;font-family:'IBM Plex Mono',monospace;font-weight:600;min-width:20px;">${String(i + 1).padStart(2, "0")}</span>
        <span style="color:#e5e7eb;font-size:12px;line-height:1.6;">${a}</span>
      </div>`
    ).join("");

    const consequenceHtml = consequences.map((c) => {
      const dc = DOMAIN_CLR[c.domain] || "#6b7280";
      return `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #1e2530;">
        <div style="border-left:3px solid ${dc};padding-left:10px;flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:${dc};font-weight:600;">STEP ${c.step_number} · ${c.domain}</span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;">${c.timeframe} · P: ${c.probability}%</span>
          </div>
          <div style="color:#e5e7eb;font-size:12px;line-height:1.6;${isArabic && c.consequence_ar ? "direction:rtl;text-align:right;" : ""}">${isArabic && c.consequence_ar ? c.consequence_ar : c.consequence_en}</div>
        </div>
      </div>`;
    }).join("");

    const infraHtml = infra.length > 0 ? infra.map((inf) => {
      const dc = inf.distance_km < 10 ? "#dc2626" : inf.distance_km < 30 ? "#ea580c" : "#ca8a04";
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e2530;">
        <span style="color:#e5e7eb;font-size:12px;">${inf.name} <span style="color:#6b7280;font-size:10px;">(${inf.infra_type})</span></span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:${dc};font-weight:600;">${inf.distance_km.toFixed(1)} km</span>
      </div>`;
    }).join("") : "";

    const section = (num: string, label: string, content: string, rtl = false) =>
      `<div style="margin-bottom:24px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #1e2530;padding-bottom:6px;margin-bottom:10px;">${num} ${label}</div>
        <div style="font-size:12px;line-height:1.8;color:#e5e7eb;${rtl ? "direction:rtl;text-align:right;font-family:'Noto Sans Arabic','IBM Plex Sans',sans-serif;" : ""}">${content}</div>
      </div>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html>
<html lang="${isArabic ? "ar" : "en"}" dir="${isArabic ? "rtl" : "ltr"}">
<head>
<title>Atlas Command — Intel Brief — ${event.title}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  @page { size:A4; margin:20mm 25mm; }
  body { background:#0a0e1a; color:#e5e7eb; font-family:'IBM Plex Sans',sans-serif; font-size:12px; line-height:1.6; padding:40px; }
</style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;margin-bottom:0;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:white;letter-spacing:3px;font-weight:600;">ATLAS COMMAND</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#6b7280;text-align:right;">
      INTELLIGENCE BRIEF<br>${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC
    </div>
  </div>
  <div style="height:1px;background:#3b82f6;margin-bottom:16px;"></div>

  <!-- Classification bar -->
  <div style="background:${rc};padding:6px 12px;margin-bottom:20px;">
    <span style="font-family:'IBM Plex Mono',monospace;color:white;font-weight:700;font-size:10px;letter-spacing:1px;">${event.risk_level} — RISK SCORE: ${event.risk_score}/100 — CONFIDENCE: ${event.confidence_score}%</span>
  </div>

  <!-- Title -->
  <div style="margin-bottom:24px;">
    <div style="font-size:22px;font-weight:600;color:white;line-height:1.3;margin-bottom:6px;${isArabic ? "direction:rtl;text-align:right;font-family:'Noto Sans Arabic','IBM Plex Sans',sans-serif;" : ""}">${event.title}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;">${event.region} · ${event.sector} · ${new Date(event.event_time).toUTCString()}</div>
  </div>

  ${section("01", isArabic ? "تقييم الموقف" : "SITUATION", sit, isArabic)}
  ${section("02", isArabic ? "لماذا يهم" : "WHY IT MATTERS", whyM, isArabic)}
  ${section("03", isArabic ? "التوقعات" : "FORECAST", fore, isArabic)}

  <div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #1e2530;padding-bottom:6px;margin-bottom:10px;">04 ${isArabic ? "إجراءات القيادة" : "COMMAND ACTIONS"}</div>
    ${actionsHtml}
  </div>

  ${reg ? section("05", isArabic ? "التأثير الإقليمي الخليجي" : "GCC REGIONAL IMPACT", reg, isArabic) : ""}
  ${fin ? section("06", isArabic ? "التأثير المالي" : "FINANCIAL IMPACT", fin, isArabic) : ""}

  ${consequences.length > 0 ? `<div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #1e2530;padding-bottom:6px;margin-bottom:10px;">07 ${isArabic ? "سلسلة التبعات" : "CONSEQUENCE CHAIN"}</div>
    ${consequenceHtml}
  </div>` : ""}

  ${infraHtml ? `<div style="margin-bottom:24px;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#3b82f6;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #1e2530;padding-bottom:6px;margin-bottom:10px;">08 ${isArabic ? "تعرض البنية التحتية" : "INFRASTRUCTURE EXPOSURE"}</div>
    ${infraHtml}
  </div>` : ""}

  <!-- Footer -->
  <div style="height:1px;background:#3b82f6;margin-top:30px;margin-bottom:12px;"></div>
  <div style="display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;">
    <span>Based on ${event.source_count} sources · Confidence: ${event.confidence_score}%</span>
    <span>ATLAS COMMAND</span>
    <span>REF: AC-${String(event.id).padStart(4, "0")} · ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
  </div>
</body>
</html>`);
    w.document.close();
    setTimeout(() => w.print(), 1000);
  }, [event, lang, consequences, infra]);

  const handleClose = () => {
    setSelectedEvent(null);
    setActiveSection("situation");
  };

  if (!event) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-sm text-slate-500 mb-1">{t("intel.noData")}</div>
          <div className="font-mono text-[10px] text-slate-600">
            {t("intel.selectEvent")}
          </div>
        </div>
      </div>
    );
  }

  const riskColor = RISK_COLORS[event.risk_level] || "#3b82f6";
  const isAr = lang === "ar";
  const situation = isAr && event.situation_ar ? event.situation_ar : event.situation_en;
  const whyMatters = isAr && event.why_matters_ar ? event.why_matters_ar : event.why_matters_en;
  const forecast = isAr && event.forecast_ar ? event.forecast_ar : event.forecast_en;
  const actions = isAr && event.actions_ar?.length ? event.actions_ar : event.actions_en;
  const financialImpact = isAr && event.financial_impact_ar ? event.financial_impact_ar : event.financial_impact_en;
  const regionImpact = isAr && event.region_impact_ar ? event.region_impact_ar : event.region_impact_en;

  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-fade-in">
      {/* Print version — classified document style */}
      <div className="hidden print-only print-brief">
        <div className="doc-header">
          <div className="doc-logo">ATLAS COMMAND</div>
          <div className="doc-class">INTELLIGENCE BRIEF</div>
        </div>

        <div className="doc-title">{event.title}</div>
        <div className="doc-meta">
          {event.event_type} · {event.region} · {event.sector} · {new Date(event.event_time).toUTCString()}
        </div>

        <div className={`risk-badge-print risk-${event.risk_level.toLowerCase()}`}>
          {event.risk_level} — RISK SCORE: {event.risk_score}/100 — CONFIDENCE: {event.confidence_score}%
        </div>

        <h2>{isAr ? "تقييم الموقف" : "SITUATION ASSESSMENT"}</h2>
        <p className={isAr ? "arabic-text" : ""}>{situation}</p>

        <h2>{isAr ? "لماذا يهم" : "WHY IT MATTERS"}</h2>
        <p className={isAr ? "arabic-text" : ""}>{whyMatters}</p>

        <h2>{isAr ? "التوقعات" : "FORECAST"}</h2>
        <p className={isAr ? "arabic-text" : ""}>{forecast}</p>

        <h2>{isAr ? "إجراءات القيادة" : "COMMAND ACTIONS"}</h2>
        <ol className={isAr ? "arabic-text" : ""}>
          {actions?.map((a, i) => <li key={i}>{a}</li>)}
        </ol>

        {regionImpact && (
          <>
            <h2>{isAr ? "التأثير الإقليمي الخليجي" : "GCC REGIONAL IMPACT"}</h2>
            <p className={isAr ? "arabic-text" : ""}>{regionImpact}</p>
          </>
        )}

        {financialImpact && (
          <>
            <h2>{isAr ? "التأثير المالي" : "FINANCIAL IMPACT"}</h2>
            <p className={isAr ? "arabic-text" : ""}>{financialImpact}</p>
          </>
        )}

        {consequences.length > 0 && (
          <>
            <h2>{isAr ? "سلسلة التبعات" : "CONSEQUENCE CHAIN"}</h2>
            {consequences.map((c) => (
              <div key={c.step_number} className="consequence-step">
                <strong>Step {c.step_number} [{c.domain}]</strong> — {isAr && c.consequence_ar ? c.consequence_ar : c.consequence_en} (P: {c.probability}%, {c.timeframe})
              </div>
            ))}
          </>
        )}

        {infra.length > 0 && (
          <>
            <h2>{isAr ? "تعرض البنية التحتية" : "INFRASTRUCTURE EXPOSURE"}</h2>
            {infra.map((inf) => (
              <div key={inf.id} className="consequence-step">
                <strong>{inf.name}</strong> — {inf.infra_type} · {inf.distance_km.toFixed(1)} km · {inf.impact_type.replace(/_/g, " ")}
              </div>
            ))}
          </>
        )}

        <div className="doc-footer">
          <span>ATLAS COMMAND — AI PLANETARY DECISION INTELLIGENCE</span>
          <span>{new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</span>
          <span>REF: AC-{String(event.id).padStart(4, "0")}</span>
        </div>
      </div>

      {/* Screen version */}
      <div className="no-print flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-atlas-bg/95 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="font-mono text-[10px] tracking-wider text-slate-500 hover:text-slate-300"
            >
              ← {t("intel.close")}
            </button>
            <div className="h-4 w-px bg-white/[0.08]" />
            <span
              className="font-mono text-[10px] font-semibold tracking-wider px-2 py-0.5"
              style={{
                color: riskColor,
                backgroundColor: riskColor + "20",
                border: `1px solid ${riskColor}40`,
              }}
            >
              {event.risk_level} · {event.risk_score}
            </span>
            <div className="h-1 w-24 bg-white/[0.06]">
              <div
                className="h-full transition-all"
                style={{
                  width: `${event.confidence_score}%`,
                  backgroundColor: riskColor,
                  opacity: 0.6,
                }}
              />
            </div>
            <span className="font-mono text-[9px] text-slate-500">
              {t("event.confidence")}: {event.confidence_score}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateBrief}
              disabled={briefLoading}
              className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/10 disabled:opacity-50"
            >
              {briefLoading ? t("intel.generating") : t("intel.generateBrief")}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 font-mono text-[10px] tracking-wider text-slate-400 border border-white/[0.08] hover:border-white/[0.15]"
            >
              {t("intel.shareBrief")}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Event title */}
          <div>
            <div className="font-mono text-[10px] tracking-widest text-slate-500 mb-1">
              {event.event_type} · {event.region} · {event.source}
            </div>
            <h1 className="text-xl font-semibold text-slate-200 mb-1">{event.title}</h1>
            <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600">
              <span>{new Date(event.event_time).toUTCString()}</span>
              <span>·</span>
              <span>{event.sector}</span>
              <span>·</span>
              <span>{event.source_count} {t("event.sources").toLowerCase()}</span>
            </div>
          </div>

          {/* What This Means For You — personalised card */}
          <PersonalisedCard event={event} isAr={isAr} />

          {/* 4 Intel cards */}
          <div className="grid grid-cols-2 gap-3">
            <IntelCard
              label={t("intel.situation")}
              color="#3b82f6"
              content={situation}
              isArabic={isAr && !!event.situation_ar}
            />
            <IntelCard
              label={t("intel.whyMatters")}
              color="#f59e0b"
              content={whyMatters}
              isArabic={isAr && !!event.why_matters_ar}
            />
            <IntelCard
              label={t("intel.forecast")}
              color="#f97316"
              content={forecast}
              isArabic={isAr && !!event.forecast_ar}
            />
            <div className="intel-card" style={{ borderTop: `2px solid ${RISK_COLORS.CRITICAL}` }}>
              <div className="mb-2 font-mono text-[10px] tracking-widest text-red-400">
                {t("intel.actions")}
              </div>
              <ol className={`list-decimal space-y-1.5 pl-4 text-[13px] leading-relaxed text-slate-400 ${isAr && event.actions_ar?.length ? "arabic-text" : ""}`}>
                {actions?.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* GCC Regional Impact + Financial Impact */}
          <div className="grid grid-cols-2 gap-3">
            {regionImpact && (
              <div className="intel-card" style={{ borderTop: "2px solid #06b6d4" }}>
                <div className="mb-2 font-mono text-[10px] tracking-widest text-cyan-400">
                  {t("intel.gccImpact")}
                </div>
                <div className={`text-[13px] leading-relaxed text-slate-400 ${isAr && event.region_impact_ar ? "arabic-text" : ""}`}>
                  {regionImpact}
                </div>
              </div>
            )}
            {financialImpact && (
              <div className="intel-card" style={{ borderTop: "2px solid #22c55e" }}>
                <div className="mb-2 font-mono text-[10px] tracking-widest text-green-400">
                  {t("intel.financialImpact")}
                </div>
                <div className={`text-[13px] leading-relaxed text-slate-400 ${isAr && event.financial_impact_ar ? "arabic-text" : ""}`}>
                  {financialImpact}
                </div>
              </div>
            )}
          </div>

          {/* Infrastructure Exposure */}
          {infra.length > 0 && (
            <div>
              <div className="mb-3 font-mono text-[10px] tracking-widest text-slate-500">
                {t("intel.infraExposure")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {infra.map((inf) => {
                  const distColor =
                    inf.distance_km < 10 ? "#ef4444" : inf.distance_km < 30 ? "#f97316" : "#eab308";
                  return (
                    <div key={inf.id} className="border border-white/[0.04] bg-white/[0.015] p-3">
                      <div className="text-[12px] font-medium text-slate-300">{inf.name}</div>
                      <div className="mt-1 font-mono text-[10px] text-slate-500">{inf.infra_type}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold" style={{ color: distColor }}>
                          {inf.distance_km.toFixed(1)} {t("common.km")}
                        </span>
                        <span className="font-mono text-[8px] tracking-wider text-slate-600">
                          {inf.impact_type.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consequence Chain */}
          {consequences.length > 0 && (
            <div>
              <div className="mb-3 font-mono text-[10px] tracking-widest text-slate-500">
                {t("intel.consequenceChain")}
              </div>
              <div className="space-y-0">
                {consequences.map((step, i) => {
                  const domainColor = DOMAIN_COLORS[step.domain] || "#64748b";
                  const isArabicContent = isAr && step.consequence_ar;
                  return (
                    <div key={step.step_number} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className="flex h-7 w-7 items-center justify-center font-mono text-[10px] font-semibold"
                          style={{ backgroundColor: domainColor + "20", color: domainColor }}
                        >
                          {step.step_number}
                        </div>
                        {i < consequences.length - 1 && (
                          <div className="w-px flex-1 bg-white/[0.06]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[9px] font-semibold tracking-wider" style={{ color: domainColor }}>
                            {step.domain}
                          </span>
                          <span className="font-mono text-[9px] text-slate-600">{step.timeframe}</span>
                        </div>
                        <div className={`text-[13px] leading-relaxed text-slate-400 ${isArabicContent ? "arabic-text" : ""}`}>
                          {isArabicContent ? step.consequence_ar : step.consequence_en}
                        </div>
                        <div className="mt-1 font-mono text-[9px] text-slate-600">
                          {t("chain.probability")}: {step.probability}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources & Confidence */}
          <div>
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-slate-500 hover:text-slate-300"
            >
              <span>{sourcesOpen ? "▼" : "▶"}</span>
              {t("intel.sourcesConfidence")}
            </button>
            {sourcesOpen && (
              <div className="mt-2 border border-white/[0.04] bg-white/[0.015] p-4 animate-slide-up">
                <div className="grid grid-cols-3 gap-4 font-mono text-[11px]">
                  <div>
                    <div className="text-slate-600 text-[9px] tracking-wider mb-1">{t("intel.primarySource")}</div>
                    <div className="text-slate-300">{event.source}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 text-[9px] tracking-wider mb-1">{t("intel.corroboratingSource")}</div>
                    <div className="text-slate-300">{event.source_count}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 text-[9px] tracking-wider mb-1">{t("intel.confidenceScore")}</div>
                    <div className="text-slate-300">{event.confidence_score}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntelCard({
  label,
  color,
  content,
  isArabic,
}: {
  label: string;
  color: string;
  content: string;
  isArabic: boolean;
}) {
  return (
    <div className="intel-card" style={{ borderTop: `2px solid ${color}` }}>
      <div className="mb-2 font-mono text-[10px] tracking-widest" style={{ color }}>
        {label}
      </div>
      <div className={`text-[13px] leading-relaxed text-slate-400 ${isArabic ? "arabic-text" : ""}`}>
        {content}
      </div>
    </div>
  );
}

/**
 * Personalised "What This Means For You" card.
 * Shows only when a Command Profile is set.
 * Generates context-specific analysis via the /api/chat endpoint.
 */
function PersonalisedCard({
  event,
  isAr,
}: {
  event: { title: string; sector: string; region: string; risk_level: string; risk_score: number; situation_en: string; why_matters_en: string; situation_ar?: string; why_matters_ar?: string };
  isAr: boolean;
}) {
  const { t } = useLanguage();
  const profile = useProfileStore((s) => s.profile);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    // Reset when event changes
    setInsight(null);
    setGenerated(false);
  }, [event.title]);

  useEffect(() => {
    if (!profile || generated) return;
    setGenerated(true);
    setLoading(true);

    const roleMeta = ROLE_META[profile.role];
    const prompt = `You are Atlas Command. In 3-4 sentences, explain what this event means specifically for a ${roleMeta.label} professional focused on ${profile.region}.${profile.watchlist ? ` Their specific interests: ${profile.watchlist}.` : ""} Be direct and operational.

Event: ${event.title}
Risk: ${event.risk_level} (${event.risk_score}/100)
Sector: ${event.sector} | Region: ${event.region}
Situation: ${event.situation_en}
Why it matters: ${event.why_matters_en}

${isAr ? "Respond in Arabic." : "Respond in English."} Maximum 4 sentences, classified memo style.`;

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        events: [],
        lang: isAr ? "ar" : "en",
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.response) setInsight(data.response);
      })
      .catch(() => {
        // API not available — generate a static fallback
        const roleMeta = ROLE_META[profile.role];
        const fallback = isAr
          ? `هذا الحدث يؤثر بشكل مباشر على ${roleMeta.labelAr} في ${profile.region}. المستوى ${event.risk_level} يتطلب مراقبة فورية. قطاع ${event.sector} في منطقة ${event.region} معرض لتأثيرات متسلسلة.`
          : `This ${event.risk_level}-level event in ${event.region} directly impacts ${roleMeta.label.toLowerCase()} operations in ${profile.region}. The ${event.sector.toLowerCase()} sector disruption requires immediate monitoring. Risk score of ${event.risk_score}/100 suggests elevated operational readiness.`;
        setInsight(fallback);
      })
      .finally(() => setLoading(false));
  }, [profile, event, isAr, generated]);

  if (!profile) return null;

  const roleMeta = ROLE_META[profile.role];

  return (
    <div className="intel-card" style={{ borderTop: "2px solid #8b5cf6" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] tracking-widest text-purple-400">
          {t("intel.whatMeansForYou")}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[8px] tracking-wider text-slate-600">
          <span>{roleMeta.icon}</span>
          <span>{isAr ? roleMeta.labelAr.split(" ")[0] : profile.role.toUpperCase()}</span>
          <span>·</span>
          <span>{profile.region.toUpperCase()}</span>
        </div>
      </div>
      {loading ? (
        <div className="font-mono text-[11px] text-purple-400/60 animate-pulse">
          {t("intel.analyzingImpact")}
        </div>
      ) : insight ? (
        <div className={`text-[13px] leading-relaxed text-slate-400 ${isAr ? "arabic-text" : ""}`}>
          {insight}
        </div>
      ) : null}
    </div>
  );
}
