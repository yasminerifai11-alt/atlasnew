"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { saveProfile } from "@/lib/api";

const ORG_TYPES = [
  { value: "government", labelKey: "profile.government" },
  { value: "energy_company", labelKey: "profile.energyCompany" },
  { value: "financial_institution", labelKey: "profile.financial" },
  { value: "media", labelKey: "profile.media" },
];

const REGIONS = ["Gulf", "Red Sea", "Levant", "North Africa", "Central Asia", "Horn of Africa"];
const SECTORS = ["ENERGY", "MARITIME", "AVIATION", "CYBER", "INFRASTRUCTURE", "FINANCIAL"];

interface Asset {
  name: string;
  latitude: string;
  longitude: string;
  type: string;
}

export function ProfileModal() {
  const { t } = useLanguage();
  const profileModalOpen = useCommandStore((s) => s.profileModalOpen);
  const setProfileModalOpen = useCommandStore((s) => s.setProfileModalOpen);
  const sessionId = useCommandStore((s) => s.sessionId);

  const [orgType, setOrgType] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAsset, setNewAsset] = useState<Asset>({ name: "", latitude: "", longitude: "", type: "" });
  const [saving, setSaving] = useState(false);

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const toggleSector = (s: string) => {
    setSelectedSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addAsset = () => {
    if (!newAsset.name || !newAsset.latitude || !newAsset.longitude) return;
    setAssets((prev) => [...prev, newAsset]);
    setNewAsset({ name: "", latitude: "", longitude: "", type: "" });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveProfile({
        session_id: sessionId,
        organisation_type: orgType || undefined,
        focus_regions: selectedRegions,
        focus_sectors: selectedSectors,
        assets: assets.map((a) => ({
          name: a.name,
          latitude: parseFloat(a.latitude),
          longitude: parseFloat(a.longitude),
          type: a.type,
        })),
      });
      setProfileModalOpen(false);
    } catch {
      // Save failed
    }
    setSaving(false);
  }, [sessionId, orgType, selectedRegions, selectedSectors, assets, setProfileModalOpen]);

  if (!profileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto border border-white/[0.08] bg-atlas-bg-secondary">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-white/[0.06] bg-atlas-bg-secondary px-5 py-3">
          <div>
            <span className="font-mono text-xs font-semibold tracking-wider text-slate-200">
              {t("profile.title")}
            </span>
            <div className="font-mono text-[9px] text-slate-600">{t("profile.subtitle")}</div>
          </div>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="font-mono text-[10px] text-slate-500 hover:text-slate-300"
          >
            {t("common.close")}
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Organisation type */}
          <div>
            <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
              {t("profile.orgType")}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ORG_TYPES.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setOrgType(o.value)}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-wider border transition-colors ${
                    orgType === o.value
                      ? "border-atlas-accent/30 bg-atlas-accent/10 text-atlas-accent"
                      : "border-white/[0.06] text-slate-500 hover:text-slate-400"
                  }`}
                >
                  {t(o.labelKey as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Focus regions */}
          <div>
            <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
              {t("profile.regions")}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRegion(r)}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-wider border transition-colors ${
                    selectedRegions.includes(r)
                      ? "border-atlas-accent/30 bg-atlas-accent/10 text-atlas-accent"
                      : "border-white/[0.06] text-slate-500 hover:text-slate-400"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Focus sectors */}
          <div>
            <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
              {t("profile.sectors")}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSector(s)}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-wider border transition-colors ${
                    selectedSectors.includes(s)
                      ? "border-atlas-accent/30 bg-atlas-accent/10 text-atlas-accent"
                      : "border-white/[0.06] text-slate-500 hover:text-slate-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div>
            <div className="font-mono text-[9px] tracking-widest text-slate-600 mb-2">
              {t("profile.assets")}
            </div>

            {assets.length > 0 && (
              <div className="space-y-1 mb-3">
                {assets.map((a, i) => (
                  <div key={i} className="flex items-center justify-between border border-white/[0.04] bg-white/[0.015] px-3 py-2">
                    <div>
                      <div className="text-[12px] text-slate-300">{a.name}</div>
                      <div className="font-mono text-[9px] text-slate-600">
                        {a.latitude}, {a.longitude} · {a.type}
                      </div>
                    </div>
                    <button
                      onClick={() => setAssets((prev) => prev.filter((_, j) => j !== i))}
                      className="font-mono text-[9px] text-red-400/60 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) => setNewAsset((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("profile.assetName")}
                className="bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 font-mono text-[10px] text-slate-300 placeholder-slate-600 outline-none"
              />
              <input
                type="text"
                value={newAsset.latitude}
                onChange={(e) => setNewAsset((p) => ({ ...p, latitude: e.target.value }))}
                placeholder={t("profile.assetLat")}
                className="bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 font-mono text-[10px] text-slate-300 placeholder-slate-600 outline-none"
              />
              <input
                type="text"
                value={newAsset.longitude}
                onChange={(e) => setNewAsset((p) => ({ ...p, longitude: e.target.value }))}
                placeholder={t("profile.assetLng")}
                className="bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 font-mono text-[10px] text-slate-300 placeholder-slate-600 outline-none"
              />
              <button
                onClick={addAsset}
                className="font-mono text-[10px] tracking-wider text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/10"
              >
                {t("profile.addAsset")}
              </button>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 font-mono text-[10px] tracking-wider text-slate-200 bg-atlas-accent/20 border border-atlas-accent/30 hover:bg-atlas-accent/30 disabled:opacity-50"
          >
            {saving ? t("common.loading") : t("profile.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
