// ─── Core Enums ──────────────────────────────────────────────────────

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type EventType =
  | "STRIKE"
  | "AVIATION"
  | "MARITIME"
  | "EARTHQUAKE"
  | "CYBER"
  | "FINANCIAL";

export type Sector =
  | "ENERGY"
  | "AVIATION"
  | "MARITIME"
  | "SUPPLY CHAIN"
  | "INFRASTRUCTURE"
  | "CYBER"
  | "FINANCIAL";

export type Relevance = "direct" | "spillover" | "global";

export type ViewMode = "command" | "leader" | "country" | "daily";

export type Language = "en" | "ar";

// ─── Country ─────────────────────────────────────────────────────────

export type CountryCode = "ALL" | string; // ISO 3166-1 alpha-2 or "ALL"

export interface Country {
  code: string;
  name: string;
  nameAr?: string;
  flag: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

// ─── Event ───────────────────────────────────────────────────────────

export interface NearbyInfra {
  name: string;
  nameAr?: string;
  type: string;
  typeAr?: string;
  distance: number; // km
}

export interface AtlasEvent {
  id: number;
  title: string;
  titleAr?: string;
  eventType: EventType;
  source: string;
  eventTime: string; // ISO 8601
  latitude: number;
  longitude: number;
  severity: RiskLevel;
  confidence: number; // 0-100
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  region: string;
  regionAr?: string;
  sector: Sector;

  // Intelligence narrative — English
  whatIsHappening: string;
  whyItMatters: string;
  whatNext: string;
  actions: string[];

  // Intelligence narrative — Arabic
  whatIsHappeningAr?: string;
  whyItMattersAr?: string;
  whatNextAr?: string;
  actionsAr?: string[];

  // Infrastructure
  nearbyInfra: NearbyInfra[];

  // Added by country filtering
  relevance?: Relevance;
  spilloverReason?: string;
  spilloverReasonAr?: string;
  forCountries?: string[];
}

// ─── Country Event Mapping ───────────────────────────────────────────

export interface CountryEventMapping {
  countryCode: string;
  eventId: number;
  relevance: "direct" | "spillover";
  reason?: string;
  reasonAr?: string;
}

// ─── Leader Personas ─────────────────────────────────────────────────

export interface LeaderPersona {
  id: string;
  role: string;
  roleAr: string;
  domain: string;
  icon: string;
  color: string;
  concerns: string[];
  concernsAr: string[];
  thinkingFrame: string;
  thinkingFrameAr: string;
  sectors: Sector[];
  relatedSectors: Sector[];
}

export interface LeaderAnalysis {
  leader: LeaderPersona;
  threatLevel: RiskLevel;
  maxRisk: number;
  directEvents: AtlasEvent[];
  relatedEvents: AtlasEvent[];
  correlations: EventCorrelation[];
  recommendations: LeaderRecommendation[];
  urgencyHours: number;
}

export interface EventCorrelation {
  type: "compound" | "cascade";
  text: string;
  textAr?: string;
}

export interface LeaderRecommendation {
  priority: "IMMEDIATE" | "SHORT-TERM" | "MONITOR";
  text: string;
  textAr?: string;
}

// ─── Brief ───────────────────────────────────────────────────────────

export interface Brief {
  id: number;
  eventId?: number;
  type: "EVENT" | "DAILY" | "LEADER" | "COUNTRY";
  lang: Language;
  content: string;
  createdAt: string;
}

// ─── API Response Types ──────────────────────────────────────────────

export interface CountryProfile {
  code: string;
  name: string;
  nameAr?: string;
  flag: string;
  threatLevel: RiskLevel;
  maxRiskScore: number;
  directEvents: AtlasEvent[];
  spilloverEvents: AtlasEvent[];
  infrastructureExposure: NearbyInfra[];
  watchToday: string[];
  watchTodayAr?: string[];
}

export interface DailyBrief {
  date: string;
  overallPosture: RiskLevel;
  topRisks: AtlasEvent[];
  watchToday: string[];
  watchTodayAr?: string[];
  briefText: string;
  briefTextAr?: string;
}

// ─── Risk Color Configuration ────────────────────────────────────────

export interface RiskColorSet {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

export const RISK_COLORS: Record<RiskLevel, RiskColorSet> = {
  CRITICAL: {
    bg: "rgba(220,38,38,0.15)",
    border: "#dc2626",
    text: "#ef4444",
    dot: "#dc2626",
  },
  HIGH: {
    bg: "rgba(234,88,12,0.15)",
    border: "#ea580c",
    text: "#f97316",
    dot: "#ea580c",
  },
  MEDIUM: {
    bg: "rgba(202,138,4,0.12)",
    border: "#ca8a04",
    text: "#eab308",
    dot: "#ca8a04",
  },
  LOW: {
    bg: "rgba(22,163,74,0.12)",
    border: "#16a34a",
    text: "#22c55e",
    dot: "#16a34a",
  },
};

// ─── Sector Icons ────────────────────────────────────────────────────

export const SECTOR_ICONS: Record<Sector, string> = {
  ENERGY: "⚡",
  AVIATION: "✈",
  MARITIME: "⚓",
  "SUPPLY CHAIN": "🚢",
  INFRASTRUCTURE: "🏗",
  CYBER: "🔒",
  FINANCIAL: "📊",
};
