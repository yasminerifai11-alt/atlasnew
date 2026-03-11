"use client";

import { useEffect, useRef } from "react";
import { useCommandStore } from "@/stores/command-store";
import { getFilterViewport, GLOBAL_VIEW } from "@/data/regions";
import type { ApiEvent } from "@/lib/api";

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

export function EventMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const events = useCommandStore((s) => s.events);
  const regionFilter = useCommandStore((s) => s.regionFilter);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);

  // Initialize map
  useEffect(() => {
    import("maplibre-gl").then((maplibregl) => {
      if (!mapContainer.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: GLOBAL_VIEW.center,
        zoom: GLOBAL_VIEW.zoom,
        attributionControl: false,
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
  }, []);

  // Pan/zoom map when region filter changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const viewport = getFilterViewport(regionFilter);
    map.flyTo({
      center: viewport.center,
      zoom: viewport.zoom,
      duration: 1200,
      essential: true,
    });
  }, [regionFilter]);

  // Update markers when events change
  useEffect(() => {
    if (!mapRef.current) return;

    import("maplibre-gl").then((maplibregl) => {
      // Clear existing markers
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
          ${isCritical ? `animation: atlas-pulse 2s ease-in-out infinite;` : ""}
        `;
        // Inject pulse keyframes once
        if (isCritical && !document.getElementById("atlas-pulse-style")) {
          const style = document.createElement("style");
          style.id = "atlas-pulse-style";
          style.textContent = `
            @keyframes atlas-pulse {
              0%, 100% { box-shadow: 0 0 ${size}px ${color}60; transform: scale(1); }
              50% { box-shadow: 0 0 ${size * 2}px ${color}90; transform: scale(1.15); }
            }
          `;
          document.head.appendChild(style);
        }
        // Stagger marker appearance
        setTimeout(() => { el.style.opacity = "0.85"; }, index * 80);
        el.onmouseenter = () => { el.style.transform = "scale(1.4)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const popup = new maplibregl.Popup({
          offset: 8,
          closeButton: false,
          maxWidth: "260px",
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
    </div>
  );
}
