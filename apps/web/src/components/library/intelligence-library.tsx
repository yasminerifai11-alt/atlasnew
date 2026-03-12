"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language";
import { getLocalizedField } from "@/utils/translate";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_SOURCES,
  FEED_ITEMS,
  CATEGORY_BASELINES,
  STATIC_ANOMALIES,
  type LibraryCategory,
  type LibrarySource,
  type FeedItem,
} from "@/data/library-sources";

// ─── Helpers ────────────────────────────────────────────────────

function timeAgo(offsetMs: number): string {
  const ms = Math.abs(offsetMs);
  if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`;
  return `${Math.round(ms / 86400000)}d ago`;
}

function timeAgoAr(offsetMs: number): string {
  const ms = Math.abs(offsetMs);
  if (ms < 60000) return `منذ ${Math.round(ms / 1000)} ث`;
  if (ms < 3600000) return `منذ ${Math.round(ms / 60000)} د`;
  if (ms < 86400000) return `منذ ${Math.round(ms / 3600000)} س`;
  return `منذ ${Math.round(ms / 86400000)} ي`;
}

// ─── Source helpers ─────────────────────────────────────────────

const sourcesByCategory = (cat: string) =>
  LIBRARY_SOURCES.filter((s) => s.category === cat);

const feedByCategory = (cat: string) =>
  FEED_ITEMS.filter((f) => f.category === cat).sort(
    (a, b) => b.timestamp - a.timestamp
  );

const totalSourceCount = LIBRARY_SOURCES.length;

const categoryCounts: Record<string, number> = {};
for (const s of LIBRARY_SOURCES) {
  categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
}

// ─── Component ──────────────────────────────────────────────────

export function IntelligenceLibrary() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    LIBRARY_CATEGORIES.forEach((c) => (initial[c.key] = true));
    return initial;
  });
  const [expandedFeeds, setExpandedFeeds] = useState<Record<string, boolean>>(
    {}
  );
  const [anomalyLoading, setAnomalyLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [newItemFlash, setNewItemFlash] = useState<Record<string, boolean>>({});

  const feedWallRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Simulate new item arrival every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const cats = LIBRARY_CATEGORIES;
      const randomCat = cats[Math.floor(Math.random() * cats.length)];
      setNewItemFlash((prev) => ({ ...prev, [randomCat.key]: true }));
      setTimeout(() => {
        setNewItemFlash((prev) => ({ ...prev, [randomCat.key]: false }));
      }, 3000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to category section
  const scrollToCategory = useCallback(
    (catKey: string) => {
      setActiveCategory(catKey);
      setActiveSource(null);
      if (catKey === "all") return;
      const el = sectionRefs.current[catKey];
      if (el && feedWallRef.current) {
        feedWallRef.current.scrollTo({
          top: el.offsetTop - feedWallRef.current.offsetTop - 24,
          behavior: "smooth",
        });
      }
    },
    []
  );

  // Filter by source
  const filterBySource = useCallback((sourceId: string) => {
    setActiveSource(sourceId);
    setActiveCategory("all");
  }, []);

  const clearSourceFilter = useCallback(() => {
    setActiveSource(null);
  }, []);

  // Toggle section
  const toggleSection = useCallback((catKey: string) => {
    setExpandedSections((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  }, []);

  // Toggle show more
  const toggleShowMore = useCallback((catKey: string) => {
    setExpandedFeeds((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  }, []);

  // Refresh anomaly
  const refreshAnomaly = useCallback((catKey: string) => {
    setAnomalyLoading((prev) => ({ ...prev, [catKey]: true }));
    setTimeout(() => {
      setAnomalyLoading((prev) => ({ ...prev, [catKey]: false }));
    }, 2000);
  }, []);

  // Filtered sources for sidebar
  const filteredSidebarSources = useMemo(() => {
    let sources = LIBRARY_SOURCES;
    if (search) {
      const q = search.toLowerCase();
      sources = sources.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return sources;
  }, [search]);

  // Get feed items (optionally filtered by source)
  const getVisibleFeed = useCallback(
    (catKey: string) => {
      let items = feedByCategory(catKey);
      if (activeSource) {
        items = items.filter((f) => f.sourceId === activeSource);
      }
      return items;
    },
    [activeSource]
  );

  // Active source object for filter display
  const activeSourceObj = activeSource
    ? LIBRARY_SOURCES.find((s) => s.id === activeSource)
    : null;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
      <div
        className="flex flex-col shrink-0 overflow-hidden md:w-[280px] w-full md:max-w-[280px]"
        style={{
          background: "#0a0e1a",
          borderRight: isAr ? "none" : "1px solid #1e2530",
          borderLeft: isAr ? "1px solid #1e2530" : "none",
        }}
      >
        {/* Mobile: horizontal pills */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => scrollToCategory("all")}
            className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider transition-colors"
            style={{
              background:
                activeCategory === "all" ? "#3b82f6" : "transparent",
              color: activeCategory === "all" ? "white" : "#6b7280",
              border: "1px solid #1e2530",
            }}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {LIBRARY_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => scrollToCategory(cat.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider transition-colors"
              style={{
                background:
                  activeCategory === cat.key ? "#3b82f6" : "transparent",
                color: activeCategory === cat.key ? "white" : "#6b7280",
                border: "1px solid #1e2530",
              }}
            >
              {isAr ? cat.labelAr : cat.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Desktop sidebar content */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden p-4">
          {/* Title */}
          <div
            className="font-mono text-[10px] tracking-[2px] mb-3"
            style={{ color: "#3b82f6", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {isAr ? "مكتبة المعلومات" : "INTEL LIBRARY"}
          </div>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "ابحث في المصادر..." : "Search sources..."}
            className="w-full mb-3 px-3 outline-none text-[11px] text-slate-300 placeholder-slate-600 font-mono"
            style={{
              background: "#0d1117",
              border: "1px solid #1e2530",
              height: 36,
              borderRadius: 6,
            }}
          />

          {/* Category list */}
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1">
            {/* All Sources row */}
            <button
              onClick={() => scrollToCategory("all")}
              className="flex items-center justify-between px-3 py-2 rounded transition-colors text-left w-full"
              style={{
                background: activeCategory === "all" ? "rgba(59,130,246,0.15)" : "transparent",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              <span className="flex items-center gap-2 text-[11px]" style={{ color: activeCategory === "all" ? "white" : "#9ca3af" }}>
                <span className="inline-block w-2 h-2 rounded-full bg-white" />
                {isAr ? "جميع المصادر" : "All Sources"}
              </span>
              <span className="text-[10px]" style={{ color: "#6b7280" }}>
                {totalSourceCount}
              </span>
            </button>

            {LIBRARY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => scrollToCategory(cat.key)}
                className="flex items-center justify-between px-3 py-2 rounded transition-colors text-left w-full group"
                style={{
                  background:
                    activeCategory === cat.key
                      ? "rgba(59,130,246,0.15)"
                      : "transparent",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                <span
                  className="flex items-center gap-2 text-[11px]"
                  style={{
                    color:
                      activeCategory === cat.key ? "white" : "#9ca3af",
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: cat.color,
                      boxShadow: newItemFlash[cat.key]
                        ? `0 0 8px ${cat.color}`
                        : "none",
                      transition: "box-shadow 0.3s",
                    }}
                  />
                  <span className="truncate">
                    {isAr ? cat.labelAr : cat.label}
                  </span>
                </span>
                <span className="text-[10px]" style={{ color: "#6b7280" }}>
                  {categoryCounts[cat.key] || 0}
                </span>
              </button>
            ))}

            {/* Divider */}
            <div className="my-3" style={{ borderTop: "1px solid #1e2530" }} />

            {/* Source cards */}
            <div className="flex flex-col gap-1.5">
              {filteredSidebarSources.map((src) => (
                <button
                  key={src.id}
                  onClick={() => filterBySource(src.id)}
                  className="text-left p-2.5 rounded transition-colors w-full"
                  style={{
                    background:
                      activeSource === src.id ? "#111827" : "#0d1117",
                    border: `1px solid ${
                      activeSource === src.id ? "#3b82f6" : "#1e2530"
                    }`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium truncate">
                      {src.tier === "active" ? (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">🔒</span>
                      )}
                      {src.name}
                    </span>
                    {src.tier === "active" && src.lastSynced && (
                      <span
                        className="text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          background: "rgba(59,130,246,0.15)",
                          color: "#60a5fa",
                        }}
                      >
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: "#6b7280" }}>
                    {isAr
                      ? LIBRARY_CATEGORIES.find((c) => c.key === src.category)
                          ?.labelAr
                      : LIBRARY_CATEGORIES.find((c) => c.key === src.category)
                          ?.label}
                  </div>
                  {src.tier === "active" && src.lastSynced && (
                    <div className="text-[8px] font-mono mt-0.5" style={{ color: "#4b5563" }}>
                      {isAr ? "آخر مزامنة" : "Last sync"}: {src.lastSynced}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FEED WALL ──────────────────────────────────── */}
      <div
        ref={feedWallRef}
        className="flex-1 overflow-y-auto"
        style={{ background: "#080b14", padding: 24 }}
      >
        {/* Source filter banner */}
        {activeSourceObj && (
          <div
            className="flex items-center justify-between mb-4 px-4 py-3 rounded-lg"
            style={{ background: "#0d1117", border: "1px solid #1e2530" }}
          >
            <span className="font-mono text-[11px] text-slate-300">
              {isAr
                ? `عرض: ${activeSourceObj.name}`
                : `Showing: ${activeSourceObj.name}`}
              {" "}
              ({FEED_ITEMS.filter((f) => f.sourceId === activeSource).length}{" "}
              {isAr ? "عنصر" : "items"})
            </span>
            <button
              onClick={clearSourceFilter}
              className="text-[11px] font-mono transition-colors hover:text-blue-400"
              style={{ color: "#6b7280" }}
            >
              {isAr ? "إلغاء الفلتر ×" : "Clear filter ×"}
            </button>
          </div>
        )}

        {/* Category sections */}
        <div className="flex flex-col gap-6">
          {LIBRARY_CATEGORIES.map((cat) => {
            const items = getVisibleFeed(cat.key);
            const isExpanded = expandedSections[cat.key] !== false;
            const showAll = expandedFeeds[cat.key] || false;
            const displayItems = showAll ? items : items.slice(0, 5);
            const remainingCount = items.length - 5;
            const catSources = sourcesByCategory(cat.key);
            const activeSources = catSources.filter(
              (s) => s.tier === "active"
            );
            const anomaly = STATIC_ANOMALIES[cat.key];
            const isLoading = anomalyLoading[cat.key];
            const isDimmed =
              activeCategory !== "all" && activeCategory !== cat.key;

            return (
              <div
                key={cat.key}
                ref={(el) => {
                  sectionRefs.current[cat.key] = el;
                }}
                className="transition-opacity duration-300"
                style={{ opacity: isDimmed ? 0.4 : 1 }}
              >
                {/* ── CATEGORY HEADER ──────────────────────── */}
                <div
                  className="flex items-center justify-between px-4"
                  style={{
                    background: "#0d1117",
                    border: "1px solid #1e2530",
                    borderRadius: "8px 8px 0 0",
                    height: 40,
                  }}
                >
                  <span
                    className="flex items-center gap-2 text-[11px] tracking-[1.5px] text-white"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {isAr
                      ? cat.labelAr.toUpperCase()
                      : cat.label.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-3">
                    {activeSources.length > 0 && (
                      <span
                        className="text-[8px] font-mono tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(34,197,94,0.15)",
                          color: "#22c55e",
                        }}
                      >
                        LIVE
                      </span>
                    )}
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "#6b7280" }}
                    >
                      {items.length} {isAr ? "عنصر" : "items"}
                    </span>
                    <button
                      onClick={() => refreshAnomaly(cat.key)}
                      className="text-[12px] hover:text-blue-400 transition-colors"
                      style={{ color: "#6b7280" }}
                      title="Refresh"
                    >
                      ↻
                    </button>
                    <button
                      onClick={() => toggleSection(cat.key)}
                      className="text-[12px] hover:text-blue-400 transition-colors"
                      style={{ color: "#6b7280" }}
                    >
                      {isExpanded ? "∧" : "∨"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <>
                    {/* ── AI ANOMALY BAR ───────────────────── */}
                    <div
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        background: "#0a0e1a",
                        borderLeft: isAr
                          ? "none"
                          : `3px solid ${cat.color}`,
                        borderRight: isAr
                          ? `3px solid ${cat.color}`
                          : "none",
                        borderBottom: "1px solid #1e2530",
                      }}
                    >
                      <span className="text-[14px] shrink-0 mt-0.5">🤖</span>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-mono animate-pulse"
                              style={{ color: cat.color }}
                            >
                              {isAr
                                ? "تحليل أنماط الإشارات..."
                                : "Analyzing signal patterns..."}
                            </span>
                          </div>
                        ) : (
                          <>
                            <p
                              className="text-[11px] leading-relaxed"
                              style={{
                                color: "#d1d5db",
                                fontFamily:
                                  "'IBM Plex Mono', monospace",
                              }}
                            >
                              {anomaly
                                ? isAr
                                  ? anomaly.ar
                                  : anomaly.en
                                : isAr
                                  ? "لا توجد بيانات شذوذ متاحة."
                                  : "No anomaly data available."}
                            </p>
                            <p
                              className="text-[9px] font-mono mt-1"
                              style={{ color: "#4b5563" }}
                            >
                              {isAr
                                ? "تم التحديث منذ 3 د"
                                : "Updated 3m ago"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── FEED ITEMS ───────────────────────── */}
                    {displayItems.length === 0 ? (
                      <div
                        className="px-4 py-6 text-center text-[11px] font-mono"
                        style={{
                          background: "#0d1117",
                          border: "1px solid #1e2530",
                          borderTop: "none",
                          color: "#4b5563",
                          borderRadius:
                            remainingCount <= 0
                              ? "0 0 8px 8px"
                              : undefined,
                        }}
                      >
                        {isAr
                          ? "لا توجد عناصر في هذه الفئة"
                          : "No items in this category"}
                      </div>
                    ) : (
                      displayItems.map((item, idx) => {
                        const isLast =
                          idx === displayItems.length - 1 &&
                          remainingCount <= 0;
                        const isNew = newItemFlash[cat.key] && idx === 0;
                        return (
                          <a
                            key={item.id}
                            href={`https://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 px-4 py-3 transition-colors group"
                            style={{
                              background: "#0d1117",
                              borderLeft: isNew
                                ? isAr
                                  ? "none"
                                  : "3px solid #3b82f6"
                                : isAr
                                  ? "none"
                                  : "1px solid #1e2530",
                              borderRight: isNew
                                ? isAr
                                  ? "3px solid #3b82f6"
                                  : "1px solid #1e2530"
                                : "1px solid #1e2530",
                              borderBottom: "1px solid #1e2530",
                              borderTop: "none",
                              borderRadius: isLast
                                ? "0 0 6px 6px"
                                : undefined,
                              textDecoration: "none",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "#111827")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                "#0d1117")
                            }
                          >
                            {/* Source favicon placeholder */}
                            <div
                              className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-[8px] font-bold mt-0.5"
                              style={{
                                background: cat.color + "20",
                                color: cat.color,
                              }}
                            >
                              {item.source.charAt(0)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-[9px] uppercase tracking-wider mb-0.5"
                                style={{
                                  color: "#6b7280",
                                  fontFamily:
                                    "'IBM Plex Mono', monospace",
                                }}
                              >
                                {item.source}
                              </div>
                              <div
                                className="text-[13px] text-white leading-snug line-clamp-2"
                                style={{
                                  fontFamily:
                                    "'IBM Plex Sans', sans-serif",
                                }}
                              >
                                {isAr && item.headline_ar
                                  ? item.headline_ar
                                  : item.headline}
                              </div>
                              <span
                                className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-mono"
                                style={{
                                  background: cat.color + "15",
                                  color: cat.color,
                                }}
                              >
                                {isAr ? cat.labelAr : cat.label}
                              </span>
                            </div>

                            {/* Time + link icon */}
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span
                                className="text-[9px] font-mono"
                                style={{ color: "#6b7280" }}
                              >
                                {isAr
                                  ? timeAgoAr(item.timestamp)
                                  : timeAgo(item.timestamp)}
                              </span>
                              <span
                                className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: "#6b7280" }}
                              >
                                ↗
                              </span>
                            </div>
                          </a>
                        );
                      })
                    )}

                    {/* ── SHOW MORE ROW ───────────────────── */}
                    {items.length > 5 && (
                      <button
                        onClick={() => toggleShowMore(cat.key)}
                        className="w-full text-left px-4 py-2.5 font-mono text-[11px] transition-colors hover:text-blue-400"
                        style={{
                          background: "#0a0e1a",
                          border: "1px solid #1e2530",
                          borderTop: "none",
                          borderRadius: "0 0 8px 8px",
                          color: "#6b7280",
                        }}
                      >
                        {showAll
                          ? isAr
                            ? "عرض أقل"
                            : "Show less"
                          : isAr
                            ? `عرض ${remainingCount} عنصر إضافي ←`
                            : `Show ${remainingCount} more items →`}
                      </button>
                    )}

                    {/* Close border for sections with <=5 items and no show-more */}
                    {items.length <= 5 && items.length > 0 && (
                      <div
                        style={{
                          height: 0,
                          borderBottom: "none",
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
