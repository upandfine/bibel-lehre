import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bibleBooks } from "@/db/schema";
import type { Book } from "./types";

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

/** Lädt alle 66 Bücher in kanonischer Reihenfolge. */
export async function loadAllBooks(): Promise<Book[]> {
  return db.select(cols).from(bibleBooks).orderBy(asc(bibleBooks.orderIndex));
}

/** Lädt nur die Bücher eines Testaments in kanonischer Reihenfolge. */
export async function loadBooksByTestament(
  testament: "AT" | "NT",
): Promise<Book[]> {
  return db
    .select(cols)
    .from(bibleBooks)
    .where(eq(bibleBooks.testament, testament))
    .orderBy(asc(bibleBooks.orderIndex));
}
