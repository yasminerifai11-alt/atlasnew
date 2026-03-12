"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { getFilterViewport, GLOBAL_VIEW } from "@/data/regions";
import { setMapLanguage, getLocalizedField, translateTag } from "@/utils/translate";
import type { ApiEvent } from "@/lib/api";

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const OPERATOR_COLORS: Record<string, string> = {
  US: "#3b82f6",
  GCC: "#16a34a",
  IRAN: "#dc2626",
  RUSSIA: "#ea580c",
  PALESTINE: "#7c3aed",
};

const BASE_TYPE_ICONS: Record<string, string> = {
  AIR_BASE: "✈",
  NAVAL_BASE: "⚓",
  ARMY_BASE: "■",
  MISSILE_BASE: "▲",
  AIR_BASE_MISSILE: "✈",
  NAVAL_AIR_BASE: "✈",
};

const NUCLEAR_COLORS: Record<string, string> = {
  NUCLEAR_CIVIL: "#ca8a04",
  NUCLEAR_MILITARY: "#dc2626",
  NUCLEAR_UNDECLARED: "#7c3aed",
};

const OIL_TYPE_ICONS: Record<string, string> = {
  REFINERY: "⛽",
  TERMINAL: "🛢",
  LNG_TERMINAL: "🔥",
};

const OIL_TYPE_COLORS: Record<string, string> = {
  REFINERY: "#f59e0b",
  TERMINAL: "#d97706",
  LNG_TERMINAL: "#ef4444",
};

const PORT_TYPE_COLORS: Record<string, string> = {
  CONTAINER_PORT: "#06b6d4",
  MIXED_PORT: "#0891b2",
  INDUSTRIAL_PORT: "#0e7490",
  CANAL_PORT: "#0284c7",
};

// ─── Extended layers interface ────────────────────────────────────
interface MapLayers {
  // Threat
  threatFills: boolean;
  activeEvents: boolean;
  // Military
  militaryBases: boolean;
  nuclearFacilities: boolean;
  // Infrastructure
  oilGas: boolean;
  desalination: boolean;
  ports: boolean;
  telecomCables: boolean;
  // Overlays
  chokepoints: boolean;
}

const DEFAULT_LAYERS: MapLayers = {
  threatFills: true,
  activeEvents: true,
  militaryBases: false,
  nuclearFacilities: false,
  oilGas: false,
  desalination: false,
  ports: false,
  telecomCables: false,
  chokepoints: false,
};

// ─── Static Threat Level Data ─────────────────────────────────────
type ThreatLevel = "CRITICAL" | "HIGH" | "ELEVATED" | "MONITORING" | "STABLE";

const STATIC_THREAT_LEVELS: Record<string, ThreatLevel> = {
  // CRITICAL
  IR: "CRITICAL", YE: "CRITICAL", SD: "CRITICAL", MM: "CRITICAL",
  HT: "CRITICAL", ML: "CRITICAL", BF: "CRITICAL", SO: "CRITICAL",
  KP: "CRITICAL", SY: "CRITICAL", LY: "CRITICAL",
  // HIGH
  IQ: "HIGH", LB: "HIGH", PK: "HIGH", AF: "HIGH",
  ET: "HIGH", NE: "HIGH", TD: "HIGH", CF: "HIGH",
  CD: "HIGH", UA: "HIGH", RU: "HIGH", PS: "HIGH",
  VE: "HIGH", MX: "HIGH",
  // ELEVATED
  SA: "ELEVATED", KW: "ELEVATED", AE: "ELEVATED", QA: "ELEVATED",
  BH: "ELEVATED", OM: "ELEVATED", JO: "ELEVATED", EG: "ELEVATED",
  TR: "ELEVATED", AZ: "ELEVATED", AM: "ELEVATED", XK: "ELEVATED",
  RS: "ELEVATED", BA: "ELEVATED", BY: "ELEVATED", MD: "ELEVATED",
  NG: "ELEVATED", KE: "ELEVATED", MZ: "ELEVATED", CO: "ELEVATED",
  EC: "ELEVATED", PE: "ELEVATED", BD: "ELEVATED", LK: "ELEVATED",
  // STABLE (no fill)
  US: "STABLE", CA: "STABLE", GB: "STABLE", FR: "STABLE", DE: "STABLE",
  IT: "STABLE", ES: "STABLE", PT: "STABLE", NL: "STABLE", BE: "STABLE",
  CH: "STABLE", AT: "STABLE", SE: "STABLE", NO: "STABLE", DK: "STABLE",
  FI: "STABLE", IE: "STABLE", IS: "STABLE", LU: "STABLE",
  AU: "STABLE", NZ: "STABLE", JP: "STABLE", KR: "STABLE", SG: "STABLE",
};

const THREAT_COLORS: Record<ThreatLevel, string> = {
  CRITICAL: "rgba(220,38,38,0.35)",
  HIGH: "rgba(234,88,12,0.30)",
  ELEVATED: "rgba(202,138,4,0.25)",
  MONITORING: "rgba(37,99,235,0.04)",
  STABLE: "rgba(0,0,0,0)",
};

