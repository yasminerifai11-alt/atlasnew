"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore } from "@/stores/profile-store";
import { chatWithAtlas } from "@/lib/api";

const STORAGE_KEY = "atlas-commander-history";
const MAX_STORED_MESSAGES = 20;
const LABEL_DISMISSED_KEY = "atlas-commander-label-dismissed";

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const ERROR_PHRASES = [
  "initializing",
  "ANTHROPIC_API_KEY",
  "env.local",
  "restart",
  "API key",
  "configure",
  "غير متصل حالياً",
  "قيد التهيئة",
];

function isErrorMessage(content: string): boolean {
  return ERROR_PHRASES.some((phrase) => content.includes(phrase));
}

function loadStoredMessages(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredMessage[] = JSON.parse(raw);
    // Clean out any error/system messages from history
    const cleaned = parsed.filter((m) => !isErrorMessage(m.content));
    if (cleaned.length !== parsed.length) {
      // Persist the cleaned version
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned.slice(-MAX_STORED_MESSAGES)));
    }
    return cleaned.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function saveMessages(msgs: StoredMessage[]) {
  try {
    // Never persist error/system messages
    const clean = msgs.filter((m) => !isErrorMessage(m.content));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(clean.slice(-MAX_STORED_MESSAGES))
    );
  } catch {
    // ignore quota errors
  }
}

function findEventMention(
  text: string,
  events: { title: string; latitude: number; longitude: number }[]
): { lat: number; lng: number; label: string } | null {
  for (const ev of events) {
    const keywords = ev.title
      .split(/[\s,\-–—:]+/)
      .filter((w) => w.length > 3);
    const matches = keywords.filter((kw) =>
      text.toLowerCase().includes(kw.toLowerCase())
    );
    if (matches.length >= 2 || (keywords.length <= 2 && matches.length >= 1)) {
      return { lat: ev.latitude, lng: ev.longitude, label: ev.title };
    }
  }
  return null;
}

/* ─── Radar SVG Components ─────────────────────────────────── */

/** Animated radar sweep SVG */
function RadarIcon({ size = 40, sweepDuration = 3 }: { size?: number; sweepDuration?: number }) {
  const id = `sweep-${size}-${sweepDuration}`;
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="radar-icon">
      <circle cx="20" cy="20" r="19" fill="#0a1628" />
      {/* Range rings */}
      <circle cx="20" cy="20" r="6" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.8" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.6" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.4" />
      {/* Crosshairs */}
      <line x1="20" y1="4" x2="20" y2="36" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.5" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.5" />
      {/* Sweep */}
      <g style={{ transformOrigin: "20px 20px", animation: `radarSweep ${sweepDuration}s linear infinite` }}>
        <path d="M 20 20 L 20 4 A 16 16 0 0 1 23.5 4.3 Z" fill={`url(#${id})`} opacity="0.9" />
        <line x1="20" y1="20" x2="20" y2="4" stroke="#3b82f6" strokeWidth="1.5" opacity="1" />
      </g>
      <defs>
        <linearGradient id={id} x1="20" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Center dot */}
      <circle cx="20" cy="20" r="1.5" fill="#3b82f6" />
      {/* Contact blips */}
      <circle cx="26" cy="13" r="1.5" fill="#3b82f6" opacity="0">
        <animate attributeName="opacity" values="0;0;0.9;0.6;0;0;0" dur={`${sweepDuration}s`} begin="0.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="14" cy="25" r="1" fill="#60a5fa" opacity="0">
        <animate attributeName="opacity" values="0;0;0;0.8;0.4;0;0" dur={`${sweepDuration}s`} begin="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="24" r="1.2" fill="#3b82f6" opacity="0">
        <animate attributeName="opacity" values="0;0;0;0;0.9;0.5;0" dur="6s" begin="2.1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Static mini radar for message labels (no animation for performance) */
