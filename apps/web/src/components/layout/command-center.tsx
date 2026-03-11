"use client";

import { useEffect } from "react";
import { useCommandStore } from "@/stores/command-store";
import { fetchEvents } from "@/lib/api";
import { TopBar } from "@/components/layout/top-bar";
import { StatusStrip } from "@/components/layout/status-strip";
import { EventMap } from "@/components/map/event-map";
import { Sidebar } from "@/components/sidebar/sidebar";
import { DetailPanel } from "@/components/detail/detail-panel";
import { AtlasCommander } from "@/components/commander/atlas-commander";
import { RealtimeBrief } from "@/components/realtime-brief/realtime-brief";
import { IntelligenceLibrary } from "@/components/library/intelligence-library";
import { AlertModal } from "@/components/modals/alert-modal";
import { ProfileModal } from "@/components/modals/profile-modal";
import { CommandProfileModal } from "@/components/modals/command-profile-modal";

export function CommandCenter() {
  const activeSection = useCommandStore((s) => s.activeSection);
  const setEvents = useCommandStore((s) => s.setEvents);
  const setEventsLoading = useCommandStore((s) => s.setEventsLoading);

  // Load events on mount
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await fetchEvents({ limit: 50 });
        setEvents(data.events || []);
      } catch {
        // API not available — will show empty state
        setEvents([]);
      }
      setEventsLoading(false);
    };
    loadEvents();
  }, [setEvents, setEventsLoading]);

  return (
    <div className="flex h-screen flex-col bg-atlas-bg text-slate-200 font-sans">
      <TopBar />

      {/* Section content */}
      {activeSection === "situation" && <SituationRoom />}
      {activeSection === "intel" && <IntelBriefView />}
      {activeSection === "commander" && <AtlasCommander />}
      {activeSection === "realtime-brief" && <RealtimeBrief />}
      {activeSection === "library" && <IntelligenceLibrary />}

      {/* Modals */}
      <AlertModal />
      <ProfileModal />
      <CommandProfileModal />
    </div>
  );
}

/** Situation Room: Map + Sidebar Priority Feed */
function SituationRoom() {
  return (
    <>
      <StatusStrip />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <EventMap />
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
