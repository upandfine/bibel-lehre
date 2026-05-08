import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getOptionalUser } from "@/lib/session";

export default async function HomePage() {
  // Eingeloggte direkt aufs Dashboard.
  const user = await getOptionalUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16">
      <div className="space-y-7 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          Bib-Inside
        </h1>
        <p className="text-lg text-muted-foreground">
          Lern-App für strukturierte biblische Lehrkurse — Verse, Bücher-Reihenfolge,
          Karteikarten und mehr.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Anmelden
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-muted-foreground">
            Anmeldung passwortlos per E-Mail-Link.
          </p>
        </div>
      </div>
    </main>
  );
}
