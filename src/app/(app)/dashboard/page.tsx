import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { getOptionalUser } from "@/lib/session";
import { getVerseStats } from "../verse/_actions";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage(
  props: {
    searchParams: Promise<{ msg?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  // Layout (app)/layout.tsx hat die Session bereits sichergestellt — hier nur lesen.
  const user = await getOptionalUser();
  const name = user?.name ?? user?.email ?? "Du";
  const firstName = name.split("@")[0].split(" ")[0];

  const verseStats = await getVerseStats();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Hallo {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Schön, dass du da bist.
        </p>
      </header>

      {searchParams.msg === "admin-only" && (
        <div
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
        >
          Der Admin-Bereich ist aktuell nur für Konten mit der Rolle
          <strong> admin</strong> zugänglich.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Quicklink
          href={verseStats.due > 0 ? "/verse" : "/verse"}
          icon={BookOpen}
          title="Verse"
          description={
            verseStats.due > 0
              ? `${verseStats.due} ${verseStats.due === 1 ? "Vers" : "Verse"} heute fällig`
              : verseStats.total === 0
                ? "Noch keine Verse"
                : "Heute keine Verse fällig"
          }
          highlight={verseStats.due > 0}
        />

        <Quicklink
          href="/uebungen"
          icon={Sparkles}
          title="Übungen"
          description="Bücher der Bibel — Sortieren, Zuordnen, Schreiben"
        />

        <Quicklink
          href="/lehrkurs"
          icon={GraduationCap}
          title="Lehrkurs"
          description="Bald verfügbar — strukturierte Module"
          muted
        />
      </section>
    </div>
  );
}

function Quicklink({
  href,
  icon: Icon,
  title,
  description,
  highlight = false,
  muted = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent" +
        (highlight ? " border-primary/40 bg-primary/[0.03]" : "") +
        (muted ? " opacity-70" : "")
      }
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-foreground">
        Öffnen
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
