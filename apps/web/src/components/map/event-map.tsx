"use client";

import { useEffect, useRef, useMemo } from "react";
import { useCommandStore } from "@/stores/command-store";
import { getFilterViewport, GLOBAL_VIEW } from "@/data/regions";
import type { ApiEvent } from "@/lib/api";

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

// ISO-2 → ISO-3 for countries in scope
const ISO2_TO_ISO3: Record<string, string> = {
  KW: "KWT", SA: "SAU", AE: "ARE", QA: "QAT", BH: "BHR", OM: "OMN",
  IQ: "IRQ", IR: "IRN", YE: "YEM", EG: "EGY", JO: "JOR", SY: "SYR",
  LB: "LBN", IL: "ISR", CY: "CYP", TR: "TUR", AF: "AFG", PK: "PAK",
  SD: "SDN", ER: "ERI", DJ: "DJI", SO: "SOM", LY: "LBY",
};

const ISO3_TO_NAME: Record<string, string> = {
  KWT: "Kuwait", SAU: "Saudi Arabia", ARE: "UAE", QAT: "Qatar",
  BHR: "Bahrain", OMN: "Oman", IRQ: "Iraq", IRN: "Iran",
  YEM: "Yemen", EGY: "Egypt", JOR: "Jordan", SYR: "Syria",
  LBN: "Lebanon", ISR: "Israel", CYP: "Cyprus", TUR: "Turkey",
  AFG: "Afghanistan", PAK: "Pakistan", IND: "India", SDN: "Sudan",
  ERI: "Eritrea", DJI: "Djibouti", SOM: "Somalia", LBY: "Libya",
};

// Numeric country IDs (ISO 3166-1 numeric) → ISO-3
const NUMERIC_TO_ISO3: Record<string, string> = {
  "414": "KWT", "682": "SAU", "784": "ARE", "634": "QAT",
  "048": "BHR", "512": "OMN", "368": "IRQ", "364": "IRN",
  "887": "YEM", "818": "EGY", "400": "JOR", "760": "SYR",
  "422": "LBN", "376": "ISR", "196": "CYP", "792": "TUR",
  "004": "AFG", "586": "PAK", "356": "IND", "729": "SDN",
  "232": "ERI", "262": "DJI", "706": "SOM", "434": "LBY",
  "834": "TZA", "404": "KEN", "800": "UGA", "860": "UZB",
  "795": "TKM", "762": "TJK", "417": "KGZ", "398": "KAZ",
};

const COUNTRIES_TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryRiskMap = Record<string, { score: number; level: string; events: ApiEvent[] }>;

function computeCountryRisk(events: ApiEvent[]): CountryRiskMap {
  const map: CountryRiskMap = {};
  for (const e of events) {
    const iso3 = ISO2_TO_ISO3[e.country] || e.country;
    if (!iso3) continue;
    if (!map[iso3]) map[iso3] = { score: 0, level: "LOW", events: [] };
    map[iso3].events.push(e);
    if (e.risk_score > map[iso3].score) {
      map[iso3].score = e.risk_score;
      map[iso3].level = e.risk_level;
    }
  }
  return map;
}

function riskScoreToFill(score: number): string {
  if (score >= 80) return "rgba(239, 68, 68, 0.22)";
  if (score >= 60) return "rgba(249, 115, 22, 0.18)";
  if (score >= 40) return "rgba(234, 179, 8, 0.13)";
  return "rgba(34, 197, 94, 0.08)";
}

function riskScoreToBorder(score: number): string {
  if (score >= 80) return "rgba(239, 68, 68, 0.50)";
  if (score >= 60) return "rgba(249, 115, 22, 0.40)";
  if (score >= 40) return "rgba(234, 179, 8, 0.30)";
  return "rgba(34, 197, 94, 0.20)";
}

