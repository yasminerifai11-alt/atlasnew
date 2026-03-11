"use client";

import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";

export function StatusStrip() {
  const { t } = useLanguage();
  const events = useCommandStore((s) => s.events);

  const criticalCount = events.filter((e) => e.risk_level === "CRITICAL").length;
  const highCount = events.filter((e) => e.risk_level === "HIGH").length;
  const maxRisk = events.length > 0 ? Math.max(...events.map((e) => e.risk_score)) : 0;

  const posture =
    criticalCount >= 2 ? "critical" : criticalCount >= 1 ? "elevated" : highCount >= 1 ? "guarded" : "nominal";

  const postureColors: Record<string, string> = {
    critical: "border-red-500/20 bg-red-500/[0.05] text-red-400",
    elevated: "border-orange-500/20 bg-orange-500/[0.05] text-orange-400",
    guarded: "border-yellow-500/20 bg-yellow-500/[0.05] text-yellow-400",
    nominal: "border-green-500/20 bg-green-500/[0.05] text-green-400",
  };

  return (
    <div className={`no-print flex shrink-0 items-center gap-4 border-b px-5 py-1.5 ${postureColors[posture]}`}>
      <span className="font-mono text-[10px] font-semibold tracking-wider">
        ▲ {t("posture.label")}: {t(`posture.${posture}` as any)}
      </span>
      <span className="font-mono text-[10px] tracking-wider text-slate-500">
        {t("posture.incidents")}: {events.length} · MAX RISK: {maxRisk}
      </span>
      <span className="ml-auto font-mono text-[9px] tracking-wider text-slate-600">
        ATLAS COMMAND © 2025 · Built for the GCC
      </span>
    </div>
  );
}
