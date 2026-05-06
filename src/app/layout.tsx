import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bib-Inside",
    template: "%s · Bib-Inside",
  },
  description:
    "Lern-App für strukturierte biblische Lehrkurse — Verse, Bücher-Reihenfolge, Karteikarten und mehr.",
  applicationName: "Bib-Inside",
  authors: [{ name: "Samuel Sommer" }],
  // PWA wird in Phase 1 hinzugefügt — manifest.json kommt dann hierhin
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={cn(inter.variable, sourceSerif.variable)}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
