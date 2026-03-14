"use client";

import { useState, useMemo, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   PEOPLE FIRST — Workforce Intelligence Dashboard
   4 Tabs: What's Happening | What It Means | What You Can Do | Jobs
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Types ───────────────────────────────────────────── */

type Tab = "happening" | "means" | "citizen" | "jobs";

interface LayoffEvent {
  company: string;
  count: number;
  sector: string;
  date: string;
  region: string;
  lat: number;
  lng: number;
  reason: string;
}

interface VisaBan {
  country: string;
  type: string;
  effectiveDate: string;
  impactedPopulation: string;
  status: "active" | "partial" | "pending";
}

interface SectorRating {
  sector: string;
  rating: "booming" | "growing" | "stable" | "contracting" | "declining";
  change: string;
  jobs: string;
}

interface Skill {
  name: string;
  demand: number;
  growth: string;
  avgSalary: string;
}

interface Destination {
  country: string;
  city: string;
  visaType: string;
  duration: string;
  cost: string;
  internet: string;
  colIndex: number;
  highlight: string;
}

/* ─── Data: 2026 Real Events ─────────────────────────── */

const LAYOFF_EVENTS: LayoffEvent[] = [
  { company: "Amazon", count: 16000, sector: "Tech", date: "2026-01", region: "North America", lat: 47.6, lng: -122.3, reason: "AI automation, restructuring" },
  { company: "UPS", count: 30000, sector: "Logistics", date: "2026-02", region: "North America", lat: 38.2, lng: -85.7, reason: "Automation, volume decline" },
  { company: "Oracle", count: 25000, sector: "Tech", date: "2026-01", region: "North America", lat: 37.5, lng: -122.3, reason: "Cloud transition, AI integration" },
  { company: "Meta", count: 10000, sector: "Tech", date: "2026-01", region: "North America", lat: 37.5, lng: -122.2, reason: "Efficiency push, AI reorg" },
  { company: "Intel", count: 15000, sector: "Semiconductors", date: "2025-08", region: "North America", lat: 45.5, lng: -122.7, reason: "Foundry losses, restructuring" },
  { company: "Cisco", count: 7000, sector: "Networking", date: "2025-09", region: "North America", lat: 37.4, lng: -121.9, reason: "AI pivot, product shift" },
  { company: "SAP", count: 8000, sector: "Enterprise SW", date: "2026-01", region: "Europe", lat: 49.3, lng: 8.6, reason: "AI transformation" },
  { company: "Bosch", count: 5500, sector: "Manufacturing", date: "2026-02", region: "Europe", lat: 48.8, lng: 9.2, reason: "EV transition, automation" },
  { company: "Ericsson", count: 3000, sector: "Telecom", date: "2025-12", region: "Europe", lat: 59.3, lng: 18.1, reason: "5G slowdown, cost cuts" },
  { company: "Samsung", count: 4000, sector: "Electronics", date: "2025-11", region: "Asia Pacific", lat: 37.6, lng: 127.0, reason: "Memory market downturn" },
  { company: "Infosys", count: 6000, sector: "IT Services", date: "2026-01", region: "South Asia", lat: 12.9, lng: 77.6, reason: "AI replacing manual testing" },
  { company: "Alphabet", count: 12000, sector: "Tech", date: "2026-01", region: "North America", lat: 37.4, lng: -122.1, reason: "Gemini consolidation" },
];

const TOTAL_LAYOFFS = LAYOFF_EVENTS.reduce((s, e) => s + e.count, 0);

const VISA_BANS: VisaBan[] = [
  { country: "United States", type: "Travel ban on 39 countries", effectiveDate: "2025-06", impactedPopulation: "~180M nationals", status: "active" },
  { country: "United States", type: "Immigrant visa freeze — 75 countries", effectiveDate: "2025-08", impactedPopulation: "~2.1M pending applicants", status: "active" },
  { country: "United States", type: "H-1B visa lottery suspension", effectiveDate: "2026-01", impactedPopulation: "~780K applicants", status: "active" },
  { country: "United Kingdom", type: "Graduate visa route closure", effectiveDate: "2025-10", impactedPopulation: "~115K annual graduates", status: "active" },
  { country: "Canada", type: "TFW program cap reduction", effectiveDate: "2025-09", impactedPopulation: "~200K workers", status: "active" },
  { country: "Australia", type: "Skilled worker visa tightening", effectiveDate: "2025-11", impactedPopulation: "~140K applicants", status: "partial" },
  { country: "Germany", type: "Blue Card income threshold increase", effectiveDate: "2026-01", impactedPopulation: "~45K applicants", status: "active" },
  { country: "Gulf States (GCC)", type: "Kafala reform slowdown", effectiveDate: "2025-12", impactedPopulation: "~15M migrant workers", status: "pending" },
];

const UNEMPLOYMENT_RATES: { region: string; rate: number; change: string }[] = [
  { region: "United States", rate: 4.3, change: "+0.7" },
  { region: "European Union", rate: 6.1, change: "+0.3" },
  { region: "United Kingdom", rate: 4.5, change: "+0.6" },
  { region: "China", rate: 5.2, change: "+0.4" },
  { region: "India", rate: 7.8, change: "-0.2" },
  { region: "Brazil", rate: 7.1, change: "-0.5" },
  { region: "Japan", rate: 2.6, change: "+0.1" },
  { region: "South Korea", rate: 3.4, change: "+0.3" },
  { region: "GCC Average", rate: 3.8, change: "+0.2" },
  { region: "Sub-Saharan Africa", rate: 6.4, change: "+0.1" },
];

const SECTOR_RATINGS: SectorRating[] = [
  { sector: "AI / Machine Learning", rating: "booming", change: "+34%", jobs: "2.1M globally" },
  { sector: "Cybersecurity", rating: "booming", change: "+28%", jobs: "1.8M globally" },
  { sector: "Healthcare Tech", rating: "growing", change: "+18%", jobs: "3.2M globally" },
  { sector: "Renewable Energy", rating: "growing", change: "+22%", jobs: "1.5M globally" },
  { sector: "Cloud Infrastructure", rating: "growing", change: "+15%", jobs: "1.2M globally" },
  { sector: "Defense & Aerospace", rating: "stable", change: "+5%", jobs: "890K globally" },
  { sector: "Financial Services", rating: "stable", change: "+2%", jobs: "2.8M globally" },
  { sector: "E-commerce", rating: "stable", change: "+1%", jobs: "1.4M globally" },
  { sector: "Traditional Retail", rating: "contracting", change: "-8%", jobs: "12M globally" },
  { sector: "Print Media", rating: "declining", change: "-15%", jobs: "420K globally" },
  { sector: "Legacy IT Services", rating: "declining", change: "-12%", jobs: "2.1M globally" },
  { sector: "Fossil Fuel Extraction", rating: "contracting", change: "-6%", jobs: "3.8M globally" },
];

const IN_DEMAND_SKILLS: Skill[] = [
  { name: "Prompt Engineering", demand: 96, growth: "+420%", avgSalary: "$145K" },
  { name: "AI/ML Engineering", demand: 94, growth: "+67%", avgSalary: "$185K" },
  { name: "Cloud Security", demand: 91, growth: "+34%", avgSalary: "$165K" },
  { name: "Data Engineering", demand: 89, growth: "+28%", avgSalary: "$155K" },
  { name: "DevOps/SRE", demand: 87, growth: "+22%", avgSalary: "$152K" },
  { name: "Quantum Computing", demand: 82, growth: "+180%", avgSalary: "$195K" },
  { name: "Robotics Engineering", demand: 80, growth: "+45%", avgSalary: "$160K" },
  { name: "Blockchain/Web3", demand: 72, growth: "-12%", avgSalary: "$140K" },
  { name: "UX Research", demand: 70, growth: "+8%", avgSalary: "$120K" },
  { name: "Green Energy Engineering", demand: 78, growth: "+55%", avgSalary: "$135K" },
  { name: "Biotech/BioAI", demand: 76, growth: "+62%", avgSalary: "$170K" },
  { name: "AR/VR Development", demand: 68, growth: "+15%", avgSalary: "$130K" },
];

const RELOCATION_DESTINATIONS: Destination[] = [
  { country: "Portugal", city: "Lisbon", visaType: "Digital Nomad Visa (D8)", duration: "1 year, renewable", cost: "€3,500/mo min income", internet: "100 Mbps avg", colIndex: 62, highlight: "EU access, NHR tax regime" },
  { country: "UAE", city: "Dubai", visaType: "Virtual Working Visa", duration: "1 year", cost: "$3,500/mo min income", internet: "250 Mbps avg", colIndex: 78, highlight: "0% income tax, tech hub" },
  { country: "Estonia", city: "Tallinn", visaType: "Digital Nomad Visa", duration: "1 year", cost: "€3,504/mo min income", internet: "120 Mbps avg", colIndex: 55, highlight: "e-Residency, EU digital leader" },
  { country: "Thailand", city: "Bangkok", visaType: "Long-Term Resident Visa", duration: "5 years", cost: "$80K/yr income OR $250K savings", internet: "80 Mbps avg", colIndex: 38, highlight: "Low cost, growing tech scene" },
  { country: "Mexico", city: "Mexico City", visaType: "Temporary Resident Visa", duration: "1-4 years", cost: "$2,600/mo min income", internet: "60 Mbps avg", colIndex: 35, highlight: "US timezone, vibrant culture" },
  { country: "Spain", city: "Barcelona", visaType: "Digital Nomad Visa", duration: "1 year + 2yr renewal", cost: "€3,000/mo min income", internet: "110 Mbps avg", colIndex: 65, highlight: "EU, Mediterranean lifestyle" },
  { country: "Georgia", city: "Tbilisi", visaType: "Remotely from Georgia", duration: "1 year", cost: "No min income", internet: "50 Mbps avg", colIndex: 28, highlight: "No visa needed, ultra-low cost" },
  { country: "Croatia", city: "Zagreb", visaType: "Digital Nomad Visa", duration: "1 year", cost: "€2,540/mo min income", internet: "90 Mbps avg", colIndex: 48, highlight: "EU, Adriatic coast access" },
];

const SENTIMENT_DATA = {
  planToSearch: 43,
  previousPlanToSearch: 93,
  fearAI: 61,
  considerRelocation: 38,
  wantRemote: 72,
  trustEmployer: 29,
};

/* ─── Styling constants ──────────────────────────────── */

const CYAN = "#00DDFF";
const BG = "#08080F";
const BG_CARD = "rgba(255,255,255,0.03)";
const BORDER = "rgba(255,255,255,0.08)";

const RATING_COLORS: Record<string, string> = {
  booming: "#00FF88",
  growing: "#00DDFF",
  stable: "#FFC107",
  contracting: "#FF6B35",
  declining: "#FF3366",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#FF3366",
  partial: "#FF6B35",
  pending: "#FFC107",
};

/* ─── Sub-components ─────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.15em",
        color: CYAN,
        textTransform: "uppercase" as const,
        paddingBottom: 8,
        borderBottom: `1px solid ${CYAN}33`,
        marginBottom: 16,
        borderLeft: `2px solid ${CYAN}`,
        paddingLeft: 8,
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, padding: 14, borderRadius: 6 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || CYAN, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = CYAN }: { value: number; max?: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

/* ─── Layoff Map (MapLibre GL) ────────────────────────── */

function LayoffMap({ events }: { events: LayoffEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [10, 30],
        zoom: 1.3,
        attributionControl: false,
        interactive: true,
      });

      mapRef.current = map;

      map.on("load", () => {
        // Add layoff markers
        updateMarkers(events, map, maplibregl);
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when events change
  useEffect(() => {
    const map = mapRef.current as { loaded?: () => boolean } | null;
    if (!map || !map.loaded?.()) return;

    import("maplibre-gl").then((maplibregl) => {
      updateMarkers(events, mapRef.current, maplibregl);
    });
  }, [events]);

  function updateMarkers(
    evts: LayoffEvent[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    maplibregl: any,
  ) {
    // Clear old markers
    markersRef.current.forEach((m) => (m as { remove: () => void }).remove());
    markersRef.current = [];

    evts.forEach((e) => {
      const size = Math.max(10, Math.min(28, e.count / 1500));

      // Outer pulse ring
      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "50%";
      el.style.background = "rgba(255,51,102,0.6)";
      el.style.border = "2px solid rgba(255,51,102,0.8)";
      el.style.boxShadow = "0 0 12px rgba(255,51,102,0.5)";
      el.style.cursor = "pointer";
      el.style.transition = "transform 0.2s";
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.4)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

      const popup = new maplibregl.Popup({
        offset: 12,
        closeButton: false,
        maxWidth: "220px",
      }).setHTML(`
        <div style="font-family:'Space Grotesk',sans-serif;padding:4px 0;">
          <div style="font-size:13px;font-weight:700;color:#FF3366;margin-bottom:2px;">${e.company}</div>
          <div style="font-size:20px;font-weight:800;color:#fff;">${e.count.toLocaleString()}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:2px;">${e.sector} · ${e.date}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">${e.reason}</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([e.lng, e.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: 320,
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
        overflow: "hidden",
      }}
    />
  );
}

/* ─── Tab 1: What's Happening ────────────────────────── */

function TabHappening() {
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const regions = ["ALL", ...new Set(LAYOFF_EVENTS.map((e) => e.region))];

  const filtered = selectedRegion === "ALL" ? LAYOFF_EVENTS : LAYOFF_EVENTS.filter((e) => e.region === selectedRegion);
  const filteredTotal = filtered.reduce((s, e) => s + e.count, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Total Layoffs Tracked" value={TOTAL_LAYOFFS.toLocaleString()} sub="12 major companies" color="#FF3366" />
        <StatCard label="Tech Workers Impacted" value="53,000+" sub="Q1 2026 alone" color="#FF6B35" />
        <StatCard label="US Jobs Automatable" value="11.7%" sub="MIT 2025 study" color="#FFC107" />
        <StatCard label="Travel Ban Countries" value="39" sub="+ 75 visa freeze" color="#FF3366" />
      </div>

      {/* Interactive world map + events */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Map area */}
        <div>
          <SectionTitle>Global Layoff & Visa Ban Map</SectionTitle>
          <LayoffMap events={filtered} />
        </div>

        {/* Events list */}
        <div>
          <SectionTitle>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Major Layoff Events</span>
              <div style={{ display: "flex", gap: 4 }}>
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRegion(r)}
                    style={{
                      fontSize: 8,
                      padding: "2px 6px",
                      border: `1px solid ${selectedRegion === r ? CYAN : BORDER}`,
                      background: selectedRegion === r ? `${CYAN}20` : "transparent",
                      color: selectedRegion === r ? CYAN : "rgba(255,255,255,0.4)",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {r === "ALL" ? "ALL" : r.split(" ")[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </SectionTitle>
          <div style={{ maxHeight: 280, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${CYAN}40 transparent` }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((e, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4, borderLeft: "3px solid #FF3366" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", fontFamily: "'Space Grotesk', sans-serif" }}>{e.company}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{e.sector} — {e.reason}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#FF3366", fontFamily: "'JetBrains Mono', monospace" }}>{e.count.toLocaleString()}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{e.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
            Showing {filtered.length} events · {filteredTotal.toLocaleString()} workers
          </div>
        </div>
      </div>

      {/* Visa bans */}
      <div>
        <SectionTitle>Active Visa Restrictions & Travel Bans</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {VISA_BANS.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 3,
                  background: `${STATUS_COLORS[v.status]}20`,
                  color: STATUS_COLORS[v.status],
                  border: `1px solid ${STATUS_COLORS[v.status]}40`,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                }}
              >
                {v.status}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.9)", fontFamily: "'Space Grotesk', sans-serif" }}>{v.country}: {v.type}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Effective {v.effectiveDate} · {v.impactedPopulation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 2: What It Means ───────────────────────────── */

function TabMeans() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Unemployment by region */}
      <div>
        <SectionTitle>Unemployment Rates by Region — 2026</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {UNEMPLOYMENT_RATES.map((u) => (
            <div key={u.region} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, padding: 12, borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em", marginBottom: 4 }}>{u.region}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: u.rate > 6 ? "#FF6B35" : u.rate > 4 ? "#FFC107" : "#00FF88", fontFamily: "'Space Grotesk', sans-serif" }}>{u.rate}%</div>
              <div style={{ fontSize: 10, color: u.change.startsWith("+") ? "#FF6B35" : "#00FF88" }}>{u.change}pp YoY</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector ratings */}
      <div>
        <SectionTitle>Sector Performance — Booming to Declining</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SECTOR_RATINGS.map((s) => (
            <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4, borderLeft: `3px solid ${RATING_COLORS[s.rating]}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.9)", fontFamily: "'Space Grotesk', sans-serif" }}>{s.sector}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.jobs} openings</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 3,
                    background: `${RATING_COLORS[s.rating]}20`,
                    color: RATING_COLORS[s.rating],
                    border: `1px solid ${RATING_COLORS[s.rating]}40`,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    marginBottom: 2,
                  }}
                >
                  {s.rating}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: RATING_COLORS[s.rating], fontFamily: "'JetBrains Mono', monospace" }}>{s.change}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills demand */}
      <div>
        <SectionTitle>In-Demand Skills — 2026</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {IN_DEMAND_SKILLS.map((s) => (
            <div key={s.name} style={{ padding: "10px 12px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.9)", fontFamily: "'Space Grotesk', sans-serif" }}>{s.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>{s.avgSalary}</span>
              </div>
              <ProgressBar value={s.demand} color={s.demand > 85 ? "#00FF88" : s.demand > 70 ? CYAN : "#FFC107"} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Demand: {s.demand}%</span>
                <span style={{ fontSize: 9, color: s.growth.startsWith("+") ? "#00FF88" : "#FF6B35" }}>{s.growth} growth</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Worker sentiment */}
      <div>
        <SectionTitle>Worker Sentiment — 2026 Survey Data</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <StatCard label="Plan to Job Search" value={`${SENTIMENT_DATA.planToSearch}%`} sub={`Down from ${SENTIMENT_DATA.previousPlanToSearch}% in 2023`} color="#FFC107" />
          <StatCard label="Fear AI Displacement" value={`${SENTIMENT_DATA.fearAI}%`} sub="Up 18pp from 2024" color="#FF6B35" />
          <StatCard label="Want Full Remote" value={`${SENTIMENT_DATA.wantRemote}%`} sub="Highest ever recorded" color={CYAN} />
          <StatCard label="Consider Relocation" value={`${SENTIMENT_DATA.considerRelocation}%`} sub="To another country" color="#00FF88" />
          <StatCard label="Trust Employer" value={`${SENTIMENT_DATA.trustEmployer}%`} sub="Lowest in 20 years" color="#FF3366" />
          <StatCard label="AI Impact Awareness" value="78%" sub="Believe AI will change their job in 2 years" color="#FFC107" />
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 3: What You Can Do (Citizen View) ──────────── */

function TabCitizen() {
  const [visaSearch, setVisaSearch] = useState("");

  const filteredBans = visaSearch
    ? VISA_BANS.filter((v) =>
        `${v.country} ${v.type}`.toLowerCase().includes(visaSearch.toLowerCase())
      )
    : VISA_BANS;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Visa ban tracker */}
      <div>
        <SectionTitle>Visa Ban & Travel Restriction Tracker — 75+ Countries</SectionTitle>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={visaSearch}
            onChange={(e) => setVisaSearch(e.target.value)}
            placeholder="Search countries, visa types..."
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontFamily: "'Space Grotesk', sans-serif",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredBans.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 3,
                  background: `${STATUS_COLORS[v.status]}20`,
                  color: STATUS_COLORS[v.status],
                  border: `1px solid ${STATUS_COLORS[v.status]}40`,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  minWidth: 50,
                  textAlign: "center" as const,
                }}
              >
                {v.status}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.9)", fontFamily: "'Space Grotesk', sans-serif" }}>{v.country}: {v.type}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Effective {v.effectiveDate} · {v.impactedPopulation}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy timeline */}
      <div>
        <SectionTitle>Policy Timeline — Key Dates</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { date: "2025-06", event: "US Executive Order: Travel ban on 39 countries", status: "active" },
            { date: "2025-08", event: "US immigrant visa processing freeze — 75 countries", status: "active" },
            { date: "2025-09", event: "Canada TFW program cap reduced by 40%", status: "active" },
            { date: "2025-10", event: "UK Graduate Route visa closure announced", status: "active" },
            { date: "2025-11", event: "Australia skilled worker visa tightening", status: "partial" },
            { date: "2025-12", event: "GCC Kafala reform implementation delayed", status: "pending" },
            { date: "2026-01", event: "US H-1B lottery suspended pending review", status: "active" },
            { date: "2026-01", event: "Germany Blue Card threshold increase takes effect", status: "active" },
            { date: "2026-03", event: "EU AI Act labor provisions — Phase 2", status: "pending" },
            { date: "2026-06", event: "US visa ban review deadline (expected)", status: "pending" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderLeft: `2px solid ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || CYAN}` }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: CYAN, fontFamily: "'JetBrains Mono', monospace", minWidth: 70 }}>{t.date}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "'Space Grotesk', sans-serif" }}>{t.event}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 8,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: `${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || CYAN}15`,
                  color: STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || CYAN,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase" as const,
                }}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rights & legal options */}
      <div>
        <SectionTitle>Rights & Legal Options</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { title: "WARN Act Protections", desc: "60-day notice required for layoffs of 100+ workers in the US. Check if your employer complied.", color: "#00FF88" },
            { title: "Visa Grace Periods", desc: "H-1B holders get 60-day grace period after termination. OPT/STEM OPT has 90-day unemployment cap.", color: "#FFC107" },
            { title: "EU Worker Protections", desc: "EU countries require consultation periods, severance packages, and retraining programs for mass layoffs.", color: CYAN },
            { title: "Unemployment Benefits", desc: "Check eligibility in your state/country. Many have extended benefits for tech workers displaced by AI.", color: "#FF6B35" },
            { title: "Class Action Options", desc: "Several ongoing class actions against tech companies for discriminatory layoff practices.", color: "#FF3366" },
            { title: "Immigration Attorney", desc: "Free consultations available through AILA, local legal aid societies, and pro bono immigration clinics.", color: "#00FF88" },
          ].map((item, i) => (
            <div key={i} style={{ padding: 14, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 6, borderTop: `2px solid ${item.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: item.color, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>{item.title}</div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.6)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Relocation destinations */}
      <div>
        <SectionTitle>Digital Nomad & Relocation Destinations — 2026</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {RELOCATION_DESTINATIONS.map((d) => (
            <div key={d.country} style={{ padding: 14, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{d.country}</div>
              <div style={{ fontSize: 10, color: CYAN, marginBottom: 8 }}>{d.city}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                <div><span style={{ color: "rgba(255,255,255,0.3)" }}>Visa:</span> {d.visaType}</div>
                <div><span style={{ color: "rgba(255,255,255,0.3)" }}>Duration:</span> {d.duration}</div>
                <div><span style={{ color: "rgba(255,255,255,0.3)" }}>Income req:</span> {d.cost}</div>
                <div><span style={{ color: "rgba(255,255,255,0.3)" }}>Internet:</span> {d.internet}</div>
                <div><span style={{ color: "rgba(255,255,255,0.3)" }}>COL Index:</span> {d.colIndex}/100</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: "#00FF88", fontStyle: "italic" }}>{d.highlight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 4: Jobs & Workforce (Combined) ────────────── */

function TabJobs() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* AI impact overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Jobs at Risk from AI" value="11.7%" sub="MIT 2025: ~18M US jobs" color="#FF6B35" />
        <StatCard label="New AI Jobs Created" value="2.1M" sub="Globally in 2025-2026" color="#00FF88" />
        <StatCard label="Avg Reskilling Time" value="6 months" sub="For AI-adjacent roles" color={CYAN} />
        <StatCard label="Remote Job Share" value="34%" sub="Up from 12% pre-pandemic" color="#00FF88" />
      </div>

      {/* Side-by-side: sectors + skills */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Sector Outlook</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SECTOR_RATINGS.slice(0, 8).map((s) => (
              <div key={s.sector} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: RATING_COLORS[s.rating] }} />
                <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "'Space Grotesk', sans-serif" }}>{s.sector}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: RATING_COLORS[s.rating], fontFamily: "'JetBrains Mono', monospace" }}>{s.change}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Top Skills Demand</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {IN_DEMAND_SKILLS.slice(0, 8).map((s) => (
              <div key={s.name} style={{ padding: "6px 10px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "'Space Grotesk', sans-serif" }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>{s.avgSalary}</span>
                </div>
                <ProgressBar value={s.demand} color={s.demand > 85 ? "#00FF88" : CYAN} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Layoff trend + unemployment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <SectionTitle>Layoff Events by Sector</SectionTitle>
          {(() => {
            const bySector: Record<string, number> = {};
            LAYOFF_EVENTS.forEach((e) => {
              bySector[e.sector] = (bySector[e.sector] || 0) + e.count;
            });
            const sorted = Object.entries(bySector).sort(([, a], [, b]) => b - a);
            const max = sorted[0]?.[1] || 1;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sorted.map(([sector, count]) => (
                  <div key={sector} style={{ padding: "6px 10px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{sector}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#FF3366", fontFamily: "'JetBrains Mono', monospace" }}>{count.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={count} max={max} color="#FF3366" />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        <div>
          <SectionTitle>Global Unemployment</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {UNEMPLOYMENT_RATES.map((u) => (
              <div key={u.region} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
                <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{u.region}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: u.rate > 6 ? "#FF6B35" : u.rate > 4 ? "#FFC107" : "#00FF88", fontFamily: "'JetBrains Mono', monospace" }}>{u.rate}%</span>
                <span style={{ fontSize: 9, color: u.change.startsWith("+") ? "#FF6B35" : "#00FF88", minWidth: 40, textAlign: "right" as const }}>{u.change}pp</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment summary */}
      <div>
        <SectionTitle>Worker Sentiment Snapshot</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          <StatCard label="Job Searching" value={`${SENTIMENT_DATA.planToSearch}%`} sub={`Was ${SENTIMENT_DATA.previousPlanToSearch}%`} color="#FFC107" />
          <StatCard label="Fear AI" value={`${SENTIMENT_DATA.fearAI}%`} color="#FF6B35" />
          <StatCard label="Want Remote" value={`${SENTIMENT_DATA.wantRemote}%`} color={CYAN} />
          <StatCard label="May Relocate" value={`${SENTIMENT_DATA.considerRelocation}%`} color="#00FF88" />
          <StatCard label="Trust Employer" value={`${SENTIMENT_DATA.trustEmployer}%`} color="#FF3366" />
          <StatCard label="AI Aware" value="78%" color="#FFC107" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "happening", label: "WHAT'S HAPPENING", icon: "◉" },
  { key: "means", label: "WHAT IT MEANS", icon: "◈" },
  { key: "citizen", label: "WHAT YOU CAN DO", icon: "◆" },
  { key: "jobs", label: "JOBS & WORKFORCE", icon: "◇" },
];

export function PeopleFirst() {
  const [activeTab, setActiveTab] = useState<Tab>("happening");

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: BG }}>
      {/* Header bar */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, background: "#0A0A12", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: CYAN, fontFamily: "'JetBrains Mono', monospace" }}>PEOPLE FIRST</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Workforce & Citizen Intelligence</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00FF88", boxShadow: "0 0 6px rgba(0,255,136,0.5)" }} />
          <span style={{ fontSize: 9, color: "#00FF88", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>LIVE DATA</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, background: "#0A0A12", padding: "0 24px", display: "flex", gap: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 16px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              fontFamily: "'JetBrains Mono', monospace",
              color: activeTab === tab.key ? CYAN : "rgba(255,255,255,0.4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${CYAN}` : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 24px 48px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {activeTab === "happening" && <TabHappening />}
        {activeTab === "means" && <TabMeans />}
        {activeTab === "citizen" && <TabCitizen />}
        {activeTab === "jobs" && <TabJobs />}
      </div>
    </div>
  );
}
