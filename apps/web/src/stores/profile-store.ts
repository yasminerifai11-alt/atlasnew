import { create } from "zustand";

export type ProfileRole =
  | "government"
  | "energy"
  | "finance"
  | "logistics"
  | "security"
  | "research";

export const ROLE_META: Record<ProfileRole, { icon: string; label: string; labelAr: string; sectors: string[] }> = {
  government: { icon: "🏛", label: "Government & Ministry", labelAr: "حكومة ووزارات", sectors: ["SECURITY", "DIPLOMATIC"] },
  energy: { icon: "⚡", label: "Energy & Oil & Gas", labelAr: "طاقة ونفط وغاز", sectors: ["ENERGY"] },
  finance: { icon: "📊", label: "Finance & Investment", labelAr: "مالية واستثمار", sectors: ["FINANCIAL", "MARKETS"] },
  logistics: { icon: "🚢", label: "Logistics & Shipping", labelAr: "لوجستيات وشحن", sectors: ["MARITIME", "AVIATION", "LOGISTICS"] },
  security: { icon: "🛡", label: "Security & Defense", labelAr: "أمن ودفاع", sectors: ["SECURITY", "CYBER", "MILITARY"] },
  research: { icon: "🔬", label: "Research & Media", labelAr: "بحوث وإعلام", sectors: [] },
};

export const PROFILE_REGIONS = [
  { key: "Kuwait", labelAr: "الكويت" },
  { key: "Saudi Arabia", labelAr: "السعودية" },
  { key: "UAE", labelAr: "الإمارات" },
  { key: "Qatar", labelAr: "قطر" },
  { key: "Bahrain", labelAr: "البحرين" },
  { key: "Oman", labelAr: "عُمان" },
  { key: "Iraq", labelAr: "العراق" },
  { key: "All GCC", labelAr: "كل دول التعاون" },
  { key: "Global", labelAr: "عالمي" },
] as const;

export interface CommandProfile {
  role: ProfileRole;
  region: string;
  watchlist: string;
  createdAt: string;
}

interface ProfileState {
  profile: CommandProfile | null;
  promptDismissed: boolean;
  modalOpen: boolean;
  /** Increments each time modal opens — used as React key to force fresh state */
  modalGeneration: number;
  setProfile: (profile: CommandProfile) => void;
  clearProfile: () => void;
  dismissPrompt: () => void;
  openModal: () => void;
  closeModal: () => void;
  setModalOpen: (open: boolean) => void;
}

const STORAGE_KEY = "atlas-command-profile";
const DISMISSED_KEY = "atlas-profile-prompt-dismissed";

function loadProfile(): CommandProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DISMISSED_KEY) === "1";
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: loadProfile(),
  promptDismissed: loadDismissed(),
  modalOpen: false,
  modalGeneration: 0,

  // Save profile WITHOUT closing modal — modal controls its own lifecycle
  setProfile: (profile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    set({ profile, promptDismissed: true });
  },

  clearProfile: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ profile: null });
  },

  dismissPrompt: () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    set({ promptDismissed: true });
  },

  openModal: () => set((s) => ({ modalOpen: true, modalGeneration: s.modalGeneration + 1 })),
  closeModal: () => set({ modalOpen: false }),

  // Legacy compat — used by command-center.tsx escape handler
  setModalOpen: (open) => set((s) => ({
    modalOpen: open,
    ...(open ? { modalGeneration: s.modalGeneration + 1 } : {}),
  })),
}));
