import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutGrid, Pencil, Shuffle } from "lucide-react";
import { BackLink } from "../_components/back-button";
import { loadBooksByTestament } from "../_components/load-books";
import { isTestament } from "../_components/types";

type Mode = {
  slug: "zuordnen" | "sortieren" | "schreiben";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const modes: Mode[] = [
  {
    slug: "zuordnen",
    label: "Zuordnen",
    description:
      "Ordne jedes Buch dem richtigen Abschnitt zu (Pentateuch, Geschichte …) — und sortiere es innerhalb des Abschnitts.",
    icon: LayoutGrid,
  },
  {
    slug: "sortieren",
    label: "Sortieren",
    description:
      "Die Bücher liegen gemischt vor — bringe sie per Drag&Drop in die komplette kanonische Reihenfolge.",
    icon: Shuffle,
  },
  {
    slug: "schreiben",
    label: "Schreiben",
    description:
      "Schreibe die Bücher der Reihenfolge nach selbst auf — aktiver Recall statt Wiedererkennen.",
    icon: Pencil,
  },
];

export async function generateMetadata(
  props: {
    params: Promise<{ testament: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isTestament(params.testament)) return { title: "Bücher der Bibel" };
  const label = params.testament === "AT" ? "Altes Testament" : "Neues Testament";
  return { title: `${label} – Bücher der Bibel` };
}

export default async function BookOrderModePage(
  props: {
    params: Promise<{ testament: string }>;
  }
) {
  const params = await props.params;
  if (!isTestament(params.testament)) notFound();
  const testament = params.testament;
  const books = await loadBooksByTestament(testament);

  const label = testament === "AT" ? "Altes Testament" : "Neues Testament";

  return (
    <div className="space-y-6">
      <BackLink href="/uebungen/buecher-reihenfolge" label="Zurück zur Auswahl" />

      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">{label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {books.length} Bücher. Wähle, wie du üben möchtest.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.slug}
              href={`/uebungen/buecher-reihenfolge/${testament}/${m.slug}`}
              className="group flex flex-col gap-2 rounded-lg border bg-card p-5 text-left transition-colors hover:border-foreground/40 hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{m.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{m.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
