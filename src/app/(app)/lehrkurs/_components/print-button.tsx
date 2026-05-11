"use client";

import { Printer } from "lucide-react";

/**
 * Löst den Browser-Print-Dialog aus. Lerner wählt dort "Als PDF speichern"
 * oder druckt direkt. Wir nutzen bewusst die Standard-Browser-Funktion
 * statt einer PDF-Lib — kein Bundle-Aufschlag, native Page-Break-Logik,
 * funktioniert offline.
 *
 * Print-Styling kommt aus globals.css → @media print. Die meisten
 * interaktiven Elemente (Speichern-Buttons, Status-Badges, Navigation)
 * sind als `no-print` markiert.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Lektion drucken oder als PDF speichern"
    >
      <Printer className="h-3.5 w-3.5" />
      Drucken
    </button>
  );
}