function RadarIconStatic({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx="20" cy="20" r="19" fill="#0a1628" />
      <circle cx="20" cy="20" r="6" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.8" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.6" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.4" />
      <line x1="20" y1="4" x2="20" y2="36" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.5" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#1e3a5f" strokeWidth="0.4" opacity="0.5" />
      <line x1="20" y1="20" x2="20" y2="4" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" />
      <circle cx="20" cy="20" r="1.5" fill="#3b82f6" />
      <circle cx="26" cy="13" r="1.5" fill="#3b82f6" opacity="0.6" />
    </svg>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

export function FloatingCommander() {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const events = useCommandStore((s) => s.events);
  const activeSection = useCommandStore((s) => s.activeSection);
  const situationView = useCommandStore((s) => s.situationView);
  const setMapFlyTarget = useCommandStore((s) => s.setMapFlyTarget);
  const profile = useProfileStore((s) => s.profile);

  // Panel state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load stored messages on mount
  useEffect(() => {
    setMessages(loadStoredMessages());
  }, []);

  // Show label pill on first load, fade after 4s, never show again in session
  useEffect(() => {
    if (hasBeenOpened) return;
    const dismissed = sessionStorage.getItem(LABEL_DISMISSED_KEY);
    if (dismissed) return;
    const showTimer = setTimeout(() => setShowLabel(true), 1000);
    const hideTimer = setTimeout(() => {
      setShowLabel(false);
      sessionStorage.setItem(LABEL_DISMISSED_KEY, "1");
    }, 5000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [hasBeenOpened]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) setUnread(0);
  }, [isOpen, isMinimized]);

  const generateId = () => Math.random().toString(36).slice(2, 10);

  const addMessage = useCallback(
    (role: "user" | "assistant", content: string) => {
      const msg: StoredMessage = {
        id: generateId(),
        role,
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const next = [...prev, msg].slice(-MAX_STORED_MESSAGES);
        saveMessages(next);
        return next;
      });
      if (role === "assistant" && isMinimized) {
        setUnread((u) => u + 1);
      }
      return msg;
    },
    [isMinimized]
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || loading) return;

      setInput("");
      addMessage("user", msg);

      setLoading(true);
      try {
        const history = [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: msg },
        ];
        const viewContext =
          situationView === "defense" ? "DEFENSE" : "INTELLIGENCE";
        const contextPrefix = `[CONTEXT: User is viewing the ${viewContext} view in Atlas Command Situation Room. Active events: ${events.length}. ${
          profile
            ? `User role: ${profile.role}, region: ${profile.region}.`
            : ""
        }]`;
        const augmentedHistory = [
          {
            role: "user" as const,
            content: contextPrefix + "\n\n" + history[0]?.content,
          },
          ...history.slice(1),
        ];

        const response = await chatWithAtlas(
          augmentedHistory,
          events,
          lang,
          profile
        );
        addMessage("assistant", response);
      } catch {
        addMessage(
          "assistant",
          isAr
            ? "قائد أطلس غير متصل حالياً. سيتوفر التحليل الذكي قريباً."
            : "Atlas Commander is currently offline. Live AI analysis will be available shortly."
        );
      }
      setLoading(false);
    },
    [input, loading, messages, events, lang, profile, activeSection, addMessage, isAr, situationView]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    saveMessages([]);
  };

  const handleFabClick = () => {
    if (!hasBeenOpened) {
      setHasBeenOpened(true);
      setShowLabel(false);
    }
    if (isMinimized) {
      setIsMinimized(false);
      setUnread(0);
    } else {
      setIsOpen(true);
    }
  };

  const handleShowOnMap = (lat: number, lng: number, label: string) => {
    setMapFlyTarget({ lat, lng, zoom: 7, label });
  };

  const suggestedQuestionsEn = [
    "What is the biggest threat to Gulf energy right now?",
    "Which GCC country is most exposed to Iranian missiles?",
    "What should Kuwait do about the Red Sea situation?",
  ];
  const suggestedQuestionsAr = [
    "ما أكبر تهديد لطاقة الخليج الآن؟",
    "أي دول الخليج الأكثر عرضة للصواريخ الإيرانية؟",
    "ماذا ينبغي للكويت أن تفعل حيال وضع البحر الأحمر؟",
  ];
  const suggestedQuestions = isAr ? suggestedQuestionsAr : suggestedQuestionsEn;

  // Only show on situation room
  if (activeSection !== "situation") return null;

  return (
    <>
      {/* ─── CSS for radar animation ─── */}
      <style jsx global>{`
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-fab { transition: all 0.2s ease; }
        .radar-fab:hover {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 30px rgba(59,130,246,0.5) !important;
          transform: scale(1.05);
        }
        .radar-fab:hover .radar-icon g {
          animation-duration: 2s !important;
        }
        .radar-fab:active { transform: scale(0.95); }
        .radar-fab-open {
          border-color: #3b82f6 !important;
        }
        .radar-label-pill {
          animation: labelFadeIn 0.4s ease forwards;
        }
        @keyframes labelFadeIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes labelFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>

      {/* ─── Floating Radar Button ─── */}
      {!isOpen && (
        <div className="fixed z-[1000]" style={{ bottom: 24, right: 24 }}>
          <div className="flex flex-col items-end gap-2">
            {/* Persistent label next to radar */}
            <button
              onClick={handleFabClick}
              className="radar-fab group flex items-center gap-3"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Text label — always visible */}
              <div
                className="flex items-center gap-2 px-3 py-2 transition-all group-hover:border-blue-500/40"
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #1e3a5f",
                  borderRadius: "8px",
                }}
              >
                <span className="font-mono text-[9px] tracking-[1.5px] text-blue-400 font-semibold whitespace-nowrap">
                  {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-green-500"
                    style={{ boxShadow: "0 0 4px rgba(34,197,94,0.6)" }}
                  />
                  <span className="font-mono text-[8px] tracking-wider text-green-500/80">
                    {isAr ? "متصل" : "ONLINE"}
                  </span>
                </span>
              </div>
              {/* Radar FAB */}
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full shrink-0"
                style={{
                  backgroundColor: "#0a1628",
                  border: `1.5px solid ${isHovering ? "#3b82f6" : "#1e3a5f"}`,
                  boxShadow: isHovering
                    ? "0 0 30px rgba(59,130,246,0.5)"
                    : "0 0 20px rgba(59,130,246,0.3)",
                  transition: "all 0.2s ease",
                }}
              >
                <RadarIcon size={40} sweepDuration={isHovering ? 2 : 3} />
              </div>
            </button>
            {/* One-time intro pill — fades after 4s */}
            {showLabel && (
              <div
                className="radar-label-pill font-mono text-[9px] tracking-wider px-3 py-1.5"
                style={{
                  color: "#64748b",
                  backgroundColor: "#0d1117",
                  border: "1px solid #1e3a5f30",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {isAr ? "اسأل عن أي تهديد أو حدث" : "Ask about any threat or event"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Minimized bar ─── */}
      {isOpen && isMinimized && (
        <button
          onClick={() => {
            setIsMinimized(false);
            setUnread(0);
          }}
          className="fixed z-[999] flex items-center gap-2 px-4 py-2 transition-all hover:brightness-125"
          style={{
            bottom: 90,
            right: 24,
            backgroundColor: "#0d1117",
            border: "1px solid #1e2530",
            borderRadius: "8px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <RadarIcon size={16} sweepDuration={3} />
          <span className="font-mono text-[10px] tracking-widest text-blue-400">
            {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
          </span>
          {unread > 0 && (
            <span
              className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white"
              style={{ backgroundColor: "#ef4444" }}
            >
              {unread}
            </span>
          )}
        </button>
      )}

      {/* ─── Chat Panel ─── */}
      {isOpen && !isMinimized && (
        <div
          className="fixed z-[999] flex flex-col animate-slide-up"
          style={{
            bottom: 90,
            right: 24,
            width: 380,
            height: 520,
            backgroundColor: "#0d1117",
            border: "1px solid #1e2530",
            borderRadius: "12px 12px 0 0",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid #1e2530" }}
          >
            <div className="flex items-center gap-2">
              <RadarIcon size={20} sweepDuration={3} />
              <span className="font-mono text-[10px] tracking-[2px] text-blue-400 font-semibold">
                {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-2 py-1 font-mono text-[8px] tracking-wider text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {isAr ? "محادثة جديدة" : "NEW CHAT"}
                </button>
              )}
              <button
                onClick={() => setIsMinimized(true)}
                className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-300 transition-colors font-mono text-sm"
              >
                —
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-300 transition-colors font-mono text-sm"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && !loading ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full">
                <div className="mb-4">
                  <RadarIcon size={48} sweepDuration={4} />
                </div>
                <div className="font-mono text-[11px] tracking-[2px] text-blue-400 font-semibold mb-1">
                  ATLAS COMMANDER
                </div>
                <div
                  className={`font-mono text-[10px] text-slate-500 mb-5 text-center leading-relaxed ${isAr ? "arabic-text" : ""}`}
                >
                  {isAr
                    ? "عميل الاستخبارات متصل.\nيراقب جميع القنوات."
                    : "Intel agent online.\nMonitoring all channels."}
                </div>
                <div className="w-full space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className={`w-full text-left px-3 py-2.5 text-[11px] leading-relaxed transition-colors hover:brightness-150 ${
                        isAr ? "arabic-text text-right" : ""
                      }`}
                      style={{
                        color: "#94a3b8",
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e2530",
                        borderRadius: "8px",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat messages */
              <div className="space-y-3">
                {messages.map((msg) => {
                  const eventRef =
                    msg.role === "assistant"
                      ? findEventMention(msg.content, events)
                      : null;
                  return (
                    <div key={msg.id}>
                      {msg.role === "user" ? (
                        <div className="flex justify-end">
                          <div
                            className={`max-w-[80%] px-3 py-2.5 text-[13px] leading-relaxed text-white ${isAr ? "arabic-text" : ""}`}
                            style={{
                              backgroundColor: "#1e3a5f",
                              borderRadius: "12px 12px 2px 12px",
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <RadarIconStatic size={12} />
                            <span className="font-mono text-[9px] tracking-[1.5px] text-blue-400">
                              {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] px-3 py-2.5 text-[13px] leading-relaxed ${isAr ? "arabic-text" : ""}`}
                            style={{
                              color: "#e5e7eb",
                              backgroundColor: "#0f172a",
                              borderLeft: isAr ? "none" : "2px solid #3b82f6",
                              borderRight: isAr ? "2px solid #3b82f6" : "none",
                              borderRadius: isAr
                                ? "12px 2px 12px 12px"
                                : "2px 12px 12px 12px",
                            }}
                          >
                            <pre className="whitespace-pre-wrap font-sans text-[13px]">
                              {msg.content}
                            </pre>
                          </div>
                          {eventRef && (
                            <button
                              onClick={() =>
                                handleShowOnMap(eventRef.lat, eventRef.lng, eventRef.label)
                              }
                              className="mt-1.5 flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
                              style={{
                                backgroundColor: "#3b82f610",
                                border: "1px solid #3b82f625",
                                borderRadius: "4px",
                              }}
                            >
                              📍 {isAr ? "عرض على الخريطة" : "Show on map"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Loading state — fast radar sweep */}
                {loading && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <RadarIconStatic size={12} />
                      <span className="font-mono text-[9px] tracking-[1.5px] text-blue-400">
                        {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
                      </span>
                    </div>
                    <div
                      className="max-w-[85%] px-3 py-3 flex flex-col items-center gap-2"
                      style={{
                        backgroundColor: "#0f172a",
                        borderLeft: isAr ? "none" : "2px solid #3b82f6",
                        borderRight: isAr ? "2px solid #3b82f6" : "none",
                        borderRadius: isAr
                          ? "12px 2px 12px 12px"
                          : "2px 12px 12px 12px",
                      }}
                    >
                      <RadarIcon size={28} sweepDuration={1} />
                      <span className="font-mono text-[9px] text-slate-500">
                        {isAr ? "جارٍ مسح القنوات..." : "Scanning intel channels..."}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div
            className="shrink-0 px-3 py-3"
            style={{ borderTop: "1px solid #1e2530" }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAr
                    ? "اسأل عن الوضع الراهن..."
                    : "Ask about the current situation..."
                }
                rows={1}
                className={`flex-1 resize-none bg-transparent px-3 py-2 text-[13px] text-white placeholder-slate-600 outline-none ${
                  isAr ? "arabic-text text-right" : ""
                }`}
                style={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #1e2530",
                  borderRadius: "8px",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-30"
                style={{ backgroundColor: "#3b82f6" }}
              >
                <span className="text-white text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Close button when panel is open ─── */}
      {isOpen && !isMinimized && (
        <button
          onClick={() => setIsOpen(false)}
          className="radar-fab radar-fab-open fixed z-[1000] flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            bottom: 24,
            right: 24,
            backgroundColor: "#0a1628",
            border: "1.5px solid #3b82f6",
            boxShadow: "0 0 20px rgba(59,130,246,0.3)",
          }}
        >
          <RadarIcon size={40} sweepDuration={3} />
        </button>
      )}
    </>
  );
}
