/**
 * Seed-Skript für Bib-Inside.
 *
 * Aufruf: pnpm db:seed
 *
 * Idempotent: bei wiederholtem Lauf werden Stammdaten (Bücher, Übersetzungen)
 * upgedatet, User-spezifische Daten (Verse, Admin-Rolle) sichergestellt.
 *
 * Was wird gesetzt:
 *   - 4 Übersetzungen (Schlachter, Elberfelder rev., Elberfelder 1905, Luther 1912)
 *   - 66 Bibelbücher in kanonischer Reihenfolge
 *   - Optional: Admin-User aus SEED_ADMIN_EMAIL
 *   - Initiale Lernverse aus dem Skript (in Public-Domain-Übersetzungen),
 *     dem Admin als Owner zugewiesen
 */

import { sql } from "drizzle-orm";
import { db } from "./index";
import { bibleBooks } from "./schema";
import { seedAdminUser } from "./seed/admin-user";
import { seedBibleBooks } from "./seed/books";
import { seedInitialVerses } from "./seed/initial-verses";
import { seedTranslations } from "./seed/translations";

async function main() {
  console.log("\n--- Bib-Inside Seed-Lauf ---\n");

  await seedTranslations();
  await seedBibleBooks();
  const adminId = await seedAdminUser();
  await seedInitialVerses(adminId);

  // Sanity-Check: zählen, was nun in der DB ist
  const counts = await db
    .select({
      translations: sql<number>`(SELECT COUNT(*) FROM bible_translations)`,
      books: sql<number>`(SELECT COUNT(*) FROM bible_books)`,
      verses: sql<number>`(SELECT COUNT(*) FROM verse_learn_items)`,
      users: sql<number>`(SELECT COUNT(*) FROM users)`,
    })
    .from(bibleBooks)
    .limit(1);

  console.log("\n--- DB-Stand nach Seed ---");
  console.log(counts[0]);
  console.log("\nFertig.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed fehlgeschlagen:", err);
    process.exit(1);
  });
