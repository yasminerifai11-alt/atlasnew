import { useState, useEffect, useCallback, useRef } from "react";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ═══════════════════════════════════════
// ONGOING EVENT DETECTION
// ═══════════════════════════════════════

const ONGOING_KEYWORDS = [
  "war", "conflict", "nuclear", "blockade", "occupation",
  "sanctions", "crisis", "ongoing", "continues",
];

function isOngoing(event) {
  return ONGOING_KEYWORDS.some((k) =>
    event.title.toLowerCase().includes(k)
  );
}

// ═══════════════════════════════════════
// DEDUPLICATION (client-side merge)
// ═══════════════════════════════════════

function deduplicateEvents(events) {
  const seen = new Map();
  return events.filter((event) => {
    const key = event.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(" ")
      .slice(0, 6)
      .join(" ");
    if (seen.has(key)) return false;
    seen.set(key, event);
    return true;
  });
}

// ═══════════════════════════════════════
// AGE FILTER (client-side safety net)
// ═══════════════════════════════════════

function filterByAge(events) {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const h72 = 72 * 60 * 60 * 1000;
  return events.filter((e) => {
    const age = now - new Date(e.timestamp || e.event_time).getTime();
    if (isNaN(age)) return false;
    if (e.severity === "CRITICAL") return age < h72;
    if (isOngoing(e)) return age < h72;
    return age < h24;
  });
}

// ═══════════════════════════════════════
// FINGERPRINT — detect real changes
// ═══════════════════════════════════════

function getFingerprint(events) {
  return events
    .slice(0, 10)
    .map((e) => e.title.slice(0, 30))
    .join("|");
}

// ═══════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sourceCount, setSourceCount] = useState(0);
  const [newEventCount, setNewEventCount] = useState(0);
  const prevFingerprint = useRef("");

  const fetchFresh = useCallback(async (force = false) => {
    try {
      const url = force
        ? `/api/news/refresh?bust=${Date.now()}`
        : `/api/news?bust=${Date.now()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const newEvents = data.events || [];

      setEvents((prev) => {
        // Merge: new events + ongoing events from previous batch
        const merged = [
          ...newEvents,
          ...prev.filter(
            (p) =>
              isOngoing(p) &&
              !newEvents.find(
                (n) =>
                  n.title.toLowerCase().slice(0, 30) ===
                  p.title.toLowerCase().slice(0, 30)
              )
          ),
        ];
        const deduped = deduplicateEvents(merged);
        const fresh = filterByAge(deduped);
        const sorted = fresh.sort((a, b) => b.riskScore - a.riskScore);

        // Detect new events
        const newFp = getFingerprint(sorted);
        if (prevFingerprint.current && newFp !== prevFingerprint.current) {
          const newCount = sorted.filter(
            (s) =>
              !prev.find(
                (p) =>
                  p.title.toLowerCase().slice(0, 30) ===
                  s.title.toLowerCase().slice(0, 30)
              )
          ).length;
          setNewEventCount(newCount);
        }
        prevFingerprint.current = newFp;

        return sorted;
      });

      setSourceCount(data.sources || 0);
      setLastUpdated(new Date(data.updated));
      setError(null);
    } catch (err) {
      console.error("[useEvents] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchFresh();
    const interval = setInterval(() => fetchFresh(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFresh]);

  const clearNewCount = useCallback(() => setNewEventCount(0), []);
  const forceRefresh = useCallback(() => fetchFresh(true), [fetchFresh]);

  return {
    events,
    loading,
    error,
    lastUpdated,
    sourceCount,
    newEventCount,
    clearNewCount,
    forceRefresh,
    fingerprint: prevFingerprint.current,
  };
}
