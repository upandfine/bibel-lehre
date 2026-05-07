import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BackLink } from "./_components/back-button";
import { loadAllBooks } from "./_components/load-books";

export const metadata: Metadata = {
  title: "Bücher der Bibel",
};

export default async function BookOrderSelectionPage() {
  const books = await loadAllBooks();
  const at = books.filter((b) => b.testament === "AT").length;
  const nt = books.filter((b) => b.testament === "NT").length;

  const options: { testament: "AT" | "NT"; label: string; count: number }[] = [
    { testament: "AT", label: "Altes Testament", count: at },
    { testament: "NT", label: "Neues Testament", count: nt },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/uebungen" label="Zurück zu den Übungen" />

      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Bücher der Bibel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welchen Teil der Bibel willst du üben?
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <Link
            key={opt.testament}
            href={`/uebungen/buecher-reihenfolge/${opt.testament}`}
            className="group rounded-lg border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
          >
            <p className="font-medium">{opt.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {opt.count} Bücher
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground">
              Weiter
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
