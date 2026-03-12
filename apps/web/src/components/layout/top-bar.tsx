"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore, type Section } from "@/stores/command-store";
import { useProfileStore, ROLE_META } from "@/stores/profile-store";
import { PulsingDot } from "@/components/shared/pulsing-dot";

const SECTIONS: { key: Section; labelKey: string }[] = [
  { key: "situation", labelKey: "nav.situation" },
  { key: "commander", labelKey: "nav.commander" },
  { key: "realtime-brief", labelKey: "nav.morning" },
  { key: "library", labelKey: "nav.library" },
];

export function TopBar() {
  const { t, lang, toggleLanguage } = useLanguage();
  const activeSection = useCommandStore((s) => s.activeSection);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const setAlertModalOpen = useCommandStore((s) => s.setAlertModalOpen);
  const profile = useProfileStore((s) => s.profile);
  const clearProfile = useProfileStore((s) => s.clearProfile);
  const promptDismissed = useProfileStore((s) => s.promptDismissed);
  const dismissPrompt = useProfileStore((s) => s.dismissPrompt);
  const setProfileModalOpen = useProfileStore((s) => s.setModalOpen);
  const [utcTime, setUtcTime] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isAr = lang === "ar";

  useEffect(() => {
    const update = () => {
      setUtcTime(new Date().toISOString().slice(11, 19) + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const roleMeta = profile ? ROLE_META[profile.role] : null;

  return (
    <header className="no-print flex shrink-0 flex-col border-b border-white/[0.06] bg-atlas-bg-secondary">
      {/* Main nav row */}
      <div className="flex h-12 items-center justify-between">
        <div className="flex items-center gap-6 pl-5">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5" />
              <path d="M2 12h20M12 2c-3 4-3 14 0 20M12 2c3 4 3 14 0 20" stroke="#3b82f6" strokeWidth="1" />
            </svg>
            <span className="font-mono text-xs font-semibold tracking-widest text-slate-300">
              ATLAS COMMAND
            </span>
          </div>

          <div className="h-4 w-px bg-white/[0.08]" />

          <nav className="flex items-center">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`px-3 py-3.5 font-mono text-[10px] tracking-wider transition-colors ${
                  activeSection === s.key
                    ? "text-slate-200 border-b-[2px] border-atlas-accent"
                    : "text-slate-500 border-b-[2px] border-transparent hover:text-slate-400"
                } ${isAr ? "arabic-nav" : ""}`}
              >
                {t(s.labelKey as any)}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 pr-5">
          <button
            onClick={() => setAlertModalOpen(true)}
            className="px-2 py-1 font-mono text-[10px] tracking-wider text-slate-500 hover:text-slate-300"
          >
            {t("nav.alerts")}
          </button>

          {/* Profile badge with Edit/Reset or setup button */}
          {profile && roleMeta ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 border border-atlas-accent/20 bg-atlas-accent/[0.05]">
                <span className="text-[11px]">{roleMeta.icon}</span>
                <span className="font-mono text-[9px] tracking-wider text-atlas-accent">
                  {isAr ? roleMeta.labelAr.split(" ")[0] : profile.role.toUpperCase()}
                </span>
                <span className="font-mono text-[9px] text-slate-600">·</span>
                <span className="font-mono text-[9px] tracking-wider text-slate-400">
                  {profile.region.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setProfileModalOpen(true)}
                className="px-1.5 py-1 font-mono text-[8px] tracking-wider text-slate-500 hover:text-atlas-accent transition-colors"
              >
                {t("profile.edit")}
              </button>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-1.5 py-1 font-mono text-[8px] tracking-wider text-slate-600 hover:text-red-400 transition-colors"
              >
                {t("profile.reset")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setProfileModalOpen(true)}
              className="px-2 py-1 font-mono text-[10px] tracking-wider text-slate-500 hover:text-slate-300"
            >
              {t("profile.setup")}
            </button>
          )}

          <div className="h-4 w-px bg-white/[0.08]" />

          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-400 border border-white/[0.08] hover:border-white/[0.15] hover:text-slate-200"
          >
            {lang === "en" ? "عربي" : "English"}
          </button>

          <span className="font-mono text-[10px] tracking-wider text-slate-600">
            {utcTime}
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-1 border border-green-500/20 bg-green-500/[0.06]">
            <PulsingDot color="#22c55e" size={5} />
            <span className="font-mono text-[9px] tracking-wider text-green-500">
              {t("nav.live")}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle profile prompt — once per session, only if no profile */}
      {!profile && !promptDismissed && (
        <div className="flex items-center justify-between px-5 py-1.5 border-t border-atlas-accent/10 bg-atlas-accent/[0.03]">
          <button
            onClick={() => setProfileModalOpen(true)}
            className="font-mono text-[10px] tracking-wider text-atlas-accent/80 hover:text-atlas-accent transition-colors"
          >
            <span className="mr-1.5">✦</span>
            {t("profile.personalise")}
          </button>
          <button
            onClick={dismissPrompt}
            className="font-mono text-[10px] text-slate-600 hover:text-slate-400 ml-4"
          >
            ×
          </button>
        </div>
      )}
      {/* Reset confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm border border-white/[0.08] bg-[#0c0f16] p-6 shadow-2xl">
            <div className="font-mono text-sm font-semibold tracking-wider text-slate-200 mb-2">
              {t("profile.resetConfirm")}
            </div>
            <div className="font-mono text-[11px] text-slate-500 mb-5">
              {t("profile.resetDesc")}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 font-mono text-[10px] tracking-wider text-slate-500 border border-white/[0.08] hover:text-slate-300 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  clearProfile();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 font-mono text-[10px] tracking-wider text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                {t("profile.resetBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
