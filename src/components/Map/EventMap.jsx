import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ZoomControl } from "react-leaflet";
import { RISK_COLORS } from "../../data/events";
import { useTheme } from "../../context/ThemeContext";
import "leaflet/dist/leaflet.css";

function MapController({ countryInfo, selected }) {
  const map = useMap();
  const prevCountryRef = useRef(null);

  // Fly to country when country changes
  useEffect(() => {
    if (countryInfo) {
      const key = `${countryInfo.lat}-${countryInfo.lng}`;
      if (prevCountryRef.current !== key) {
        map.flyTo([countryInfo.lat, countryInfo.lng], countryInfo.zoom || 4, { duration: 1.5 });
        prevCountryRef.current = key;
      }
    }
  }, [countryInfo, map]);

  // Fly to selected event within current view
  useEffect(() => {
    if (selected) {
      const bounds = map.getBounds();
      if (!bounds.contains([selected.latitude, selected.longitude])) {
        map.flyTo([selected.latitude, selected.longitude], map.getZoom(), { duration: 1.0 });
      }
    }
  }, [selected, map]);

  return null;
}

const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

export default function EventMap({ events, selected, onSelect, collapsed, onToggle, countryInfo }) {
  const { theme, themeName } = useTheme();

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={onToggle} style={{
        position: "absolute", top: 8, right: 12, zIndex: 1000,
        background: themeName === "dark" ? "rgba(8,12,20,0.85)" : "rgba(255,255,255,0.9)",
        border: `1px solid ${theme.border}`,
        color: theme.textMuted, fontFamily: "'Space Mono', monospace", fontSize: 10,
        padding: "4px 10px", borderRadius: 3, cursor: "pointer", letterSpacing: "0.08em"
      }}>
        {collapsed ? "▼ SHOW MAP" : "▲ HIDE MAP"}
      </button>
      {!collapsed && (
        <div style={{ height: 300, borderBottom: `1px solid ${theme.border}` }}>
          <MapContainer
            center={[countryInfo?.lat || 25, countryInfo?.lng || 48]}
            zoom={countryInfo?.zoom || 4}
            style={{ height: "100%", width: "100%", background: theme.bg }}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
          >
            <ZoomControl position="bottomright" />
            <TileLayer url={TILE_URLS[themeName] || TILE_URLS.dark} />
            <MapController countryInfo={countryInfo} selected={selected} />
            {events.map(ev => {
              const c = RISK_COLORS[ev.risk_level];
              const isSelected = selected?.id === ev.id;
              const isDirect = ev.relevance === "direct" || ev.relevance === "global";
              const baseRadius = ev.risk_level === "CRITICAL" ? 12 : ev.risk_level === "HIGH" ? 10 : ev.risk_level === "MEDIUM" ? 8 : 6;
              const radius = isSelected ? baseRadius + 4 : baseRadius;
              return (
                <CircleMarker
                  key={ev.id}
                  center={[ev.latitude, ev.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: isSelected ? (themeName === "dark" ? "#ffffff" : "#0f172a") : c.border,
                    fillColor: c.border,
                    fillOpacity: isDirect ? (isSelected ? 0.9 : 0.7) : (isSelected ? 0.7 : 0.35),
                    weight: isSelected ? 2 : 1,
                    dashArray: isDirect ? null : "4 4",
                  }}
                  eventHandlers={{ click: () => onSelect(ev) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{ev.title}</div>
                      <div>{ev.risk_level} · {ev.region}</div>
                      {ev.relevance && ev.relevance !== "global" && (
                        <div style={{
                          fontSize: 9, marginTop: 4, padding: "2px 6px", borderRadius: 2, display: "inline-block",
                          background: ev.relevance === "direct" ? "rgba(59,130,246,0.15)" : "rgba(245,158,11,0.15)",
                          color: ev.relevance === "direct" ? "#3b82f6" : "#f59e0b",
                        }}>
                          {ev.relevance === "direct" ? "DIRECT THREAT" : "SPILLOVER RISK"}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                        {new Date(ev.event_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
