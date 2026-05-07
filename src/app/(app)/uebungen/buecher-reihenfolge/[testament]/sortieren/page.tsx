import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "../../_components/back-button";
import { loadBooksByTestament } from "../../_components/load-books";
import { SortStage } from "../../_components/sort-stage";
import { isTestament } from "../../_components/types";

export const metadata: Metadata = {
  title: "Sortieren – Bücher der Bibel",
};

export default async function SortPage({
  params,
}: {
  params: { testament: string };
}) {
  if (!isTestament(params.testament)) notFound();
  const testament = params.testament;
  const books = await loadBooksByTestament(testament);

  const label = testament === "AT" ? "Altes Testament" : "Neues Testament";

  return (
    <div className="space-y-4">
      <BackLink
        href={`/uebungen/buecher-reihenfolge/${testament}`}
        label="Zurück zur Modus-Wahl"
      />
      <header>
        <h2 className="font-serif text-2xl font-bold tracking-tight">
          {label} – Sortieren
        </h2>
      </header>
      <SortStage books={books} testament={testament} />
    </div>
  );
}
