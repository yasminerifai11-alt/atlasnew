"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore, type Section } from "@/stores/command-store";
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
  const setProfileModalOpen = useCommandStore((s) => s.setProfileModalOpen);
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const update = () => {
      setUtcTime(new Date().toISOString().slice(11, 19) + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="no-print flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-atlas-bg-secondary">
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
              }`}
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
        <button
          onClick={() => setProfileModalOpen(true)}
          className="px-2 py-1 font-mono text-[10px] tracking-wider text-slate-500 hover:text-slate-300"
        >
          {t("nav.profile")}
        </button>

        <div className="h-4 w-px bg-white/[0.08]" />

        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-400 border border-white/[0.08] hover:border-white/[0.15] hover:text-slate-200"
        >
          {lang === "en" ? "AR عربي" : "EN"}
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
    </header>
  );
}
