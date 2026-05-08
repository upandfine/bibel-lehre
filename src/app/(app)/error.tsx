"use client";

import Link from "next/link";
import { useEffect } from "react";
import { log } from "@/lib/log";

/**
 * Error-Boundary innerhalb der authentifizierten App-Hülle. Behält die TopBar
 * (das Layout darüber bleibt aktiv), zeigt darunter eine erklärende
 * Fehler-Karte.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("page.error.app", {
      message: error.message,
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  const isUnauthorized = error.name === "UnauthorizedError";
  const isForbidden = error.name === "ForbiddenError";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6">
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          {isUnauthorized
            ? "Nicht eingeloggt"
            : isForbidden
              ? "Keine Berechtigung"
              : "Etwas ist schiefgelaufen"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isUnauthorized
            ? "Bitte melde dich nochmal an."
            : isForbidden
              ? "Diese Aktion ist nur für bestimmte Rollen verfügbar."
              : "Die Aktion konnte nicht abgeschlossen werden. Versuche es nochmal — wenn der Fehler bleibt, gib bitte Bescheid."}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Fehler-Kennung: <code>{error.digest}</code>
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
