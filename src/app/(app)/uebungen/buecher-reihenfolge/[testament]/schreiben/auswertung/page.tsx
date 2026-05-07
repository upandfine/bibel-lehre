import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "../../../_components/back-button";
import { loadBooksByTestament } from "../../../_components/load-books";
import { WriteResult } from "../../../_components/write-result";
import { isTestament } from "../../../_components/types";

export const metadata: Metadata = {
  title: "Auswertung – Schreiben",
};

export default async function WriteResultPage({
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
          {label} – Auswertung Schreiben
        </h2>
      </header>
      <WriteResult books={books} testament={testament} />
    </div>
  );
}
