"use server";

import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  bibleBooks,
  bibleTranslations,
  userProgress,
  verseLearnItems,
} from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { initialState, schedule, type SrsGrade } from "@/lib/srs";

/**
 * Vers + (eventuell vorhandener) SRS-Stand pro User. Wenn der User noch nie
 * eine Bewertung abgegeben hat, sind die SRS-Felder null und der Vers gilt
 * als sofort fällig.
 */
export type DueVerse = {
  id: string;
  reference: string; // z.B. "Joh 3,16"
  bookNameDe: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
  text: string;
  translationLabel: string;
  attribution: string | null;
  // SRS — null wenn noch nie gelernt
  easeFactor: number | null;
  intervalDays: number | null;
  repetitions: number | null;
  lastGrade: string | null;
  totalReviews: number;
};

function formatReference(
  abbr: string,
  chapter: number,
  verseFrom: number,
  verseTo: number,
): string {
  if (verseFrom === verseTo) return `${abbr} ${chapter},${verseFrom}`;
  return `${abbr} ${chapter},${verseFrom}–${verseTo}`;
}

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) throw new Error("Nicht eingeloggt");
  return id;
}

/**
 * Lädt alle Verse, die für den aktuellen Lerner sichtbar sind und heute
 * fällig zum Lernen sind. „Fällig" heißt:
 *   - kein userProgress-Eintrag (noch nie gelernt) ODER
 *   - userProgress.dueAt <= jetzt
 *
 * Sichtbar = eigener Vers (private) ODER public.
 * Group-Visibility: später, wenn Gruppen verwaltet werden.
 */
export async function getDueVerses(): Promise<DueVerse[]> {
  const userId = await requireUserId();
  const now = new Date();

  const rows = await db
    .select({
      id: verseLearnItems.id,
      bookAbbr: bibleBooks.abbr,
      bookNameDe: bibleBooks.nameDe,
      chapter: verseLearnItems.chapter,
      verseFrom: verseLearnItems.verseFrom,
      verseTo: verseLearnItems.verseTo,
      text: verseLearnItems.text,
      translationFullName: bibleTranslations.fullName,
      attribution: bibleTranslations.attribution,
      easeFactor: userProgress.easeFactor,
      intervalDays: userProgress.intervalDays,
      repetitions: userProgress.repetitions,
      dueAt: userProgress.dueAt,
      lastGrade: userProgress.lastGrade,
      totalReviews: userProgress.totalReviews,
    })
    .from(verseLearnItems)
    .innerJoin(bibleBooks, eq(verseLearnItems.bookId, bibleBooks.id))
    .innerJoin(
      bibleTranslations,
      eq(verseLearnItems.translationId, bibleTranslations.id),
    )
    .leftJoin(
      userProgress,
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.sourceType, "verse"),
        // UUID (verse_learn_items.id) muss explizit nach text gecastet werden,
        // weil userProgress.source_id varchar ist (Polymorphie für mehrere Quell-
        // Typen, davon haben nicht alle UUIDs).
        sql`${userProgress.sourceId} = ${verseLearnItems.id}::text`,
      ),
    )
    .where(
      and(
        or(
          eq(verseLearnItems.ownerId, userId),
          eq(verseLearnItems.visibility, "public"),
        ),
        or(isNull(userProgress.dueAt), lte(userProgress.dueAt, now)),
      ),
    )
    .orderBy(
      // Erst die noch nie gelernten, dann die ältesten Fälligkeits-Daten
      sql`${userProgress.dueAt} NULLS FIRST`,
      asc(verseLearnItems.createdAt),
    );

  return rows.map((r) => ({
    id: r.id,
    reference: formatReference(r.bookAbbr, r.chapter, r.verseFrom, r.verseTo),
    bookNameDe: r.bookNameDe,
    chapter: r.chapter,
    verseFrom: r.verseFrom,
    verseTo: r.verseTo,
    text: r.text,
    translationLabel: r.translationFullName,
    attribution: r.attribution,
    easeFactor: r.easeFactor,
    intervalDays: r.intervalDays,
    repetitions: r.repetitions,
    lastGrade: r.lastGrade,
    totalReviews: r.totalReviews ?? 0,
  }));
}

/**
 * Liefert eine grobe Zählung für die Übersichts-Page:
 *   total: Anzahl sichtbarer Verse insgesamt
 *   due: davon heute fällig
 *   neverLearned: davon noch nie bewertet
 */
export async function getVerseStats() {
  const userId = await requireUserId();
  const now = new Date();

  const total = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(verseLearnItems)
    .where(
      or(
        eq(verseLearnItems.ownerId, userId),
        eq(verseLearnItems.visibility, "public"),
      ),
    );

  const due = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(verseLearnItems)
    .leftJoin(
      userProgress,
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.sourceType, "verse"),
        sql`${userProgress.sourceId} = ${verseLearnItems.id}::text`,
      ),
    )
    .where(
      and(
        or(
          eq(verseLearnItems.ownerId, userId),
          eq(verseLearnItems.visibility, "public"),
        ),
        or(isNull(userProgress.dueAt), lte(userProgress.dueAt, now)),
      ),
    );

  const neverLearned = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(verseLearnItems)
    .leftJoin(
      userProgress,
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.sourceType, "verse"),
        sql`${userProgress.sourceId} = ${verseLearnItems.id}::text`,
      ),
    )
    .where(
      and(
        or(
          eq(verseLearnItems.ownerId, userId),
          eq(verseLearnItems.visibility, "public"),
        ),
        isNull(userProgress.dueAt),
      ),
    );

  return {
    total: total[0]?.count ?? 0,
    due: due[0]?.count ?? 0,
    neverLearned: neverLearned[0]?.count ?? 0,
  };
}

/**
 * Speichert eine Bewertung. Wenn der Vers für den User noch keinen
 * userProgress-Eintrag hat, wird er angelegt; sonst aktualisiert.
 */
export async function recordVerseReview(
  verseId: string,
  grade: SrsGrade,
): Promise<{ success: true }> {
  const userId = await requireUserId();

  const existing = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.sourceType, "verse"),
      eq(userProgress.sourceId, verseId),
    ),
  });

  const prev = existing
    ? {
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
      }
    : initialState();

  const next = schedule(prev, grade);

  if (existing) {
    await db
      .update(userProgress)
      .set({
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: next.dueAt,
        lastReviewedAt: next.lastReviewedAt,
        lastGrade: next.lastGrade,
        totalReviews: existing.totalReviews + 1,
        correctReviews:
          existing.correctReviews + (grade === "again" ? 0 : 1),
      })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      userId,
      sourceType: "verse",
      sourceId: verseId,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      lastReviewedAt: next.lastReviewedAt,
      lastGrade: next.lastGrade,
      totalReviews: 1,
      correctReviews: grade === "again" ? 0 : 1,
    });
  }

  // Übersicht aktualisieren
  revalidatePath("/verse");
  return { success: true };
}
