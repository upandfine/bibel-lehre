import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "E-Mail prüfen",
};

export default function CheckEmailPage() {
  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Schau in dein Postfach
        </h1>
        <p className="text-base text-muted-foreground">
          Wir haben dir gerade einen Anmelde-Link geschickt. Klicke auf den Link in
          der E-Mail, um dich anzumelden.
        </p>
        <div className="rounded-lg border bg-card p-4 text-left text-sm text-card-foreground">
          <p className="font-medium">Keine E-Mail erhalten?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Prüfe deinen Spam-Ordner.</li>
            <li>Stelle sicher, dass du die E-Mail-Adresse richtig geschrieben hast.</li>
            <li>Warte ein, zwei Minuten — manchmal dauert es kurz.</li>
          </ul>
        </div>
        <Link
          href="/sign-in"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Zurück zur Anmeldung
        </Link>
      </div>
    </main>
  );
}
