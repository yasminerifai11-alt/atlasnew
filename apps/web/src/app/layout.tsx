import type { Metadata } from "next";
import "@/styles/globals.css";
import { LanguageProvider } from "@/lib/language";

export const metadata: Metadata = {
  title: "Atlas Command — AI Planetary Decision Intelligence",
  description:
    "Real-time geopolitical intelligence platform. Monitor global threats, energy disruptions, and security events with AI-powered analysis and decision recommendations.",
  openGraph: {
    title: "Atlas Command",
    description:
      "AI Planetary Decision Intelligence — Monitor. Analyze. Decide.",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