const THREAT_BORDER_COLORS: Record<ThreatLevel, string> = {
  CRITICAL: "rgba(220,38,38,0.6)",
  HIGH: "rgba(234,88,12,0.4)",
  ELEVATED: "rgba(202,138,4,0.3)",
  MONITORING: "rgba(37,99,235,0.1)",
  STABLE: "rgba(0,0,0,0)",
};

// Numeric country IDs → ISO-2
const NUMERIC_TO_ISO2: Record<string, string> = {
  "004": "AF", "008": "AL", "012": "DZ", "024": "AO", "031": "AZ",
  "032": "AR", "036": "AU", "040": "AT", "048": "BH", "050": "BD",
  "051": "AM", "056": "BE", "064": "BT", "068": "BO", "070": "BA",
  "072": "BW", "076": "BR", "084": "BZ", "090": "SB", "096": "BN",
  "100": "BG", "104": "MM", "108": "BI", "112": "BY", "116": "KH",
  "120": "CM", "124": "CA", "140": "CF", "144": "LK", "148": "TD",
  "152": "CL", "156": "CN", "158": "TW", "170": "CO", "178": "CG",
  "180": "CD", "188": "CR", "191": "HR", "192": "CU", "196": "CY",
  "203": "CZ", "204": "BJ", "208": "DK", "214": "DO", "218": "EC",
  "222": "SV", "226": "GQ", "231": "ET", "232": "ER", "233": "EE",
  "242": "FJ", "246": "FI", "250": "FR", "262": "DJ", "266": "GA",
  "268": "GE", "270": "GM", "275": "PS", "276": "DE", "288": "GH",
  "300": "GR", "320": "GT", "324": "GN", "328": "GY", "332": "HT",
  "340": "HN", "348": "HU", "352": "IS", "356": "IN", "360": "ID",
  "364": "IR", "368": "IQ", "372": "IE", "376": "PS", "380": "IT",
  "384": "CI", "388": "JM", "392": "JP", "398": "KZ", "400": "JO",
  "404": "KE", "408": "KP", "410": "KR", "414": "KW", "417": "KG",
  "418": "LA", "422": "LB", "426": "LS", "428": "LV", "430": "LR",
  "434": "LY", "440": "LT", "442": "LU", "450": "MG", "454": "MW",
  "458": "MY", "462": "MV", "466": "ML", "478": "MR", "484": "MX",
  "496": "MN", "498": "MD", "504": "MA", "508": "MZ", "512": "OM",
  "516": "NA", "524": "NP", "528": "NL", "540": "NC", "548": "VU",
  "554": "NZ", "558": "NI", "562": "NE", "566": "NG", "578": "NO",
  "586": "PK", "591": "PA", "598": "PG", "600": "PY", "604": "PE",
  "608": "PH", "616": "PL", "620": "PT", "624": "GW", "626": "TL",
  "630": "PR", "634": "QA", "642": "RO", "643": "RU", "646": "RW",
  "682": "SA", "686": "SN", "688": "RS", "694": "SL", "702": "SG",
  "703": "SK", "704": "VN", "705": "SI", "706": "SO", "710": "ZA",
  "716": "ZW", "724": "ES", "729": "SD", "732": "EH", "740": "SR",
  "748": "SZ", "752": "SE", "756": "CH", "760": "SY", "762": "TJ",
  "764": "TH", "768": "TG", "780": "TT", "784": "AE", "788": "TN",
  "792": "TR", "795": "TM", "800": "UG", "804": "UA", "807": "MK",
  "818": "EG", "826": "GB", "834": "TZ", "840": "US", "854": "BF",
  "858": "UY", "860": "UZ", "862": "VE", "887": "YE", "894": "ZM",
};

// ISO-2 → ISO-3 for countries in scope
const ISO2_TO_ISO3: Record<string, string> = {
  KW: "KWT", SA: "SAU", AE: "ARE", QA: "QAT", BH: "BHR", OM: "OMN",
  IQ: "IRQ", IR: "IRN", YE: "YEM", EG: "EGY", JO: "JOR", SY: "SYR",
  LB: "LBN", PS: "PSE", CY: "CYP", TR: "TUR", AF: "AFG", PK: "PAK",
  SD: "SDN", ER: "ERI", DJ: "DJI", SO: "SOM", LY: "LBY",
};

const ISO3_TO_NAME: Record<string, string> = {
  KWT: "Kuwait", SAU: "Saudi Arabia", ARE: "UAE", QAT: "Qatar",
  BHR: "Bahrain", OMN: "Oman", IRQ: "Iraq", IRN: "Iran",
  YEM: "Yemen", EGY: "Egypt", JOR: "Jordan", SYR: "Syria",
  LBN: "Lebanon", PSE: "Palestine", CYP: "Cyprus", TUR: "Turkey",
  AFG: "Afghanistan", PAK: "Pakistan", IND: "India", SDN: "Sudan",
  ERI: "Eritrea", DJI: "Djibouti", SOM: "Somalia", LBY: "Libya",
};

