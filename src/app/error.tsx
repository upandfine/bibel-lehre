"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Globaler Error-Boundary für unerwartete Render-Fehler. Greift, wenn keine
 * spezifischere error.tsx in einem Subtree existiert.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Etwas ist schiefgelaufen
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Die App hat unerwartet einen Fehler getroffen. Versuche es nochmal —
        wenn das Problem bestehen bleibt, melde dich bitte.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">
          Fehler-Kennung: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Erneut versuchen
        </button>
        <Link
          href="/"
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Startseite
        </Link>
      </div>
    </main>
  );
}
