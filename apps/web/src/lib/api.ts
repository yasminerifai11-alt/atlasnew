/**
 * Atlas Command — API Client
 * Connects to FastAPI backend at localhost:8000
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ─── Types from API ──────────────────────────────────────────────────

export interface ApiEvent {
  id: number;
  title: string;
  description: string;
  event_time: string;
  latitude: number;
  longitude: number;
  region: string;
  country: string;
  event_type: string;
  sector: string;
  source: string;
  source_count: number;
  confidence_score: number;
  severity: string;
  risk_score: number;
  risk_level: string;
  situation_en: string;
  why_matters_en: string;
  forecast_en: string;
  actions_en: string[];
  financial_impact_en?: string;
  region_impact_en?: string;
  situation_ar?: string;
  why_matters_ar?: string;
  forecast_ar?: string;
  actions_ar?: string[];
  financial_impact_ar?: string;
  region_impact_ar?: string;
}

export interface ApiInfraLink {
  id: number;
  infrastructure_id: number;
  distance_km: number;
  impact_type: string;
  impact_level: string;
  name: string;
  infra_type: string;
  country: string;
  criticality: string;
  owner?: string;
  sector: string;
}

export interface ApiConsequenceStep {
  step_number: number;
  domain: string;
  consequence_en: string;
  consequence_ar?: string;
  probability: number;
  timeframe: string;
}

export interface ApiBrief {
  situation: string;
  why_matters: string;
  forecast: string;
  actions: string[];
  financial_impact: string;
  region_impact: string;
}

export interface ApiMorningBrief {
  id: number;
  brief_date: string;
  summary_en: string;
  summary_ar?: string;
  top_risks_en: Array<{ eventId: number; title: string; riskLevel: string; oneLiner: string }>;
  top_risks_ar?: Array<{ eventId: number; title: string; riskLevel: string; oneLiner: string }>;
  financial_outlook_en?: string;
  financial_outlook_ar?: string;
}

export interface ApiAlert {
  id: number;
  user_session: string;
  name: string;
  trigger_type: string;
  trigger_value: string;
  is_active: boolean;
}

export interface ApiExposure {
  overall_threat_level: string;
  assets: Array<{
    name: string;
    latitude: number;
    longitude: number;
    type: string;
    threat_level: string;
    nearby_events: Array<{
      event_id: number;
      title: string;
      risk_level: string;
      distance_km: number;
    }>;
  }>;
}

// ─── Events ──────────────────────────────────────────────────────────

export async function fetchEvents(params?: {
  region?: string;
  sector?: string;
  risk_level?: string;
  event_type?: string;
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: ApiEvent[]; total: number }> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v));
    });
  }
  const qs = query.toString();
  return request(`/events${qs ? `?${qs}` : ""}`);
}

export async function fetchEvent(id: number): Promise<ApiEvent> {
  return request(`/events/${id}`);
}

export async function fetchEventConsequences(id: number): Promise<ApiConsequenceStep[]> {
  return request(`/events/${id}/consequences`);
}

export async function fetchEventInfra(id: number): Promise<ApiInfraLink[]> {
  return request(`/events/${id}/infra`);
}

// ─── Intelligence ────────────────────────────────────────────────────

export async function analyzeEvent(eventId: number): Promise<{
  event: ApiEvent;
  infrastructure: ApiInfraLink[];
  consequences: ApiConsequenceStep[];
}> {
  return request(`/intelligence/analyze`, {
    method: "POST",
    body: JSON.stringify({ event_id: eventId }),
  });
}

export async function fetchMorningBrief(): Promise<ApiMorningBrief> {
  return request(`/intelligence/morning-brief`);
}

export async function generateMorningBrief(): Promise<ApiMorningBrief> {
  return request(`/intelligence/morning-brief/generate`, { method: "POST" });
}

// ─── Briefs ──────────────────────────────────────────────────────────

export async function generateEventBrief(
  eventId: number,
  lang: "en" | "ar" = "en"
): Promise<ApiBrief> {
  return request(`/events/${eventId}/brief?lang=${lang}`, { method: "POST" });
}

// ─── Alerts ──────────────────────────────────────────────────────────

export async function createAlert(alert: {
  user_session: string;
  name: string;
  trigger_type: string;
  trigger_value: string;
}): Promise<ApiAlert> {
  return request(`/alerts`, { method: "POST", body: JSON.stringify(alert) });
}

export async function fetchAlerts(sessionId: string): Promise<ApiAlert[]> {
  return request(`/alerts/${sessionId}`);
}

export async function deleteAlert(id: number): Promise<void> {
  await fetch(`${API_BASE}/alerts/${id}`, { method: "DELETE" });
}

// ─── Assets ──────────────────────────────────────────────────────────

export async function saveProfile(profile: {
  session_id: string;
  organisation_type?: string;
  focus_regions?: string[];
  focus_sectors?: string[];
  assets?: Array<{ name: string; latitude: number; longitude: number; type: string }>;
}): Promise<void> {
  await request(`/assets/profile`, {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function fetchExposure(sessionId: string): Promise<ApiExposure> {
  return request(`/assets/${sessionId}/exposure`);
}

// ─── Atlas Commander (AI Chat) ───────────────────────────────────────

export async function chatWithAtlas(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  events: ApiEvent[],
  lang: "en" | "ar" = "en"
): Promise<string> {
  // This calls the Anthropic API via our backend proxy
  // For now, we'll use a direct approach through a Next.js API route
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, events, lang }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  const data = await res.json();
  return data.response;
}

// ─── Health ──────────────────────────────────────────────────────────

export async function healthCheck(): Promise<{ status: string; service: string; version: string }> {
  return request("/health");
}
