import { db } from "../index";
import { bibleBooks } from "../schema";
import { bibleBooksSeed } from "../seed-data/bible-books";

export async function seedBibleBooks(): Promise<void> {
  console.log("→ Seed: Bibelbücher");
  for (const b of bibleBooksSeed) {
    const values = {
      id: b.id,
      abbr: b.abbr,
      nameDe: b.nameDe,
      nameOriginal: b.nameOriginal,
      nameOriginalTransliterated: b.nameOriginalTransliterated,
      testament: b.testament,
      groupName: b.groupName,
      groupColor: b.groupColor,
      orderIndex: b.orderIndex,
      chapterCount: b.chapterCount,
      summary: b.summary,
    } as const;
    await db
      .insert(bibleBooks)
      .values(values)
      // Stammdaten dürfen sich beim Re-Seed aktualisieren — z.B. wenn neue
      // Felder hinzukommen oder Tippfehler im Namen korrigiert werden.
      .onConflictDoUpdate({
        target: bibleBooks.id,
        set: values,
      });
  }
  console.log(`  ✓ ${bibleBooksSeed.length} Bücher sichergestellt`);
}
