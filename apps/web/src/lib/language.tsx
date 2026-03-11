"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { en } from "@/locales/en";
import { ar } from "@/locales/ar";

type Language = "en" | "ar";
type TranslationKey = keyof typeof en;

interface LanguageContextValue {
  lang: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const translations = { en, ar };

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("atlas-lang") as Language) || "en";
  });

  const isRTL = lang === "ar";

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("atlas-lang", newLang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === "en" ? "ar" : "en");
  }, [lang, setLanguage]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let text: string = translations[lang][key] || translations.en[key] || key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  // Sync HTML lang attribute — NOT dir, since UI labels stay LTR
  // Arabic content blocks use className="arabic-text" for RTL
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{ lang, isRTL, toggleLanguage, setLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
