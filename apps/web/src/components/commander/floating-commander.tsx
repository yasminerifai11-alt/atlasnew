"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { useProfileStore } from "@/stores/profile-store";
import { chatWithAtlas } from "@/lib/api";

const STORAGE_KEY = "atlas-commander-history";
const MAX_STORED_MESSAGES = 20;

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function loadStoredMessages(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function saveMessages(msgs: StoredMessage[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(msgs.slice(-MAX_STORED_MESSAGES))
    );
  } catch {
    // ignore quota errors
  }
}

/**
 * Try to extract a lat/lng from an assistant message by matching event titles
 * against the current event list.
 */
function findEventMention(
  text: string,
  events: { title: string; latitude: number; longitude: number }[]
): { lat: number; lng: number; label: string } | null {
  for (const ev of events) {
    // Check if significant words from the event title appear in the message
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
  const [showLabel, setShowLabel] = useState(true);

  // Chat state (local, persisted to localStorage)
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

  // Fade out the label after 5 seconds
  useEffect(() => {
    if (hasBeenOpened) {
      setShowLabel(false);
      return;
    }
    const timer = setTimeout(() => setShowLabel(false), 5000);
    return () => clearTimeout(timer);
  }, [hasBeenOpened]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Clear unread when panel is open
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

        // Build enhanced system context
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
            ? "قائد أطلس قيد التهيئة. تأكد من إعداد ANTHROPIC_API_KEY في apps/web/.env.local وأعد تشغيل الخادم."
            : "Atlas Commander is initializing. Ensure ANTHROPIC_API_KEY is set in apps/web/.env.local and restart the Next.js dev server."
        );
      }
      setLoading(false);
    },
    [
      input,
      loading,
      messages,
      events,
      lang,
      profile,
      activeSection,
      addMessage,
      isAr,
    ]
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
    if (!hasBeenOpened) setHasBeenOpened(true);
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

  // Only show on situation room (which includes both intelligence and defense views)
  if (activeSection !== "situation") return null;

  return (
    <>
      {/* Floating action button */}
      {!isOpen && (
        <div className="fixed z-[1000]" style={{ bottom: 24, right: 24 }}>
          <div className="flex items-center gap-3">
            {/* Label */}
            <div
              className={`font-mono text-[11px] tracking-wider transition-opacity duration-500 ${
                showLabel ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ color: "#94a3b8" }}
            >
              {isAr ? "اسأل قائد أطلس ←" : "Ask Atlas Commander →"}
            </div>
            {/* FAB */}
            <button
              onClick={handleFabClick}
              className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 ${!hasBeenOpened ? "commander-pulse" : ""}`}
              style={{
                backgroundColor: "#3b82f6",
                boxShadow: "0 4px 24px rgba(59,130,246,0.4)",
              }}
            >
              <span className="text-white text-xl font-bold">✦</span>
            </button>
          </div>
        </div>
      )}

      {/* Minimized bar */}
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
          <span className="font-mono text-[10px] tracking-widest text-blue-400">
            {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
          </span>
          <span className="text-blue-400 text-xs">✦</span>
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

      {/* Chat panel */}
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
              <span className="text-blue-400 text-sm">✦</span>
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
                <span className="text-3xl text-blue-400 mb-3">✦</span>
                <div className="font-mono text-[12px] font-semibold text-slate-300 mb-1">
                  {isAr ? "قائد أطلس" : "Atlas Commander"}
                </div>
                <div
                  className={`font-mono text-[10px] text-slate-500 mb-5 text-center ${isAr ? "arabic-text" : ""}`}
                >
                  {isAr
                    ? "اسألني أي شيء عن الوضع الراهن."
                    : "Ask me anything about the current situation."}
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
                        /* User message */
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
                        /* Assistant message */
                        <div>
                          <div className="font-mono text-[9px] tracking-[1.5px] text-blue-400 mb-1">
                            {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
                          </div>
                          <div
                            className={`max-w-[85%] px-3 py-2.5 text-[13px] leading-relaxed ${isAr ? "arabic-text" : ""}`}
                            style={{
                              color: "#e5e7eb",
                              backgroundColor: "#0f172a",
                              borderLeft: isAr
                                ? "none"
                                : "2px solid #3b82f6",
                              borderRight: isAr
                                ? "2px solid #3b82f6"
                                : "none",
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
                                handleShowOnMap(
                                  eventRef.lat,
                                  eventRef.lng,
                                  eventRef.label
                                )
                              }
                              className="mt-1.5 flex items-center gap-1 px-2 py-1 font-mono text-[9px] tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
                              style={{
                                backgroundColor: "#3b82f610",
                                border: "1px solid #3b82f625",
                                borderRadius: "4px",
                              }}
                            >
                              📍{" "}
                              {isAr ? "عرض على الخريطة" : "Show on map"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {loading && (
                  <div>
                    <div className="font-mono text-[9px] tracking-[1.5px] text-blue-400 mb-1">
                      {isAr ? "قائد أطلس" : "ATLAS COMMANDER"}
                    </div>
                    <div
                      className="max-w-[85%] px-3 py-3"
                      style={{
                        backgroundColor: "#0f172a",
                        borderLeft: isAr ? "none" : "2px solid #3b82f6",
                        borderRight: isAr ? "2px solid #3b82f6" : "none",
                        borderRadius: isAr
                          ? "12px 2px 12px 12px"
                          : "2px 12px 12px 12px",
                      }}
                    >
                      <span className="inline-flex gap-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
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

      {/* Floating button (when panel is open, smaller position indicator) */}
      {isOpen && !isMinimized && (
        <button
          onClick={() => setIsOpen(false)}
          className="fixed z-[1000] flex h-14 w-14 items-center justify-center rounded-full transition-all hover:scale-105"
          style={{
            bottom: 24,
            right: 24,
            backgroundColor: "#3b82f6",
            boxShadow: "0 4px 24px rgba(59,130,246,0.4)",
          }}
        >
          <span className="text-white text-lg">×</span>
        </button>
      )}

    </>
  );
}
