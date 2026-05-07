"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Zurück-Knopf der die Browser-History verwendet — gleicht dem Edge-Swipe
 * auf dem Handy. Wenn keine History vorhanden ist (z.B. Direkt-Aufruf eines
 * tieferen Routes), wird die explizite Fallback-URL aufgerufen.
 */
export function BackButton({
  fallbackHref,
  label = "Zurück",
}: {
  fallbackHref: string;
  label?: string;
}) {
  const router = useRouter();

  function handleClick() {
    // Wenn der Nutzer direkt auf diese Page kam (also nicht navigiert ist),
    // gibt es keinen sinnvollen "Zurück" — dann gehen wir auf den Fallback.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/**
 * Variante mit fester Ziel-URL — wenn man dem Nutzer eindeutig sagen will,
 * wo er landet (z.B. „Andere Auswahl" springt zurück zur Auswahl-Page).
 */
export function BackLink({
  href,
  label = "Zurück",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
