"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language";
import {
  useProfileStore,
  ROLE_META,
  PROFILE_REGIONS,
  type ProfileRole,
} from "@/stores/profile-store";

const STEPS = [1, 2, 3] as const;
const ROLES = Object.keys(ROLE_META) as ProfileRole[];

export function CommandProfileModal() {
  const { lang, t } = useLanguage();
  const modalOpen = useProfileStore((s) => s.modalOpen);
  const setModalOpen = useProfileStore((s) => s.setModalOpen);
  const setProfile = useProfileStore((s) => s.setProfile);
  const existingProfile = useProfileStore((s) => s.profile);

  const isEditing = !!existingProfile;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState("");
  const [complete, setComplete] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const isAr = lang === "ar";

  // Reset and pre-fill when modal opens
  if (modalOpen && !initialized) {
    setStep(1);
    setComplete(false);
    if (existingProfile) {
      setRole(existingProfile.role);
      setRegion(existingProfile.region);
      setWatchlist(existingProfile.watchlist || "");
    } else {
      setRole(null);
      setRegion(null);
      setWatchlist("");
    }
    setInitialized(true);
  }
  if (!modalOpen && initialized) {
    setInitialized(false);
  }

  const handleFinish = () => {
    if (!role || !region) return;
    setProfile({
      role,
      region,
      watchlist: watchlist.trim(),
      createdAt: new Date().toISOString(),
    });
    setComplete(true);
  };

  const handleEnter = () => {
    setComplete(false);
    setStep(1);
    setRole(null);
    setRegion(null);
    setWatchlist("");
    setModalOpen(false);
  };

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl border border-white/[0.08] bg-[#0c0f16] shadow-2xl">
        {/* Close button */}
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={handleEnter}
            className="font-mono text-[10px] text-slate-600 hover:text-slate-400"
          >
            {t("common.close")} ×
          </button>
        </div>

        {complete ? (
          /* ─── Completion Screen ─────────────────────────── */
          <div className="flex flex-col items-center justify-center px-8 pb-10 pt-4">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-green-500/30 bg-green-500/10">
              <span className="text-green-400 text-xl">✓</span>
            </div>
            <div className="font-mono text-sm font-semibold tracking-wider text-slate-200 mb-2 text-center">
              {t("profileModal.profileSet")}
            </div>
            <div className="font-mono text-[11px] text-slate-500 mb-6 text-center max-w-sm">
              {t("profileModal.speaksToYou")}
            </div>
            <div className="flex items-center gap-3 mb-6 font-mono text-[10px]">
              <span className="px-2 py-1 border border-atlas-accent/30 bg-atlas-accent/10 text-atlas-accent">
                {role && ROLE_META[role].icon} {role && (isAr ? ROLE_META[role].labelAr : ROLE_META[role].label)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="px-2 py-1 border border-white/[0.08] text-slate-400">
                {region}
              </span>
            </div>
            <button
              onClick={handleEnter}
              className="px-6 py-2.5 font-mono text-[10px] tracking-wider text-slate-200 bg-atlas-accent/20 border border-atlas-accent/30 hover:bg-atlas-accent/30 transition-colors"
            >
              {t("profileModal.enter")}
            </button>
          </div>
        ) : (
          <>
            {/* ─── Header ─────────────────────────────────── */}
            <div className="px-8 pt-2 pb-4">
              <div className="font-mono text-sm font-semibold tracking-wider text-slate-200 mb-1">
                {t("profileModal.title")}
              </div>
              <div className="font-mono text-[10px] text-slate-600">
                {t("profileModal.desc")}
              </div>
            </div>

            {/* ─── Step indicator ─────────────────────────── */}
            <div className="px-8 mb-5">
              <div className="flex items-center gap-1">
                {STEPS.map((s) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        s <= step ? "bg-atlas-accent" : "bg-white/[0.06]"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1.5 font-mono text-[8px] tracking-wider text-slate-600">
                <span className={step === 1 ? "text-atlas-accent" : ""}>
                  {t("profileModal.role")}
                </span>
                <span className={step === 2 ? "text-atlas-accent" : ""}>
                  {t("profileModal.region")}
                </span>
                <span className={step === 3 ? "text-atlas-accent" : ""}>
                  {t("profileModal.watchlist")}
                </span>
              </div>
            </div>

            {/* ─── Step Content ───────────────────────────── */}
            <div className="px-8 pb-6 min-h-[280px]">
              {step === 1 && (
                <div>
                  <div className="font-mono text-[11px] text-slate-400 mb-4">
                    {t("profileModal.howUse")}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => {
                      const meta = ROLE_META[r];
                      const selected = role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`flex items-start gap-3 p-4 border transition-colors text-left ${
                            selected
                              ? "border-atlas-accent/40 bg-atlas-accent/[0.08]"
                              : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]"
                          }`}
                        >
                          <span className="text-xl mt-0.5">{meta.icon}</span>
                          <div>
                            <div className={`text-[12px] font-medium ${selected ? "text-atlas-accent" : "text-slate-300"}`}>
                              {isAr ? meta.labelAr : meta.label}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="font-mono text-[11px] text-slate-400 mb-4">
                    {t("profileModal.primaryRegion")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PROFILE_REGIONS.map((r) => {
                      const selected = region === r.key;
                      return (
                        <button
                          key={r.key}
                          onClick={() => setRegion(r.key)}
                          className={`px-4 py-2.5 font-mono text-[11px] tracking-wider border transition-colors ${
                            selected
                              ? "border-atlas-accent/40 bg-atlas-accent/[0.08] text-atlas-accent"
                              : "border-white/[0.06] text-slate-400 hover:border-white/[0.12] hover:text-slate-300"
                          }`}
                        >
                          {isAr ? r.labelAr : r.key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-[11px] text-slate-400">
                      {t("profileModal.anythingWatch")}
                    </div>
                    {watchlist && (
                      <button
                        onClick={() => setWatchlist("")}
                        className="font-mono text-[9px] text-slate-600 hover:text-red-400 transition-colors"
                      >
                        {t("profileModal.clear")}
                      </button>
                    )}
                  </div>
                  <div className="font-mono text-[9px] text-slate-600 mb-4">
                    {t("profileModal.optional")}
                  </div>
                  <textarea
                    value={watchlist}
                    onChange={(e) => setWatchlist(e.target.value)}
                    placeholder={t("profileModal.placeholder")}
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-[13px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30 resize-none font-mono"
                  />
                </div>
              )}
            </div>

            {/* ─── Navigation Buttons ─────────────────────── */}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-8 py-4">
              <button
                onClick={() => setStep(Math.max(1, step - 1) as 1 | 2 | 3)}
                className={`font-mono text-[10px] tracking-wider text-slate-500 hover:text-slate-300 ${
                  step === 1 ? "invisible" : ""
                }`}
              >
                ← {t("profileModal.back")}
              </button>

              {step < 3 ? (
                <button
                  onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                  disabled={(step === 1 && !role) || (step === 2 && !region)}
                  className="px-5 py-2 font-mono text-[10px] tracking-wider text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {t("profileModal.next")}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={!role || !region}
                  className="px-5 py-2 font-mono text-[10px] tracking-wider text-slate-200 bg-atlas-accent/20 border border-atlas-accent/30 hover:bg-atlas-accent/30 disabled:opacity-30 transition-colors"
                >
                  {isEditing
                    ? t("profileModal.update")
                    : t("profileModal.activate")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