// Numeric country IDs (ISO 3166-1 numeric) → ISO-3
const NUMERIC_TO_ISO3: Record<string, string> = {
  "414": "KWT", "682": "SAU", "784": "ARE", "634": "QAT",
  "048": "BHR", "512": "OMN", "368": "IRQ", "364": "IRN",
  "887": "YEM", "818": "EGY", "400": "JOR", "760": "SYR",
  "422": "LBN", "376": "PSE", "196": "CYP", "792": "TUR",
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

// ─── Layer group definitions ──────────────────────────────────────

interface LayerDef {
  key: keyof MapLayers;
  labelKey: string;
  icon: string;
  defaultOn: boolean;
}

interface LayerGroup {
  headerKey: string;
  color: string;
  layers: LayerDef[];
}

const LAYER_GROUPS: LayerGroup[] = [
  {
    headerKey: "map.threatGroup",
    color: "#ef4444",
    layers: [
      { key: "threatFills", labelKey: "map.threatAssessment", icon: "◉", defaultOn: true },
      { key: "activeEvents", labelKey: "map.activeEvents", icon: "⚡", defaultOn: true },
    ],
  },
  {
    headerKey: "map.militaryGroup",
    color: "#3b82f6",
    layers: [
      { key: "militaryBases", labelKey: "map.militaryBases", icon: "✈", defaultOn: false },
      { key: "nuclearFacilities", labelKey: "map.nuclearFacilities", icon: "☢", defaultOn: false },
    ],
  },
  {
    headerKey: "map.infraGroup",
    color: "#f59e0b",
    layers: [
      { key: "oilGas", labelKey: "map.oilGas", icon: "🛢", defaultOn: false },
      { key: "desalination", labelKey: "map.desalination", icon: "💧", defaultOn: false },
      { key: "ports", labelKey: "map.ports", icon: "⚓", defaultOn: false },
      { key: "telecomCables", labelKey: "map.telecomCables", icon: "◉", defaultOn: false },
    ],
  },
  {
    headerKey: "map.overlayGroup",
    color: "#a78bfa",
    layers: [
      { key: "chokepoints", labelKey: "map.chokepoints", icon: "🚧", defaultOn: false },
    ],
  },
];

export function EventMap() {
  const { t, lang } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const baseMarkersRef = useRef<any[]>([]);
  const nuclearMarkersRef = useRef<any[]>([]);
  const oilGasMarkersRef = useRef<any[]>([]);
  const desalMarkersRef = useRef<any[]>([]);
  const portMarkersRef = useRef<any[]>([]);
  const cableMarkersRef = useRef<any[]>([]);
  const countryLayerReady = useRef(false);
  const hoverPopupRef = useRef<any>(null);
  const eventsRef = useRef<ApiEvent[]>([]);
  const countryRiskRef = useRef<CountryRiskMap>({});
  const savedLayersRef = useRef<MapLayers | null>(null);

  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [layers, setLayers] = useState<MapLayers>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("atlas-map-layers-v2");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { ...DEFAULT_LAYERS };
  });

  const isAr = lang === "ar";

  const events = useCommandStore((s) => s.events);
  const regionFilter = useCommandStore((s) => s.regionFilter);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const setSelectedCountry = useCommandStore((s) => s.setSelectedCountry);
  const mapFlyTarget = useCommandStore((s) => s.mapFlyTarget);
  const setMapFlyTarget = useCommandStore((s) => s.setMapFlyTarget);
  const situationView = useCommandStore((s) => s.situationView);

  const countryRisk = useMemo(() => computeCountryRisk(events), [events]);

  // Count active layers for badge
  const activeLayerCount = useMemo(() => {
    return Object.values(layers).filter(Boolean).length;
  }, [layers]);

  // Fly to target when triggered by chat panel
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapFlyTarget) return;
    map.flyTo({
      center: [mapFlyTarget.lng, mapFlyTarget.lat],
      zoom: mapFlyTarget.zoom || 7,
      duration: 1500,
      essential: true,
    });
    setMapFlyTarget(null);
  }, [mapFlyTarget, setMapFlyTarget]);

  // Auto-toggle all layers in defense view
  useEffect(() => {
    if (situationView === "defense") {
      savedLayersRef.current = { ...layers };
      setLayers({
        threatFills: true,
        activeEvents: true,
        militaryBases: true,
        nuclearFacilities: true,
        oilGas: true,
        desalination: true,
        ports: true,
        telecomCables: true,
        chokepoints: true,
      });
    } else if (savedLayersRef.current) {
      setLayers(savedLayersRef.current);
      savedLayersRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situationView]);

  // Persist layer prefs
  useEffect(() => {
    if (situationView !== "defense") {
      try { localStorage.setItem("atlas-map-layers-v2", JSON.stringify(layers)); } catch {}
    }
  }, [layers, situationView]);

  const toggleLayer = useCallback((key: keyof MapLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleGroupCollapse = useCallback((headerKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(headerKey)) next.delete(headerKey);
      else next.add(headerKey);
      return next;
    });
  }, []);

  const enableAllLayers = useCallback(() => {
    const all: MapLayers = { ...layers };
    (Object.keys(all) as (keyof MapLayers)[]).forEach((k) => { all[k] = true; });
    setLayers(all);
  }, [layers]);

  const resetLayers = useCallback(() => {
    setLayers({ ...DEFAULT_LAYERS });
  }, []);

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
        // Apply initial risk colors and threat fills
        applyCountryRiskColors(map, countryRiskRef.current);
        applyThreatFills(map);
        // Setup hover interaction
        setupCountryHover(map, popup, maplibregl);
        // Setup country click → opens CountryIntelPanel
        setupCountryClick(map);
        // Apply language to map labels
        setMapLanguage(map, lang);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
    return () => { cancelled = true; };
  }, []);

  // Switch map labels when language changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) {
      setMapLanguage(map, lang);
    } else {
      map.once("styledata", () => setMapLanguage(map, lang));
    }
  }, [lang]);

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

  // Toggle threat fill visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !countryLayerReady.current) return;
    try {
      const vis = layers.threatFills ? "visible" : "none";
      if (map.getLayer("atlas-threat-fill")) map.setLayoutProperty("atlas-threat-fill", "visibility", vis);
      if (map.getLayer("atlas-threat-border")) map.setLayoutProperty("atlas-threat-border", "visibility", vis);
    } catch {}
  }, [layers.threatFills]);

  // Update event markers — only show when activeEvents layer is on
  useEffect(() => {
    if (!mapRef.current) return;
    // Always remove old markers first
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!layers.activeEvents) return;

    import("maplibre-gl").then((maplibregl) => {
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

        const displayTitle = getLocalizedField(event, "title", lang);
        const displaySector = translateTag(event.sector, lang);

        const popup = new maplibregl.Popup({
          offset: 8, closeButton: false, maxWidth: "260px",
        }).setHTML(`
          <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10px;${isAr ? "direction:rtl;text-align:right;" : ""}">
            <div style="color: ${color}; font-weight: 600; margin-bottom: 3px;">${event.risk_level} · ${event.risk_score}/100</div>
            <div style="color: #e2e8f0; font-weight: 500; margin-bottom: 2px;">${displayTitle || event.title}</div>
            <div style="color: #64748b;">${event.region} · ${displaySector}</div>
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
  }, [events, setSelectedEvent, setActiveSection, layers.activeEvents]);

  // Military bases layer
  useEffect(() => {
    if (!mapRef.current) return;
    baseMarkersRef.current.forEach((m) => m.remove());
    baseMarkersRef.current = [];
    if (!layers.militaryBases) return;

    import("maplibre-gl").then(async (maplibregl) => {
      try {
        const res = await fetch("/data/military-bases.geojson");
        const data = await res.json();
        for (const feature of data.features) {
          const p = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          const color = OPERATOR_COLORS[p.operatorGroup] || "#64748b";
          const icon = BASE_TYPE_ICONS[p.type] || "●";

          const el = document.createElement("div");
          el.style.cssText = `
            width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
            font-size: 9px; cursor: pointer; border-radius: 2px;
            background: ${color}25; border: 1px solid ${color}60; color: ${color};
            transition: transform 0.15s ease;
          `;
          el.textContent = icon;
          el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
          el.onmouseleave = () => { el.style.transform = "scale(1)"; };

          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const sig = isAr && p.significanceAr ? p.significanceAr : p.significance;
          const popupHtml = `
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:180px;">
              <div style="color:${color};font-weight:600;margin-bottom:3px;">${name}</div>
              <div style="color:#94a3b8;font-size:9px;">${p.operator} · ${p.type.replace(/_/g, " ")}</div>
              ${sig ? `<div style="color:#cbd5e1;font-size:9px;margin-top:4px;">${sig}</div>` : ""}
              <div style="color:#64748b;font-size:8px;margin-top:3px;">${p.country}</div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, maxWidth: "240px" }).setHTML(popupHtml);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
          baseMarkersRef.current.push(marker);
        }
      } catch (e) {
        console.warn("Failed to load military bases:", e);
      }
    });
  }, [layers.militaryBases, isAr]);

  // Nuclear facilities layer
  useEffect(() => {
    if (!mapRef.current) return;
    nuclearMarkersRef.current.forEach((m) => m.remove());
    nuclearMarkersRef.current = [];
    if (!layers.nuclearFacilities) return;

    import("maplibre-gl").then(async (maplibregl) => {
      try {
        const res = await fetch("/data/nuclear-facilities.geojson");
        const data = await res.json();
        for (const feature of data.features) {
          const p = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          const color = NUCLEAR_COLORS[p.type] || "#ca8a04";

          const el = document.createElement("div");
          el.style.cssText = `
            width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
            font-size: 12px; cursor: pointer;
            background: ${color}20; border: 1.5px solid ${color}80; border-radius: 50%;
            color: ${color}; transition: transform 0.15s ease;
          `;
          el.textContent = "☢";
          el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
          el.onmouseleave = () => { el.style.transform = "scale(1)"; };

          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const sig = isAr && p.significanceAr ? p.significanceAr : p.significance;
          const popupHtml = `
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:180px;">
              <div style="color:${color};font-weight:600;margin-bottom:3px;">☢ ${name}</div>
              <div style="color:#94a3b8;font-size:9px;">${p.type.replace(/_/g, " ")}</div>
              ${sig ? `<div style="color:#cbd5e1;font-size:9px;margin-top:4px;">${sig}</div>` : ""}
              <div style="color:#64748b;font-size:8px;margin-top:3px;">${p.country}</div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, maxWidth: "240px" }).setHTML(popupHtml);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
          nuclearMarkersRef.current.push(marker);
        }
      } catch (e) {
        console.warn("Failed to load nuclear facilities:", e);
      }
    });
  }, [layers.nuclearFacilities, isAr]);

  // Oil & Gas infrastructure layer
  useEffect(() => {
    if (!mapRef.current) return;
    oilGasMarkersRef.current.forEach((m) => m.remove());
    oilGasMarkersRef.current = [];
    if (!layers.oilGas) return;

    import("maplibre-gl").then(async (maplibregl) => {
      try {
        const res = await fetch("/data/oil-gas-infrastructure.geojson");
        const data = await res.json();
        for (const feature of data.features) {
          const p = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          const color = OIL_TYPE_COLORS[p.type] || "#f59e0b";
          const icon = OIL_TYPE_ICONS[p.type] || "●";

          const el = document.createElement("div");
          el.style.cssText = `
            width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
            font-size: 10px; cursor: pointer; border-radius: 3px;
            background: ${color}20; border: 1.5px solid ${color}60; color: ${color};
            transition: transform 0.15s ease;
          `;
          el.textContent = icon;
          el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
          el.onmouseleave = () => { el.style.transform = "scale(1)"; };

          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const sig = isAr && p.significanceAr ? p.significanceAr : p.significance;
          const popupHtml = `
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:180px;">
              <div style="color:${color};font-weight:600;margin-bottom:3px;">${name}</div>
              <div style="color:#94a3b8;font-size:9px;">${p.operator} · ${p.type.replace(/_/g, " ")}</div>
              <div style="color:#cbd5e1;font-size:9px;margin-top:2px;">${p.capacity}</div>
              ${sig ? `<div style="color:#cbd5e1;font-size:9px;margin-top:4px;">${sig}</div>` : ""}
              <div style="color:#64748b;font-size:8px;margin-top:3px;">${p.country}</div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, maxWidth: "260px" }).setHTML(popupHtml);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
          oilGasMarkersRef.current.push(marker);
        }
      } catch (e) {
        console.warn("Failed to load oil & gas infrastructure:", e);
      }
    });
  }, [layers.oilGas, isAr]);

  // Desalination plants layer
  useEffect(() => {
    if (!mapRef.current) return;
    desalMarkersRef.current.forEach((m) => m.remove());
    desalMarkersRef.current = [];
    if (!layers.desalination) return;

    import("maplibre-gl").then(async (maplibregl) => {
      try {
        const res = await fetch("/data/desalination-plants.geojson");
        const data = await res.json();
        for (const feature of data.features) {
          const p = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          const color = "#38bdf8";

          const el = document.createElement("div");
          el.style.cssText = `
            width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
            font-size: 11px; cursor: pointer; border-radius: 50%;
            background: ${color}18; border: 1.5px solid ${color}60; color: ${color};
            transition: transform 0.15s ease;
          `;
          el.textContent = "💧";
          el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
          el.onmouseleave = () => { el.style.transform = "scale(1)"; };

          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const sig = isAr && p.significanceAr ? p.significanceAr : p.significance;
          const popupHtml = `
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:180px;">
              <div style="color:${color};font-weight:600;margin-bottom:3px;">💧 ${name}</div>
              <div style="color:#94a3b8;font-size:9px;">${p.operator} · ${p.type.replace(/_/g, " ")}</div>
              <div style="color:#cbd5e1;font-size:9px;margin-top:2px;">${p.capacity}</div>
              ${sig ? `<div style="color:#cbd5e1;font-size:9px;margin-top:4px;">${sig}</div>` : ""}
              <div style="color:#64748b;font-size:8px;margin-top:3px;">${p.country}</div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, maxWidth: "260px" }).setHTML(popupHtml);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
          desalMarkersRef.current.push(marker);
        }
      } catch (e) {
        console.warn("Failed to load desalination plants:", e);
      }
    });
  }, [layers.desalination, isAr]);

  // Ports & Shipping layer
  useEffect(() => {
    if (!mapRef.current) return;
    portMarkersRef.current.forEach((m) => m.remove());
    portMarkersRef.current = [];
    if (!layers.ports) return;

    import("maplibre-gl").then(async (maplibregl) => {
      try {
        const res = await fetch("/data/ports-shipping.geojson");
        const data = await res.json();
        for (const feature of data.features) {
          const p = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          const color = PORT_TYPE_COLORS[p.type] || "#06b6d4";

          const el = document.createElement("div");
          el.style.cssText = `
            width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
            font-size: 10px; cursor: pointer; border-radius: 2px;
            background: ${color}20; border: 1.5px solid ${color}60; color: ${color};
            transition: transform 0.15s ease;
          `;
          el.textContent = "⚓";
          el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
          el.onmouseleave = () => { el.style.transform = "scale(1)"; };

          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const sig = isAr && p.significanceAr ? p.significanceAr : p.significance;
          const popupHtml = `
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:180px;">
              <div style="color:${color};font-weight:600;margin-bottom:3px;">⚓ ${name}</div>
              <div style="color:#94a3b8;font-size:9px;">${p.operator} · ${p.type.replace(/_/g, " ")}</div>
              <div style="color:#cbd5e1;font-size:9px;margin-top:2px;">${p.capacity}</div>
              ${sig ? `<div style="color:#cbd5e1;font-size:9px;margin-top:4px;">${sig}</div>` : ""}
              <div style="color:#64748b;font-size:8px;margin-top:3px;">${p.country}</div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, maxWidth: "260px" }).setHTML(popupHtml);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
          portMarkersRef.current.push(marker);
        }
      } catch (e) {
        console.warn("Failed to load ports:", e);
      }
    });
  }, [layers.ports, isAr]);

  // Telecom / Submarine cables layer
  useEffect(() => {
    if (!mapRef.current) return;
    cableMarkersRef.current.forEach((m) => m.remove());
    cableMarkersRef.current = [];
    if (!layers.telecomCables) return;

    import("maplibre-gl").then(async (maplibregl) => {
      try {
        const res = await fetch("/data/telecom-cables.geojson");
        const data = await res.json();
        for (const feature of data.features) {
          const p = feature.properties;
          const [lng, lat] = feature.geometry.coordinates;
          const color = "#a78bfa";

          const el = document.createElement("div");
          el.style.cssText = `
            width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
            font-size: 9px; cursor: pointer; border-radius: 50%;
            background: ${color}18; border: 1.5px solid ${color}60; color: ${color};
            transition: transform 0.15s ease;
          `;
          el.textContent = "◉";
          el.onmouseenter = () => { el.style.transform = "scale(1.3)"; };
          el.onmouseleave = () => { el.style.transform = "scale(1)"; };

          const name = isAr && p.nameAr ? p.nameAr : p.name;
          const sig = isAr && p.significanceAr ? p.significanceAr : p.significance;
          const popupHtml = `
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:200px;">
              <div style="color:${color};font-weight:600;margin-bottom:3px;">◉ ${name}</div>
              <div style="color:#94a3b8;font-size:9px;">${p.type.replace(/_/g, " ")}</div>
              <div style="color:#cbd5e1;font-size:9px;margin-top:2px;">${p.cables}</div>
              ${sig ? `<div style="color:#cbd5e1;font-size:9px;margin-top:4px;">${sig}</div>` : ""}
              <div style="color:#64748b;font-size:8px;margin-top:3px;">${p.country}</div>
            </div>
          `;

          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, maxWidth: "280px" }).setHTML(popupHtml);
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
          cableMarkersRef.current.push(marker);
        }
      } catch (e) {
        console.warn("Failed to load telecom cables:", e);
      }
    });
  }, [layers.telecomCables, isAr]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={mapContainer} className="h-full w-full" />

      {/* ═══ LAYERS BUTTON + PANEL ═══ */}
      <div className="absolute top-3 z-10" style={{ right: isAr ? "auto" : "12px", left: isAr ? "12px" : "auto" }}>
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm font-mono text-[10px] tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
          style={{ background: "rgba(13,17,23,0.9)", border: "1px solid #1e2530" }}
        >
          ≡ {t("map.layers" as any)}
          <span
            className="flex items-center justify-center rounded-full font-mono text-[8px] font-bold text-white"
            style={{ background: "#3b82f6", width: 16, height: 16, marginLeft: 4 }}
          >
            {activeLayerCount}
          </span>
        </button>

        {layerPanelOpen && (
          <div
            className="mt-1 backdrop-blur-sm overflow-y-auto"
            style={{
              background: "#0a0e1a",
              border: "1px solid #1e2530",
              width: 220,
              maxHeight: "70vh",
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <span className="font-mono text-[10px] tracking-[2px] text-blue-500">{t("map.layers" as any)}</span>
              <button
                onClick={() => setLayerPanelOpen(false)}
                className="font-mono text-[10px] text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            </div>

            {/* Layer groups */}
            {LAYER_GROUPS.map((group) => {
              const isCollapsed = collapsedGroups.has(group.headerKey);
              return (
                <div key={group.headerKey}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroupCollapse(group.headerKey)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/[0.02]"
                    style={{ background: "#0d1117" }}
                  >
                    <span
                      className="font-mono text-[9px] tracking-[2px]"
                      style={{ color: group.color }}
                    >
                      {t(group.headerKey as any)}
                    </span>
                    <span
                      className="font-mono text-[9px] text-slate-600 transition-transform"
                      style={{ transform: isCollapsed ? "rotate(180deg)" : "none" }}
                    >
                      ∧
                    </span>
                  </button>

                  {/* Layer rows */}
                  {!isCollapsed && group.layers.map((layerDef) => {
                    const isOn = layers[layerDef.key];
                    return (
                      <label
                        key={layerDef.key}
                        className="flex items-center gap-2 px-3 cursor-pointer hover:bg-white/[0.02]"
                        style={{ height: 36 }}
                      >
                        {/* Toggle switch */}
                        <div
                          className="relative shrink-0"
                          style={{ width: 28, height: 16 }}
                          onClick={(e) => { e.preventDefault(); toggleLayer(layerDef.key); }}
                        >
                          <div
                            className="absolute inset-0 rounded-full transition-colors"
                            style={{ background: isOn ? "#3b82f6" : "#374151" }}
                          />
                          <div
                            className="absolute top-[2px] h-[12px] w-[12px] rounded-full bg-white transition-transform"
                            style={{ transform: isOn ? "translateX(14px)" : "translateX(2px)" }}
                          />
                        </div>
                        {/* Icon + name */}
                        <span className="text-[14px] shrink-0" style={{ width: 16, textAlign: "center" }}>{layerDef.icon}</span>
                        <span
                          className="font-sans text-[12px] truncate"
                          style={{ color: isOn ? "#e5e7eb" : "#6b7280" }}
                        >
                          {t(layerDef.labelKey as any)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}

            {/* Operator legend when military bases on */}
            {layers.militaryBases && (
              <div className="px-3 py-2 border-t border-white/[0.06]">
                <div className="font-mono text-[8px] tracking-widest text-slate-600 mb-1">
                  {t("map.operator" as any)}
                </div>
                {Object.entries(OPERATOR_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1.5 py-0.5">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="font-mono text-[8px] text-slate-500">{key}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom buttons */}
            <div className="flex gap-2 px-3 py-2 border-t border-white/[0.06]">
              <button
                onClick={enableAllLayers}
                className="flex-1 py-1.5 font-mono text-[9px] tracking-wider text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
              >
                {t("map.enableAll" as any)}
              </button>
              <button
                onClick={resetLayers}
                className="flex-1 py-1.5 font-mono text-[9px] tracking-wider text-slate-400 border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
              >
                {t("map.reset" as any)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ THREAT ASSESSMENT LEGEND ═══ */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3 py-1.5 backdrop-blur-sm z-10"
        style={{ background: "rgba(0,0,0,0.7)", borderRadius: 2 }}
      >
        {([
          { key: "critical", color: "rgba(220,38,38,0.8)", dot: "●" },
          { key: "high", color: "rgba(234,88,12,0.8)", dot: "●" },
          { key: "elevated", color: "rgba(202,138,4,0.8)", dot: "●" },
          { key: "monitoring", color: "rgba(37,99,235,0.6)", dot: "●" },
          { key: "stable", color: "#6b7280", dot: "○" },
        ] as const).map((item) => (
          <div key={item.key} className="flex items-center gap-1">
            <span style={{ color: item.color, fontSize: 8 }}>{item.dot}</span>
            <span className="font-mono text-[9px] tracking-wider" style={{ color: item.color }}>
              {t(`map.threatLegend.${item.key}` as any)}
            </span>
          </div>
        ))}
      </div>

      {/* ═══ COUNTRY RISK LEGEND ═══ */}
      <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-atlas-bg/80 border border-white/[0.06] px-3 py-1.5 backdrop-blur-sm">
        <span className="font-mono text-[8px] tracking-wider text-slate-500">
          {isAr ? "الخطر" : "RISK"}
        </span>
        {[
          { label: isAr ? "حرج" : "CRITICAL", color: "rgba(239,68,68,0.6)" },
          { label: isAr ? "عالٍ" : "HIGH", color: "rgba(249,115,22,0.5)" },
          { label: isAr ? "متوسط" : "MEDIUM", color: "rgba(234,179,8,0.4)" },
          { label: isAr ? "منخفض" : "LOW", color: "rgba(34,197,94,0.3)" },
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
      } catch {}

      setSelectedCountry(iso3);
    });

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

  // --- Hover handler setup ---
  function setupCountryHover(map: any, popup: any, maplibregl: any) {
    let hoveredId: string | null = null;

    map.on("mousemove", "atlas-country-fill", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const iso3 = e.features[0].properties?.iso_a3;
      const iso2 = e.features[0].properties?.iso_a2;
      if (!iso3 || iso3 === hoveredId) return;
      hoveredId = iso3;

      // Get threat level from static data or event-based risk
      const staticThreat = iso2 ? STATIC_THREAT_LEVELS[iso2] : undefined;
      const risk = countryRiskRef.current[iso3];
      const threatLevel = staticThreat || (risk ? risk.level : "MONITORING");
      const threatColor = THREAT_COLORS[threatLevel as ThreatLevel] || THREAT_COLORS.MONITORING;

      const name = ISO3_TO_NAME[iso3] || iso3;
      const eventCount = risk?.events.length || 0;

      if (!risk && !staticThreat) {
        popup.remove();
        return;
      }

      const eventLines = risk
        ? risk.events
            .slice(0, 5)
            .map((ev) => {
              const evTitle = getLocalizedField(ev, "title", lang) || ev.title;
              const evSector = translateTag(ev.sector, lang);
              return `<div style="margin: 4px 0; padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                <div style="color: ${RISK_COLORS[ev.risk_level] || "#3b82f6"}; font-size: 8px; font-weight: 600;">${ev.risk_level} · ${ev.risk_score}</div>
                <div style="color: #cbd5e1; font-size: 10px;">${evTitle.slice(0, 60)}</div>
                <div style="color: #64748b; font-size: 8px;">${evSector}</div>
              </div>`;
            })
            .join("")
        : "";

      const moreCount = risk && risk.events.length > 5 ? `<div style="color:#64748b;font-size:8px;margin-top:4px;">+${risk.events.length - 5} more</div>` : "";

      const threatLabelAr: Record<string, string> = {
        CRITICAL: "حرج", HIGH: "عالٍ", ELEVATED: "مرتفع", MONITORING: "مراقبة", STABLE: "مستقر",
      };

      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-family: 'IBM Plex Mono', monospace; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <span style="color: #e2e8f0; font-size: 12px; font-weight: 600;">${name}</span>
              <span style="font-size: 9px; font-weight: 700; padding: 1px 6px;"
                    style="color: ${threatColor}; background: ${threatColor}20; border: 1px solid ${threatColor}40;">
                ${isAr ? threatLabelAr[threatLevel] || threatLevel : threatLevel}
              </span>
            </div>
            ${eventCount > 0 ? `<div style="color: #94a3b8; font-size: 9px; margin-bottom: 4px;">${eventCount} ${isAr ? "حدث نشط" : "active events"}</div>` : `<div style="color: #64748b; font-size: 9px;">${isAr ? "لا أحداث نشطة" : "No active events"}</div>`}
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

    map.on("mouseenter", "atlas-country-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "atlas-country-fill", () => {
      map.getCanvas().style.cursor = "";
    });
  }
}

// ─── Apply static threat fills ────────────────────────────────────

function applyThreatFills(map: any) {
  try {
    if (!map.getLayer("atlas-threat-fill")) return;

    // Build match expression for ISO-2 codes
    const fillExpr: any[] = ["match", ["get", "iso_a2"]];
    const borderExpr: any[] = ["match", ["get", "iso_a2"]];

    // Add all static threat level entries
    for (const [iso2, level] of Object.entries(STATIC_THREAT_LEVELS)) {
      fillExpr.push(iso2, THREAT_COLORS[level]);
      if (level === "CRITICAL") {
        borderExpr.push(iso2, THREAT_BORDER_COLORS.CRITICAL);
      }
    }
    // Default: MONITORING for unlisted countries
    fillExpr.push(THREAT_COLORS.MONITORING);
    borderExpr.push("rgba(0,0,0,0)");

    map.setPaintProperty("atlas-threat-fill", "fill-color", fillExpr);
    map.setPaintProperty("atlas-threat-border", "line-color", borderExpr);
  } catch {
    // Layers not ready
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

async function loadCountryBoundaries(map: any) {
  try {
    const resp = await fetch(COUNTRIES_TOPO_URL);
    const topo = await resp.json();

    const topojson = await import("topojson-client");
    const geojson = topojson.feature(topo, topo.objects.countries) as any;

    for (const f of geojson.features) {
      f.properties = f.properties || {};
      const iso3 = NUMERIC_TO_ISO3[f.id] || "";
      const iso2 = NUMERIC_TO_ISO2[f.id] || "";
      f.properties.iso_a3 = iso3;
      f.properties.iso_a2 = iso2;
    }

    map.addSource("atlas-countries", { type: "geojson", data: geojson });

    // Find a label layer to insert beneath
    const layers = map.getStyle()?.layers || [];
    let insertBefore: string | undefined;
    for (const l of layers) {
      if (l.type === "symbol" || l.id.includes("label") || l.id.includes("place")) {
        insertBefore = l.id;
        break;
      }
    }

    // Static threat fill layer (below event-based risk)
    // Only render countries that have a valid ISO-2 code to avoid broken polygons
    map.addLayer({
      id: "atlas-threat-fill",
      type: "fill",
      source: "atlas-countries",
      filter: ["!=", ["get", "iso_a2"], ""],
      paint: {
        "fill-color": THREAT_COLORS.MONITORING,
        "fill-color-transition": { duration: 1000, delay: 0 },
      },
    }, insertBefore);

    // Threat border (for CRITICAL countries)
    map.addLayer({
      id: "atlas-threat-border",
      type: "line",
      source: "atlas-countries",
      filter: ["!=", ["get", "iso_a2"], ""],
      paint: {
        "line-color": "rgba(0,0,0,0)",
        "line-width": 1,
        "line-blur": 2,
      },
    }, insertBefore);

    // Event-based risk fill (overlays on top of threat fill)
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