export function EventMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const countryLayerReady = useRef(false);
  const hoverPopupRef = useRef<any>(null);
  const eventsRef = useRef<ApiEvent[]>([]);
  const countryRiskRef = useRef<CountryRiskMap>({});

  const events = useCommandStore((s) => s.events);
  const regionFilter = useCommandStore((s) => s.regionFilter);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const setSelectedCountry = useCommandStore((s) => s.setSelectedCountry);

  const countryRisk = useMemo(() => computeCountryRisk(events), [events]);

  // Keep refs in sync for event handlers
  useEffect(() => { eventsRef.current = events; }, [events]);
  useEffect(() => { countryRiskRef.current = countryRisk; }, [countryRisk]);

  // Initialize map
  useEffect(() => {
    let cancelled = false;
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !mapContainer.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: GLOBAL_VIEW.center,
        zoom: GLOBAL_VIEW.zoom,
        attributionControl: false,
      });

      mapRef.current = map;
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: "320px",
        offset: 15,
      });
      hoverPopupRef.current = popup;

      map.on("load", async () => {
        await loadCountryBoundaries(map);
        countryLayerReady.current = true;
        // Apply initial risk colors
        applyCountryRiskColors(map, countryRiskRef.current);
        // Setup hover interaction
        setupCountryHover(map, popup, maplibregl);
        // Setup country click → opens CountryIntelPanel
        setupCountryClick(map);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
    return () => { cancelled = true; };
  }, []);

  // Pan/zoom on region filter change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const viewport = getFilterViewport(regionFilter);
    map.flyTo({ center: viewport.center, zoom: viewport.zoom, duration: 1200, essential: true });
  }, [regionFilter]);

  // Update country risk shading when events change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !countryLayerReady.current) return;
    applyCountryRiskColors(map, countryRisk);
  }, [countryRisk]);

  // Update event markers
  useEffect(() => {
    if (!mapRef.current) return;
    import("maplibre-gl").then((maplibregl) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      events.forEach((event: ApiEvent, index: number) => {
        const color = RISK_COLORS[event.risk_level] || "#3b82f6";
        const size = event.risk_level === "CRITICAL" ? 14 : event.risk_level === "HIGH" ? 12 : 10;

        const el = document.createElement("div");
        const isCritical = event.risk_level === "CRITICAL";
        el.style.cssText = `
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; opacity: 0;
          border: 1.5px solid ${color};
          box-shadow: 0 0 ${size}px ${color}60;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.4s ease;
          ${isCritical ? "animation: atlas-pulse 2s ease-in-out infinite;" : ""}
        `;
        if (isCritical && !document.getElementById("atlas-pulse-style")) {
          const style = document.createElement("style");
          style.id = "atlas-pulse-style";
          style.textContent = `
            @keyframes atlas-pulse {
              0%, 100% { box-shadow: 0 0 14px rgba(239,68,68,0.4); transform: scale(1); }
              50% { box-shadow: 0 0 28px rgba(239,68,68,0.6); transform: scale(1.15); }
            }
          `;
          document.head.appendChild(style);
        }
        setTimeout(() => { el.style.opacity = "0.85"; }, index * 80);
        el.onmouseenter = () => { el.style.transform = "scale(1.4)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const popup = new maplibregl.Popup({
          offset: 8, closeButton: false, maxWidth: "260px",
        }).setHTML(`
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10px;">
            <div style="color: ${color}; font-weight: 600; margin-bottom: 3px;">${event.risk_level} · ${event.risk_score}/100</div>
            <div style="color: #e2e8f0; font-weight: 500; margin-bottom: 2px;">${event.title}</div>
            <div style="color: #64748b;">${event.region} · ${event.sector}</div>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([event.longitude, event.latitude])
          .setPopup(popup)
          .addTo(mapRef.current);

        el.addEventListener("click", () => {
          setSelectedEvent(event);
          setActiveSection("intel");
        });
        markersRef.current.push(marker);
      });
    });
  }, [events, setSelectedEvent, setActiveSection]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={mapContainer} className="h-full w-full" />
      {/* Country risk legend */}
      <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-atlas-bg/80 border border-white/[0.06] px-3 py-1.5 backdrop-blur-sm">
        <span className="font-mono text-[8px] tracking-wider text-slate-500">RISK</span>
        {[
          { label: "CRITICAL", color: "rgba(239,68,68,0.6)" },
          { label: "HIGH", color: "rgba(249,115,22,0.5)" },
          { label: "MEDIUM", color: "rgba(234,179,8,0.4)" },
          { label: "LOW", color: "rgba(34,197,94,0.3)" },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
            <span className="font-mono text-[7px] tracking-wider text-slate-600">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Country click handler (opens CountryIntelPanel) ---
  function setupCountryClick(map: any) {
    map.on("click", "atlas-country-fill", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const iso3 = e.features[0].properties?.iso_a3;
      if (!iso3) return;

      // Highlight clicked country
      try {
        map.setPaintProperty("atlas-country-highlight", "fill-color", [
          "case",
          ["==", ["get", "iso_a3"], iso3],
          "rgba(59, 130, 246, 0.2)",
          "rgba(0,0,0,0)",
        ]);
        map.setPaintProperty("atlas-country-highlight-border", "line-color", [
          "case",
          ["==", ["get", "iso_a3"], iso3],
          "#3b82f6",
          "rgba(0,0,0,0)",
        ]);
      } catch {
        // Highlight layers not ready
      }

      setSelectedCountry(iso3);
    });

    // Click on empty area → close panel
    map.on("click", (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["atlas-country-fill"] });
      if (!features || features.length === 0) {
        setSelectedCountry(null);
        try {
          map.setPaintProperty("atlas-country-highlight", "fill-color", "rgba(0,0,0,0)");
          map.setPaintProperty("atlas-country-highlight-border", "line-color", "rgba(0,0,0,0)");
        } catch {}
      }
    });
  }

  // --- Hover handler setup (closure over refs) ---
  function setupCountryHover(map: any, popup: any, maplibregl: any) {
    let hoveredId: string | null = null;

    map.on("mousemove", "atlas-country-fill", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const iso3 = e.features[0].properties?.iso_a3;
      if (!iso3 || iso3 === hoveredId) return;
      hoveredId = iso3;

      const risk = countryRiskRef.current[iso3];
      if (!risk) {
        popup.remove();
        return;
      }

      const name = ISO3_TO_NAME[iso3] || iso3;
      const riskColor = RISK_COLORS[risk.level] || "#3b82f6";
      const eventLines = risk.events
        .slice(0, 5)
        .map(
          (ev) =>
            `<div style="margin: 4px 0; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
              <div style="color: ${RISK_COLORS[ev.risk_level] || "#3b82f6"}; font-size: 8px; font-weight: 600;">${ev.risk_level} · ${ev.risk_score}</div>
              <div style="color: #cbd5e1; font-size: 10px;">${ev.title.slice(0, 60)}</div>
              <div style="color: #64748b; font-size: 8px;">${ev.event_type} · ${ev.sector}</div>
            </div>`
        )
        .join("");

      const moreCount = risk.events.length > 5 ? `<div style="color:#64748b;font-size:8px;margin-top:4px;">+${risk.events.length - 5} more events</div>` : "";

      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-family: 'IBM Plex Mono', monospace; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span style="color: #e2e8f0; font-size: 12px; font-weight: 600;">${name}</span>
              <span style="color: ${riskColor}; font-size: 10px; font-weight: 700; background: ${riskColor}20; padding: 1px 6px; border: 1px solid ${riskColor}40;">${risk.level} · ${risk.score}</span>
            </div>
            <div style="color: #94a3b8; font-size: 9px; margin-bottom: 4px;">${risk.events.length} active event${risk.events.length !== 1 ? "s" : ""}</div>
            ${eventLines}
            ${moreCount}
          </div>`
        )
        .addTo(map);
    });

    map.on("mouseleave", "atlas-country-fill", () => {
      hoveredId = null;
      popup.remove();
    });

    // Change cursor on country hover
    map.on("mouseenter", "atlas-country-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "atlas-country-fill", () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

function applyCountryRiskColors(map: any, countryRisk: CountryRiskMap) {
  const fillExpr: any[] = ["match", ["get", "iso_a3"]];
  const borderExpr: any[] = ["match", ["get", "iso_a3"]];

  for (const [iso3, data] of Object.entries(countryRisk)) {
    fillExpr.push(iso3, riskScoreToFill(data.score));
    borderExpr.push(iso3, riskScoreToBorder(data.score));
  }
  fillExpr.push("rgba(0,0,0,0)");
  borderExpr.push("rgba(255,255,255,0.03)");

  try {
    map.setPaintProperty("atlas-country-fill", "fill-color", fillExpr);
    map.setPaintProperty("atlas-country-border", "line-color", borderExpr);
  } catch {
    // Layer not ready yet
  }
}

async function loadCountryBoundaries(map: any) {
  try {
    const resp = await fetch(COUNTRIES_TOPO_URL);
    const topo = await resp.json();

    const topojson = await import("topojson-client");
    const geojson = topojson.feature(topo, topo.objects.countries) as any;

    for (const f of geojson.features) {
      f.properties = f.properties || {};
      const iso3 = NUMERIC_TO_ISO3[f.id] || "";
      f.properties.iso_a3 = iso3;
    }

    map.addSource("atlas-countries", { type: "geojson", data: geojson });

    // Try to find a label layer to insert beneath
    const layers = map.getStyle()?.layers || [];
    let insertBefore: string | undefined;
    for (const l of layers) {
      if (l.type === "symbol" || l.id.includes("label") || l.id.includes("place")) {
        insertBefore = l.id;
        break;
      }
    }

    map.addLayer({
      id: "atlas-country-fill",
      type: "fill",
      source: "atlas-countries",
      paint: { "fill-color": "rgba(0,0,0,0)" },
    }, insertBefore);

    map.addLayer({
      id: "atlas-country-border",
      type: "line",
      source: "atlas-countries",
      paint: { "line-color": "rgba(255,255,255,0.03)", "line-width": 1 },
    }, insertBefore);

    // Highlight layer for selected country
    map.addLayer({
      id: "atlas-country-highlight",
      type: "fill",
      source: "atlas-countries",
      paint: { "fill-color": "rgba(0,0,0,0)" },
    }, insertBefore);

    map.addLayer({
      id: "atlas-country-highlight-border",
      type: "line",
      source: "atlas-countries",
      paint: { "line-color": "rgba(0,0,0,0)", "line-width": 2 },
    }, insertBefore);
  } catch (e) {
    console.warn("Could not load country boundaries:", e);
  }
}
