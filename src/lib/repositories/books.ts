/**
 * Repository für die Bibel-Stammdaten (Bücher).
 *
 * Alle Drizzle-Queries gegen `bible_books` laufen über dieses Modul.
 * Vorteile: zentraler Ort für Query-Tuning und Mocking, klarere
 * API zwischen Anwendungs-Logik und Datenbank.
 */

import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bibleBooks } from "@/db/schema";
import type { Book } from "@/app/(app)/uebungen/buecher-reihenfolge/_components/types";

const cols = {
  id: bibleBooks.id,
  abbr: bibleBooks.abbr,
  nameDe: bibleBooks.nameDe,
  nameOriginal: bibleBooks.nameOriginal,
  nameOriginalTransliterated: bibleBooks.nameOriginalTransliterated,
  testament: bibleBooks.testament,
  groupName: bibleBooks.groupName,
  groupColor: bibleBooks.groupColor,
  orderIndex: bibleBooks.orderIndex,
} as const;

/** Alle 66 Bücher in kanonischer Reihenfolge. */
export async function findAllBooks(): Promise<Book[]> {
  return db.select(cols).from(bibleBooks).orderBy(asc(bibleBooks.orderIndex));
}

/** Bücher eines Testaments. */
export async function findBooksByTestament(
  testament: "AT" | "NT",
): Promise<Book[]> {
  return db
    .select(cols)
    .from(bibleBooks)
    .where(eq(bibleBooks.testament, testament))
    .orderBy(asc(bibleBooks.orderIndex));
}
