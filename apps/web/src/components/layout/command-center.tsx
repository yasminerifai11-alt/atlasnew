"use client";

import { useEffect, useCallback, useRef } from "react";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore } from "@/stores/profile-store";
import { fetchEvents, fetchNewsEvents, retryApiConnection } from "@/lib/api";
import { TopBar } from "@/components/layout/top-bar";
import { StatusStrip } from "@/components/layout/status-strip";
import { EventMap } from "@/components/map/event-map";
import { Sidebar } from "@/components/sidebar/sidebar";
import { DefenseSidebar } from "@/components/defense/defense-sidebar";
import { DetailPanel } from "@/components/detail/detail-panel";
import { RealtimeBrief } from "@/components/realtime-brief/realtime-brief";
import { IntelligenceLibrary } from "@/components/library/intelligence-library";
import { CountryIntelPanel } from "@/components/country/country-intel-panel";
import { FloatingCommander } from "@/components/commander/floating-commander";
import { AlertModal } from "@/components/modals/alert-modal";
import { ProfileModal } from "@/components/modals/profile-modal";
import { CommandProfileModal } from "@/components/modals/command-profile-modal";

export function CommandCenter() {
  const activeSection = useCommandStore((s) => s.activeSection);
  const setActiveSection = useCommandStore((s) => s.setActiveSection);
  const setEvents = useCommandStore((s) => s.setEvents);
  const setEventsLoading = useCommandStore((s) => s.setEventsLoading);
  const setAlertModalOpen = useCommandStore((s) => s.setAlertModalOpen);
  const setSelectedEvent = useCommandStore((s) => s.setSelectedEvent);
  const alertModalOpen = useCommandStore((s) => s.alertModalOpen);
  const profileModalOpen = useCommandStore((s) => s.profileModalOpen);
  const profileModalOpen2 = useProfileStore((s) => s.modalOpen);
  const selectedCountry = useCommandStore((s) => s.selectedCountry);
  const setSelectedCountry = useCommandStore((s) => s.setSelectedCountry);
  const setProfileModalOpen = useCommandStore((s) => s.setProfileModalOpen);
  const closeProfileModal = useProfileStore((s) => s.closeModal);
  const situationView = useCommandStore((s) => s.situationView);
  const setSituationView = useCommandStore((s) => s.setSituationView);

  // Load events on mount + refresh every 5 minutes
  // Merges backend/seed events with live news feed events
  const loadEvents = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setEventsLoading(true);
    try {
      retryApiConnection();
      // Fetch backend events and live news in parallel
      const [backendResult, newsEvents] = await Promise.all([
        fetchEvents({ limit: 50 }).catch(() => ({ events: [], total: 0 })),
        fetchNewsEvents().catch(() => []),
      ]);

      const backendEvents = backendResult.events || [];

      // Merge: deduplicate by title similarity, news events get IDs starting at 90000
      const seenTitles = new Set(backendEvents.map(e => e.title.toLowerCase().slice(0, 40)));
      const uniqueNews = newsEvents.filter(
        (ne) => !seenTitles.has(ne.title.toLowerCase().slice(0, 40))
      );

      const merged = [...backendEvents, ...uniqueNews].sort(
        (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime()
      );

      setEvents(merged.length > 0 ? merged : backendEvents);
    } catch {
      if (!isRefresh) setEvents([]);
    }
    if (!isRefresh) setEventsLoading(false);
  }, [setEvents, setEventsLoading]);

  useEffect(() => {
    loadEvents(false);
    const interval = setInterval(() => loadEvents(true), 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, [loadEvents]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      switch (e.key) {
        case "s":
        case "S":
          e.preventDefault();
          setActiveSection("situation");
          break;
        case "d":
        case "D":
          e.preventDefault();
          // Toggle defense view within situation room
          if (activeSection === "situation") {
            setSituationView(situationView === "defense" ? "intelligence" : "defense");
          } else {
            setActiveSection("situation");
            setSituationView("defense");
          }
          break;
        case "r":
        case "R":
          e.preventDefault();
          setActiveSection("realtime-brief");
          break;
        case "l":
        case "L":
          e.preventDefault();
          setActiveSection("library");
          break;
        case "a":
        case "A":
          e.preventDefault();
          setAlertModalOpen(true);
          break;
        case "Escape":
          // Close modals and panels in priority order
          if (alertModalOpen) setAlertModalOpen(false);
          else if (profileModalOpen) setProfileModalOpen(false);
          else if (profileModalOpen2) closeProfileModal();
          else if (selectedCountry) setSelectedCountry(null);
          else if (activeSection === "intel") {
            setSelectedEvent(null);
            setActiveSection("situation");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, situationView, alertModalOpen, profileModalOpen, profileModalOpen2, selectedCountry, setActiveSection, setSituationView, setAlertModalOpen, setProfileModalOpen, closeProfileModal, setSelectedEvent, setSelectedCountry]);

  return (
    <div className="flex h-screen flex-col bg-atlas-bg text-slate-200 font-sans">
      <TopBar />

      {/* Section content */}
      {activeSection === "situation" && <SituationRoom />}
      {activeSection === "intel" && <IntelBriefView />}
      {activeSection === "realtime-brief" && <RealtimeBrief />}
      {activeSection === "library" && <IntelligenceLibrary />}

      {/* Floating Atlas Commander chat — visible on situation room (both views) */}
      <FloatingCommander />

      {/* Modals */}
      <AlertModal />
      <ProfileModal />
      <CommandProfileModal />
    </div>
  );
}

/** Situation Room: Map + Sidebar Priority Feed + Country Intel Panel */
function SituationRoom() {
  const situationView = useCommandStore((s) => s.situationView);

  return (
    <>
      <StatusStrip />
      <div className="relative flex flex-1 overflow-hidden">
        {situationView === "defense" ? <DefenseSidebar /> : <Sidebar />}
        <EventMap />
        <CountryIntelPanel />
      </div>
    </>
  );
}

/** Intel Brief: Full detail view */
function IntelBriefView() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <DetailPanel />
    </div>
  );
}
