/**
 * Atlas Command — API Client
 * Connects to FastAPI backend when available, falls back to seed data
 */

import { SEED_EVENTS, SEED_INFRA, SEED_CONSEQUENCES } from "@/data/seed-events";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let useStaticData = false;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (useStaticData) {
    throw new Error("Using static data — backend not available");
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    useStaticData = true;
    throw err;
  }
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
  try {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") query.set(k, String(v));
      });
    }
    const qs = query.toString();
    return await request(`/events${qs ? `?${qs}` : ""}`);
  } catch {
    // Fallback to seed data
    let events = [...SEED_EVENTS];
    if (params?.risk_level) events = events.filter(e => e.risk_level === params.risk_level);
    if (params?.search) {
      const q = params.search.toLowerCase();
      events = events.filter(e => e.title.toLowerCase().includes(q) || e.region.toLowerCase().includes(q));
    }
    return { events, total: events.length };
  }
}

export async function fetchEvent(id: number): Promise<ApiEvent> {
  try {
    return await request(`/events/${id}`);
  } catch {
    const event = SEED_EVENTS.find(e => e.id === id);
    if (!event) throw new Error("Event not found");
    return event;
  }
}

export async function fetchEventConsequences(id: number): Promise<ApiConsequenceStep[]> {
  try {
    return await request(`/events/${id}/consequences`);
  } catch {
    return SEED_CONSEQUENCES[id] || [];
  }
}

export async function fetchEventInfra(id: number): Promise<ApiInfraLink[]> {
  try {
    return await request(`/events/${id}/infra`);
  } catch {
    return SEED_INFRA[id] || [];
  }
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
  try {
    return await request(`/intelligence/realtime-brief`);
  } catch {
    // Return null-like to trigger fallback to event-based brief
    throw new Error("Backend not available — using event data for brief");
  }
}

export async function generateMorningBrief(): Promise<ApiMorningBrief> {
  try {
    return await request(`/intelligence/realtime-brief/generate`, { method: "POST" });
  } catch {
    throw new Error("Backend not available — using event data for brief");
  }
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
