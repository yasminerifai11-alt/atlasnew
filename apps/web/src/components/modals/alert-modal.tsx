"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { createAlert, fetchAlerts, deleteAlert, type ApiAlert } from "@/lib/api";

const TRIGGER_TYPES = [
  { value: "REGION", labelKey: "alert.region" },
  { value: "SECTOR", labelKey: "alert.sector" },
  { value: "RISK_LEVEL", labelKey: "alert.riskLevel" },
  { value: "KEYWORD", labelKey: "alert.keyword" },
  { value: "ASSET_PROXIMITY", labelKey: "alert.assetProximity" },
];

export function AlertModal() {
  const { t } = useLanguage();
  const alertModalOpen = useCommandStore((s) => s.alertModalOpen);
  const setAlertModalOpen = useCommandStore((s) => s.setAlertModalOpen);
  const sessionId = useCommandStore((s) => s.sessionId);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("REGION");
  const [triggerValue, setTriggerValue] = useState("");

  useEffect(() => {
    if (alertModalOpen) {
      fetchAlerts(sessionId).then(setAlerts).catch(() => {});
    }
  }, [alertModalOpen, sessionId]);

  const handleCreate = useCallback(async () => {
    if (!name || !triggerValue) return;
    try {
      const alert = await createAlert({
        user_session: sessionId,
        name,
        trigger_type: triggerType,
        trigger_value: triggerValue,
      });
      setAlerts((prev) => [...prev, alert]);
      setName("");
      setTriggerValue("");
    } catch {
      // Alert creation failed
    }
  }, [name, triggerType, triggerValue, sessionId]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Delete failed
    }
  }, []);

  if (!alertModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-white/[0.08] bg-atlas-bg-secondary">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-200">
            {t("alert.title")}
          </span>
          <button
            onClick={() => setAlertModalOpen(false)}
            className="font-mono text-[10px] text-slate-500 hover:text-slate-300"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Create form */}
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("alert.name")}
              className="w-full bg-white/[0.03] border border-white/[0.06] px-3 py-2 font-mono text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30"
            />
            <div className="flex gap-2">
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] px-3 py-2 font-mono text-[11px] text-slate-300 outline-none"
              >
                {TRIGGER_TYPES.map((tt) => (
                  <option key={tt.value} value={tt.value}>
                    {t(tt.labelKey as any)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder={t("alert.triggerValue")}
                className="flex-1 bg-white/[0.03] border border-white/[0.06] px-3 py-2 font-mono text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!name || !triggerValue}
              className="w-full py-2 font-mono text-[10px] tracking-wider text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/10 disabled:opacity-30"
            >
              {t("alert.create")}
            </button>
          </div>

          {/* Active alerts */}
          {alerts.length > 0 && (
            <div>
              <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
                {t("alert.active")}
              </div>
              <div className="space-y-1">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between border border-white/[0.04] bg-white/[0.015] px-3 py-2"
                  >
                    <div>
                      <div className="text-[12px] text-slate-300">{alert.name}</div>
                      <div className="font-mono text-[9px] text-slate-600">
                        {alert.trigger_type}: {alert.trigger_value}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="font-mono text-[9px] text-red-400/60 hover:text-red-400"
                    >
                      {t("alert.delete")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
