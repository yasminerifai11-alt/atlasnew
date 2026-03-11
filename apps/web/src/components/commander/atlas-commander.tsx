"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useCommandStore } from "@/stores/command-store";
import { chatWithAtlas } from "@/lib/api";

export function AtlasCommander() {
  const { t, lang } = useLanguage();
  const events = useCommandStore((s) => s.events);
  const chatMessages = useCommandStore((s) => s.chatMessages);
  const addChatMessage = useCommandStore((s) => s.addChatMessage);
  const chatLoading = useCommandStore((s) => s.chatLoading);
  const setChatLoading = useCommandStore((s) => s.setChatLoading);
  const clearChat = useCommandStore((s) => s.clearChat);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || chatLoading) return;

      setInput("");
      addChatMessage({ role: "user", content: msg });

      setChatLoading(true);
      try {
        const history = [
          ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: msg },
        ];
        const response = await chatWithAtlas(history, events, lang);
        addChatMessage({ role: "assistant", content: response });
      } catch {
        addChatMessage({
          role: "assistant",
          content: "Connection to Atlas Command backend failed. Ensure the API is running on localhost:8000.",
        });
      }
      setChatLoading(false);
    },
    [input, chatLoading, chatMessages, events, lang, addChatMessage, setChatLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    t("commander.suggested1"),
    t("commander.suggested2"),
    t("commander.suggested3"),
    t("commander.suggested4"),
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3">
        <div>
          <div className="font-mono text-sm font-semibold tracking-wider text-slate-200">
            {t("commander.title")}
          </div>
          <div className="font-mono text-[9px] tracking-widest text-slate-600">
            {t("commander.subtitle")} · {events.length} active events loaded
          </div>
        </div>
        <button
          onClick={clearChat}
          className="px-3 py-1 font-mono text-[10px] tracking-wider text-slate-500 border border-white/[0.08] hover:text-slate-300"
        >
          {t("commander.clear")}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto">
            <div className="mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 opacity-30">
                <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5" />
                <path d="M2 12h20M12 2c-3 4-3 14 0 20M12 2c3 4 3 14 0 20" stroke="#3b82f6" strokeWidth="1" />
              </svg>
              <div className="text-center font-mono text-[11px] text-slate-500 mb-1">
                Atlas Commander is ready.
              </div>
              <div className="text-center font-mono text-[10px] text-slate-600">
                {lang === "ar"
                  ? "اسأل عن أي حدث نشط أو اطلب تحليلاً استراتيجياً"
                  : "Ask about any active event or request strategic analysis."}
              </div>
            </div>

            <div className="w-full space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className={`w-full text-left px-4 py-2.5 border border-white/[0.04] bg-white/[0.015] font-mono text-[11px] text-slate-400 hover:bg-white/[0.04] hover:text-slate-300 transition-colors ${
                    lang === "ar" ? "arabic-text" : ""
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`animate-slide-up ${
                  msg.role === "user" ? "ml-12" : "mr-12"
                }`}
              >
                <div className="font-mono text-[9px] tracking-wider text-slate-600 mb-1">
                  {msg.role === "user"
                    ? "YOU"
                    : "ATLAS COMMANDER"}{" "}
                  · {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
                <div
                  className={`p-3 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "border border-atlas-accent/20 bg-atlas-accent/[0.05] text-slate-300"
                      : "border border-white/[0.06] bg-white/[0.02] text-slate-400"
                  } ${lang === "ar" && msg.role === "assistant" ? "arabic-text" : ""}`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="mr-12 animate-slide-up">
                <div className="font-mono text-[9px] tracking-wider text-slate-600 mb-1">
                  ATLAS COMMANDER
                </div>
                <div className="border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="font-mono text-[11px] text-atlas-accent animate-pulse">
                    {t("commander.thinking")}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-6 py-3">
        <div className="flex max-w-2xl mx-auto gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("commander.placeholder")}
            rows={1}
            className={`flex-1 resize-none bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-[13px] text-slate-300 placeholder-slate-600 outline-none focus:border-atlas-accent/30 ${
              lang === "ar" ? "arabic-text" : ""
            }`}
          />
          <button
            onClick={() => sendMessage()}
            disabled={chatLoading || !input.trim()}
            className="px-5 py-2.5 font-mono text-[10px] tracking-wider text-atlas-accent border border-atlas-accent/30 hover:bg-atlas-accent/10 disabled:opacity-30"
          >
            {t("commander.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
