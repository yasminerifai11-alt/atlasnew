import { create } from "zustand";
import type { ApiEvent, ApiInfraLink, ApiConsequenceStep, ApiAlert } from "@/lib/api";

export type Section =
  | "situation"
  | "intel"
  | "commander"
  | "morning-brief"
  | "library";

export type RiskFilter = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface CommandState {
  // Navigation
  activeSection: Section;
  setActiveSection: (section: Section) => void;

  // Events
  events: ApiEvent[];
  setEvents: (events: ApiEvent[]) => void;
  eventsLoading: boolean;
  setEventsLoading: (loading: boolean) => void;

  // Selected event (Intel Brief)
  selectedEvent: ApiEvent | null;
  setSelectedEvent: (event: ApiEvent | null) => void;
  selectedEventInfra: ApiInfraLink[];
  setSelectedEventInfra: (infra: ApiInfraLink[]) => void;
  selectedEventConsequences: ApiConsequenceStep[];
  setSelectedEventConsequences: (consequences: ApiConsequenceStep[]) => void;
  briefLoading: boolean;
  setBriefLoading: (loading: boolean) => void;

  // Filters
  riskFilter: RiskFilter;
  setRiskFilter: (level: RiskFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sectorFilter: string;
  setSectorFilter: (sector: string) => void;
  regionFilter: string;
  setRegionFilter: (region: string) => void;

  // Chat (Atlas Commander)
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChat: () => void;
  chatLoading: boolean;
  setChatLoading: (loading: boolean) => void;

  // Alerts
  alerts: ApiAlert[];
  setAlerts: (alerts: ApiAlert[]) => void;

  // Modals
  alertModalOpen: boolean;
  setAlertModalOpen: (open: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;

  // User session
  sessionId: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useCommandStore = create<CommandState>((set) => ({
  // Navigation
  activeSection: "situation",
  setActiveSection: (activeSection) => set({ activeSection }),

  // Events
  events: [],
  setEvents: (events) => set({ events }),
  eventsLoading: false,
  setEventsLoading: (eventsLoading) => set({ eventsLoading }),

  // Selected event
  selectedEvent: null,
  setSelectedEvent: (selectedEvent) =>
    set({
      selectedEvent,
      selectedEventInfra: [],
      selectedEventConsequences: [],
    }),
  selectedEventInfra: [],
  setSelectedEventInfra: (selectedEventInfra) => set({ selectedEventInfra }),
  selectedEventConsequences: [],
  setSelectedEventConsequences: (selectedEventConsequences) =>
    set({ selectedEventConsequences }),
  briefLoading: false,
  setBriefLoading: (briefLoading) => set({ briefLoading }),

  // Filters
  riskFilter: "ALL",
  setRiskFilter: (riskFilter) => set({ riskFilter }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  sectorFilter: "ALL",
  setSectorFilter: (sectorFilter) => set({ sectorFilter }),
  regionFilter: "ALL",
  setRegionFilter: (regionFilter) => set({ regionFilter }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { ...msg, id: generateId(), timestamp: Date.now() },
      ],
    })),
  clearChat: () => set({ chatMessages: [] }),
  chatLoading: false,
  setChatLoading: (chatLoading) => set({ chatLoading }),

  // Alerts
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),

  // Modals
  alertModalOpen: false,
  setAlertModalOpen: (alertModalOpen) => set({ alertModalOpen }),
  profileModalOpen: false,
  setProfileModalOpen: (profileModalOpen) => set({ profileModalOpen }),

  // User session
  sessionId: "atlas-default",
}));
