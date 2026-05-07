import Link from "next/link";
import { RotateCcw } from "lucide-react";

/**
 * Buttons unten in jeder Auswertungs-Page. Zwei klare Wege:
 * - "Nochmal" startet dieselbe Übung neu
 * - "Andere Auswahl" springt komplett zurück zur Auswahl
 */
export function ResultActions({
  retryHref,
  selectionHref,
}: {
  retryHref: string;
  selectionHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Link
        href={retryHref}
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <RotateCcw className="h-4 w-4" />
        Nochmal mit gleicher Auswahl
      </Link>
      <Link
        href={selectionHref}
        className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Andere Auswahl
      </Link>
    </div>
  );
}
