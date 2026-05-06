import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { bibleBooks } from "@/db/schema";
import { BookOrderExercise } from "./exercise";

export const metadata: Metadata = {
  title: "Bücher der Bibel",
};

export default async function BookOrderPage() {
  const books = await db
    .select({
      id: bibleBooks.id,
      abbr: bibleBooks.abbr,
      nameDe: bibleBooks.nameDe,
      nameOriginal: bibleBooks.nameOriginal,
      nameOriginalTransliterated: bibleBooks.nameOriginalTransliterated,
      testament: bibleBooks.testament,
      groupName: bibleBooks.groupName,
      groupColor: bibleBooks.groupColor,
      orderIndex: bibleBooks.orderIndex,
    })
    .from(bibleBooks)
    .orderBy(asc(bibleBooks.orderIndex));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Bücher der Bibel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle einen Bereich, dann übe das Reihenfolge-Wissen — entweder durch
          Sortieren oder durch freies Aufschreiben.
        </p>
      </header>

      <BookOrderExercise books={books} />
    </div>
  );
}
