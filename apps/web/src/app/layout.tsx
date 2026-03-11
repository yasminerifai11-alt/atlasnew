import type { Metadata } from "next";
import "@/styles/globals.css";
import { LanguageProvider } from "@/lib/language";

export const metadata: Metadata = {
  title: "Atlas Command — Planetary Decision Intelligence",
  description:
    "Atlas Command monitors global events and tells leaders what is happening, why it matters, what comes next, and what to do. Built for the GCC.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Atlas Command — Planetary Decision Intelligence",
    description:
      "Atlas Command monitors global events and tells leaders what is happening, why it matters, what comes next, and what to do. Built for the GCC.",
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
