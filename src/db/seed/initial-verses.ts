import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { bibleBooks, verseLearnItems } from "../schema";
import { initialVersesSeed } from "../seed-data/bible-translations";

export async function seedInitialVerses(
  ownerId: string | null,
): Promise<void> {
  if (!ownerId) {
    console.log("→ Seed: Initiale Verse übersprungen (kein Admin als Owner)");
    return;
  }
  console.log("→ Seed: Initiale Lernverse");

  const books = await db.select().from(bibleBooks);
  const abbrToId = new Map(books.map((b) => [b.abbr, b.id]));

  let inserted = 0;
  let skipped = 0;

  for (const v of initialVersesSeed) {
    const bookId = abbrToId.get(v.bookAbbr);
    if (!bookId) {
      console.warn(`  ⚠ Buch '${v.bookAbbr}' nicht gefunden, überspringe`);
      continue;
    }

    // Idempotenz: gleiche Stelle + gleicher Owner + gleiche Übersetzung = skip
    const exists = await db.query.verseLearnItems.findFirst({
      where: and(
        eq(verseLearnItems.ownerId, ownerId),
        eq(verseLearnItems.bookId, bookId),
        eq(verseLearnItems.chapter, v.chapter),
        eq(verseLearnItems.verseFrom, v.verseFrom),
        eq(verseLearnItems.verseTo, v.verseTo),
        eq(verseLearnItems.translationId, v.translationId),
      ),
    });

    if (exists) {
      skipped++;
      continue;
    }

    await db.insert(verseLearnItems).values({
      ownerId,
      visibility: v.visibility,
      bookId,
      chapter: v.chapter,
      verseFrom: v.verseFrom,
      verseTo: v.verseTo,
      translationId: v.translationId,
      text: v.text,
    });
    inserted++;
  }

  console.log(
    `  ✓ ${inserted} Verse neu angelegt, ${skipped} bereits vorhanden`,
  );
}
