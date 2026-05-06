/**
 * Seed-Skript für Bib-Inside.
 *
 * Aufruf: pnpm db:seed
 *
 * Idempotent: bei wiederholtem Lauf werden bestehende Datensätze nicht überschrieben,
 * sondern auf bestehende IDs verwiesen (ON CONFLICT DO NOTHING).
 *
 * Was wird gesetzt:
 *   - 4 Übersetzungen (Schlachter, Elberfelder rev., Elberfelder 1905, Luther 1912)
 *   - 66 Bibelbücher in kanonischer Reihenfolge
 *   - Initiale Lernverse aus dem Skript (in Public-Domain-Übersetzungen)
 *   - Optional: Erster Admin-User aus SEED_ADMIN_EMAIL
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "./index";
import {
  bibleBooks,
  bibleTranslations,
  users,
  verseLearnItems,
} from "./schema";
import { bibleBooksSeed } from "./seed-data/bible-books";
import {
  translationsSeed,
  initialVersesSeed,
} from "./seed-data/bible-translations";

async function seedTranslations() {
  console.log("→ Seed: Bibelübersetzungen");
  for (const t of translationsSeed) {
    await db
      .insert(bibleTranslations)
      .values({
        id: t.id,
        fullName: t.fullName,
        publisher: t.publisher,
        year: t.year,
        isPublicDomain: t.isPublicDomain,
        attribution: t.attribution,
        licenseStatus: t.licenseStatus,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${translationsSeed.length} Übersetzungen sichergestellt`);
}

async function seedBibleBooks() {
  console.log("→ Seed: Bibelbücher");
  for (const b of bibleBooksSeed) {
    await db
      .insert(bibleBooks)
      .values({
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
      })
      // Stammdaten dürfen sich beim Re-Seed aktualisieren — z.B. wenn neue
      // Felder hinzukommen oder Tippfehler im Namen korrigiert werden.
      .onConflictDoUpdate({
        target: bibleBooks.id,
        set: {
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
        },
      });
  }
  console.log(`  ✓ ${bibleBooksSeed.length} Bücher sichergestellt`);
}

async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log(
      "→ Seed: Admin-User übersprungen (SEED_ADMIN_EMAIL ist nicht gesetzt)",
    );
    return null;
  }
  console.log(`→ Seed: Admin-User ${email}`);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (existing.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, existing.id));
      console.log("  ✓ Bestehender User auf Rolle 'admin' aktualisiert");
    } else {
      console.log("  ✓ Admin-User existiert bereits");
    }
    return existing.id;
  }

  const inserted = await db
    .insert(users)
    .values({
      email,
      role: "admin",
      name: email.split("@")[0],
    })
    .returning({ id: users.id });

  console.log("  ✓ Admin-User angelegt — bei nächster Anmeldung Magic-Link");
  return inserted[0]?.id ?? null;
}

async function seedInitialVerses(ownerId: string | null) {
  if (!ownerId) {
    console.log("→ Seed: Initiale Verse übersprungen (kein Admin als Owner)");
    return;
  }
  console.log("→ Seed: Initiale Lernverse");

  // Alle Bücher als Map abrufen für abbr → id
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
