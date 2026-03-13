import { useState, useEffect, useCallback, useRef } from "react";
import { COUNTRIES } from "./data/events";
import { useTheme } from "./context/ThemeContext";
import { useNotifications } from "./context/NotificationContext";
import { useSoundAlert } from "./hooks/useSoundAlert";
import { useEvents } from "./hooks/useEvents";
import TopBar from "./components/TopBar";
import StatusStrip from "./components/StatusStrip";
import CountryBriefBanner from "./components/Country/CountryBriefBanner";
import CountryQuickSwitcher from "./components/Country/CountryQuickSwitcher";
import DashboardStats from "./components/Dashboard/DashboardStats";
import Sidebar from "./components/Sidebar/Sidebar";
import DetailPanel from "./components/DetailPanel/DetailPanel";
import EventMap from "./components/Map/EventMap";
import EventTimeline from "./components/Timeline/EventTimeline";
import LeaderRecommendations from "./components/CommandCenter/LeaderRecommendations";

export default function AtlasCommand() {
  const { theme } = useTheme();
  const [countries, setCountries] = useState(["ALL"]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false);
  const [viewMode, setViewMode] = useState("command"); // "command" | "leader"
  const { addNotification } = useNotifications();
  const playAlert = useSoundAlert();
  const notifiedNewEvents = useRef(false);

  // ═══════════════════════════════════════
  // LIVE EVENT PIPELINE
  // ═══════════════════════════════════════
  const {
    events: liveEvents,
    loading: eventsLoading,
    lastUpdated,
    sourceCount,
    newEventCount,
    clearNewCount,
    forceRefresh,
    fingerprint,
  } = useEvents();

  // Handle country change — single select replaces, or toggle for multi
  const handleCountryChange = useCallback((code, multi = false) => {
    setCountries(prev => {
      if (code === "ALL") return ["ALL"];
      if (multi) {
        const without = prev.filter(c => c !== "ALL");
        if (without.includes(code)) {
          const result = without.filter(c => c !== code);
          return result.length === 0 ? ["ALL"] : result;
        }
        return [...without, code];
      }
      return [code];
    });
  }, []);

  // Filter events by selected countries
  const countryEvents = countries.includes("ALL")
    ? liveEvents.map(e => ({ ...e, relevance: "global", spillover_reason: null }))
    : liveEvents.filter(e => {
        if (!e.country) return false;
        return countries.includes(e.country);
      }).map(e => ({ ...e, relevance: "direct" }));

  // Apply risk level + search filters on top
  const filtered = countryEvents
    .filter(e => filter === "ALL" || e.risk_level === filter)
    .filter(e => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q)
        || e.region.toLowerCase().includes(q)
        || e.sector.toLowerCase().includes(q)
        || (e.what_is_happening || "").toLowerCase().includes(q);
    });

  // Auto-select first event when events load or country changes
  useEffect(() => {
    if (filtered.length > 0 && (!selected || !filtered.find(e => e.id === selected?.id))) {
      setSelected(filtered[0]);
    }
  }, [countries, filtered.length > 0, fingerprint]);

  // Notify on new events
  useEffect(() => {
    if (newEventCount > 0) {
      addNotification(`${newEventCount} new event${newEventCount > 1 ? "s" : ""} detected`, "INFO", 5000);
      clearNewCount();
    }
  }, [newEventCount]);

  // Startup notifications for critical events
  useEffect(() => {
    if (liveEvents.length > 0 && !notifiedNewEvents.current) {
      notifiedNewEvents.current = true;
      const criticals = liveEvents.filter(e => e.risk_level === "CRITICAL").slice(0, 3);
      criticals.forEach((e, i) => {
        setTimeout(() => {
          addNotification(`${e.title} — ${e.region}`, "CRITICAL", 8000);
          if (soundEnabled) playAlert("CRITICAL");
        }, 1000 + i * 1500);
      });
    }
  }, [liveEvents.length > 0]);

  // Ctrl+K to open quick switcher
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setQuickSwitcherOpen(o => !o);
      }
      if (e.key === "Escape") {
        setQuickSwitcherOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Compute map center from selected countries
  const primaryCountry = countries.includes("ALL") ? COUNTRIES.ALL : COUNTRIES[countries[0]] || COUNTRIES.ALL;

  return (
    <div style={{
      minHeight: "100vh", background: theme.bg, color: theme.text,
      fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column"
    }}>
      <TopBar
        onMenuToggle={() => setSidebarOpen(o => !o)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(s => !s)}
        countries={countries}
        onCountryChange={handleCountryChange}
        onOpenQuickSwitcher={() => setQuickSwitcherOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "leader" ? (
        <LeaderRecommendations events={filtered} onBack={() => setViewMode("command")} />
      ) : (
        <>
          <StatusStrip events={filtered} lastUpdated={lastUpdated} sourceCount={sourceCount} loading={eventsLoading} onRefresh={forceRefresh} />
          <CountryBriefBanner countryCodes={countries} events={filtered} />
          <DashboardStats events={filtered} />
          <EventTimeline events={filtered} selected={selected} onSelect={setSelected} />

          <div className="main-layout" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Sidebar
              events={filtered}
              selected={selected}
              onSelect={setSelected}
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              countries={countries}
              onCountryChange={handleCountryChange}
            />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <EventMap
                events={filtered}
                selected={selected}
                onSelect={setSelected}
                collapsed={mapCollapsed}
                onToggle={() => setMapCollapsed(c => !c)}
                countryInfo={primaryCountry}
              />
              <DetailPanel event={selected} />
            </div>
          </div>
        </>
      )}

      {quickSwitcherOpen && (
        <CountryQuickSwitcher
          countries={countries}
          onSelect={handleCountryChange}
          onClose={() => setQuickSwitcherOpen(false)}
        />
      )}
    </div>
  );
}
