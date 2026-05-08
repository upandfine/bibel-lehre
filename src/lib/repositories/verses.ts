/**
 * Repository für Lernverse + zugehörige SRS-Progress-Einträge.
 *
 * Polymorpher Sourcetype: Vers-Progress wird unter `sourceType = 'verse'`
 * in user_progress geführt. Die UUID muss explizit nach text gecastet
 * werden, weil source_id varchar ist (siehe schema.ts: Polymorphie).
 */

import "server-only";
import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bibleBooks,
  bibleTranslations,
  userProgress,
  verseLearnItems,
} from "@/db/schema";
import {
  findSrsProgress,
  upsertSrsProgress,
  type SrsProgressRow,
  type SrsUpsertInput,
} from "./srs";

const VERSE_SOURCE_TYPE = "verse" as const;

/** Subqueries-Bedingung: ist der userProgress-Eintrag der für diesen Vers? */
function progressForUser(userId: string) {
  return and(
    eq(userProgress.userId, userId),
    eq(userProgress.sourceType, VERSE_SOURCE_TYPE),
    sql`${userProgress.sourceId} = ${verseLearnItems.id}::text`,
  );
}

/** Sichtbarkeits-Filter: eigener Vers oder public. */
function visibleToUser(userId: string) {
  return or(
    eq(verseLearnItems.ownerId, userId),
    eq(verseLearnItems.visibility, "public"),
  );
}

export type DueVerseRow = {
  id: string;
  bookAbbr: string;
  bookNameDe: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
  text: string;
  translationFullName: string;
  attribution: string | null;
  easeFactor: number | null;
  intervalDays: number | null;
  repetitions: number | null;
  dueAt: Date | null;
  lastGrade: string | null;
  totalReviews: number | null;
};

/**
 * Verse, die für den User sichtbar UND fällig sind. Fällig = kein Progress
 * oder dueAt <= jetzt.
 */
export async function findDueVerses(
  userId: string,
  now: Date = new Date(),
): Promise<DueVerseRow[]> {
  return db
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
    .leftJoin(userProgress, progressForUser(userId))
    .where(
      and(
        visibleToUser(userId),
        or(isNull(userProgress.dueAt), lte(userProgress.dueAt, now)),
      ),
    )
    .orderBy(
      sql`${userProgress.dueAt} NULLS FIRST`,
      asc(verseLearnItems.createdAt),
    );
}

/**
 * Übersichts-Statistiken in einer einzigen Query mit Filter-Aggregation.
 * H6 Optimierung: vorher waren das drei separate Queries.
 */
export async function getStats(
  userId: string,
  now: Date = new Date(),
): Promise<{ total: number; due: number; neverLearned: number }> {
  const result = await db
    .select({
      total: sql<number>`count(*)::int`,
      due: sql<number>`count(*) filter (where ${userProgress.dueAt} is null or ${userProgress.dueAt} <= ${now})::int`,
      neverLearned: sql<number>`count(*) filter (where ${userProgress.dueAt} is null)::int`,
    })
    .from(verseLearnItems)
    .leftJoin(userProgress, progressForUser(userId))
    .where(visibleToUser(userId));

  return {
    total: result[0]?.total ?? 0,
    due: result[0]?.due ?? 0,
    neverLearned: result[0]?.neverLearned ?? 0,
  };
}

export type ProgressRow = SrsProgressRow;

/** Liest den aktuellen SRS-Stand für einen Vers — null wenn noch nie gelernt. */
export function findProgress(
  userId: string,
  verseId: string,
): Promise<ProgressRow | null> {
  return findSrsProgress(userId, VERSE_SOURCE_TYPE, verseId);
}

export type VerseUpsertInput = Omit<SrsUpsertInput, "sourceType" | "sourceId"> & {
  verseId: string;
};

/** Upsert über den generischen SRS-Helper — sourceType ist hier "verse". */
export function upsertProgress(input: VerseUpsertInput): Promise<void> {
  const { verseId, ...rest } = input;
  return upsertSrsProgress({
    ...rest,
    sourceType: VERSE_SOURCE_TYPE,
    sourceId: verseId,
  });
}
