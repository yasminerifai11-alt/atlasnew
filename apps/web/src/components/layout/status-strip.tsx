"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { getSyncStatus } from "@/lib/api";

export function StatusStrip() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const [syncInfo, setSyncInfo] = useState({ lastSync: null as string | null, isLive: false, activeSourceCount: 0 });

  const isAr = lang === "ar";

  // Update sync status every 10 seconds
  useEffect(() => {
    const update = () => setSyncInfo(getSyncStatus());
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, []);

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
        {t("posture.incidents")}: {events.length} · {t("status.maxRisk")}: {maxRisk}
      </span>
      <span className="ml-auto font-mono text-[9px] tracking-wider text-slate-600">
        {syncInfo.isLive ? (
          <>
            {t("status.lastSync")}: {syncInfo.lastSync || "—"} · {events.length} {t("status.eventsMonitored")} · {syncInfo.activeSourceCount} {t("status.sourcesActive")}
          </>
        ) : (
          <>{t("status.unavailable")}</>
        )}
      </span>
    </div>
  );
}
