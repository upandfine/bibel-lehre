/**
 * Repository für Lernverse + zugehörige SRS-Progress-Einträge.
 *
 * Polymorpher Sourcetype: Vers-Progress wird unter `sourceType = 'verse'`
 * in user_progress geführt. Die UUID muss explizit nach text gecastet
 * werden, weil source_id varchar ist (siehe schema.ts: Polymorphie).
 */

import "server-only";
import { and, asc, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bibleBooks,
  bibleTranslations,
  userProgress,
  verseAudio,
  verseLearnItems,
} from "@/db/schema";
import type { NewVerseLearnItem } from "@/db/schema";
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
  hasAudio: boolean;
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
      hasAudio: sql<boolean>`${verseAudio.verseId} is not null`,
    })
    .from(verseLearnItems)
    .innerJoin(bibleBooks, eq(verseLearnItems.bookId, bibleBooks.id))
    .innerJoin(
      bibleTranslations,
      eq(verseLearnItems.translationId, bibleTranslations.id),
    )
    .leftJoin(verseAudio, eq(verseAudio.verseId, verseLearnItems.id))
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
 *
 * Wichtig: Date-Objekte können in Drizzle's `sql`-Template nicht direkt
 * eingebettet werden — postgres.js wirft dann `TypeError: Received an
 * instance of Date`. Daher wird `now` einmal nach ISO-String konvertiert
 * und mit explizitem `::timestamptz`-Cast in den SQL-Filter gegeben.
 */
export async function getStats(
  userId: string,
  now: Date = new Date(),
): Promise<{ total: number; due: number; neverLearned: number }> {
  const nowIso = now.toISOString();
  const result = await db
    .select({
      total: sql<number>`count(*)::int`,
      due: sql<number>`count(*) filter (where ${userProgress.dueAt} is null or ${userProgress.dueAt} <= ${nowIso}::timestamptz)::int`,
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

// ====================================================================
// Vers-Auswahl für freie Übungs-Sessions (ohne SRS-Einfluss)
// ====================================================================

export type SelectableVerseRow = {
  id: string;
  bookAbbr: string;
  bookNameDe: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
  text: string;
  translationFullName: string;
  attribution: string | null;
  hasAudio: boolean;
};

/**
 * Alle für den User sichtbaren Verse (eigen oder public) — Volltext inkl.
 * Audio-Flag. Für die manuelle Auswahl einer Übungs-Session; KEIN
 * Fälligkeits-Filter, da der User bewusst selbst wählt.
 */
export async function findVisibleVerses(
  userId: string,
): Promise<SelectableVerseRow[]> {
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
      hasAudio: sql<boolean>`${verseAudio.verseId} is not null`,
    })
    .from(verseLearnItems)
    .innerJoin(bibleBooks, eq(verseLearnItems.bookId, bibleBooks.id))
    .innerJoin(
      bibleTranslations,
      eq(verseLearnItems.translationId, bibleTranslations.id),
    )
    .leftJoin(verseAudio, eq(verseAudio.verseId, verseLearnItems.id))
    .where(visibleToUser(userId))
    .orderBy(
      asc(bibleBooks.orderIndex),
      asc(verseLearnItems.chapter),
      asc(verseLearnItems.verseFrom),
    );
}

// ====================================================================
// Vers-Verwaltung (Admin) — CRUD
// ====================================================================

export type ManagedVerseRow = SelectableVerseRow & {
  visibility: "private" | "group" | "public";
  translationId: string;
  bookId: number;
  attributionOverride: string | null;
};

/** Alle Verse, die dem Nutzer gehören (Admin sieht zusätzlich die Seed-Verse). */
export async function findManagedVerses(
  ownerId: string,
): Promise<ManagedVerseRow[]> {
  return db
    .select({
      id: verseLearnItems.id,
      bookId: verseLearnItems.bookId,
      bookAbbr: bibleBooks.abbr,
      bookNameDe: bibleBooks.nameDe,
      chapter: verseLearnItems.chapter,
      verseFrom: verseLearnItems.verseFrom,
      verseTo: verseLearnItems.verseTo,
      text: verseLearnItems.text,
      translationId: verseLearnItems.translationId,
      translationFullName: bibleTranslations.fullName,
      attribution: bibleTranslations.attribution,
      visibility: verseLearnItems.visibility,
      attributionOverride: verseLearnItems.attributionOverride,
      hasAudio: sql<boolean>`${verseAudio.verseId} is not null`,
    })
    .from(verseLearnItems)
    .innerJoin(bibleBooks, eq(verseLearnItems.bookId, bibleBooks.id))
    .innerJoin(
      bibleTranslations,
      eq(verseLearnItems.translationId, bibleTranslations.id),
    )
    .leftJoin(verseAudio, eq(verseAudio.verseId, verseLearnItems.id))
    .where(eq(verseLearnItems.ownerId, ownerId))
    .orderBy(desc(verseLearnItems.updatedAt));
}

export type VerseWriteInput = Pick<
  NewVerseLearnItem,
  | "bookId"
  | "chapter"
  | "verseFrom"
  | "verseTo"
  | "translationId"
  | "text"
  | "visibility"
> & { attributionOverride: string | null };

export async function createVerseItem(
  ownerId: string,
  input: VerseWriteInput,
): Promise<string> {
  const [row] = await db
    .insert(verseLearnItems)
    .values({ ownerId, ...input })
    .returning({ id: verseLearnItems.id });
  return row.id;
}

/** Aktualisiert einen Vers — nur wenn er dem Owner gehört. */
export async function updateVerseItem(
  ownerId: string,
  verseId: string,
  input: VerseWriteInput,
): Promise<boolean> {
  const updated = await db
    .update(verseLearnItems)
    .set({ ...input, updatedAt: new Date() })
    .where(
      and(
        eq(verseLearnItems.id, verseId),
        eq(verseLearnItems.ownerId, ownerId),
      ),
    )
    .returning({ id: verseLearnItems.id });
  return updated.length > 0;
}

/** Löscht einen Vers (Audio + SRS-Progress über DB-Cascade/Polymorph). */
export async function deleteVerseItem(
  ownerId: string,
  verseId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(verseLearnItems)
    .where(
      and(
        eq(verseLearnItems.id, verseId),
        eq(verseLearnItems.ownerId, ownerId),
      ),
    )
    .returning({ id: verseLearnItems.id });
  return deleted.length > 0;
}

// ====================================================================
// Audio (Lied pro Vers) — als bytea in Postgres
// ====================================================================

/** Owner + Sichtbarkeit eines Verses — für Zugriffsprüfung im Audio-Endpoint. */
export async function findVerseAccess(
  verseId: string,
): Promise<{ ownerId: string; visibility: string } | null> {
  const [row] = await db
    .select({
      ownerId: verseLearnItems.ownerId,
      visibility: verseLearnItems.visibility,
    })
    .from(verseLearnItems)
    .where(eq(verseLearnItems.id, verseId))
    .limit(1);
  return row ?? null;
}

export async function getVerseAudio(
  verseId: string,
): Promise<{ data: Buffer; mimeType: string; sizeBytes: number } | null> {
  const [row] = await db
    .select({
      data: verseAudio.data,
      mimeType: verseAudio.mimeType,
      sizeBytes: verseAudio.sizeBytes,
    })
    .from(verseAudio)
    .where(eq(verseAudio.verseId, verseId))
    .limit(1);
  return row ?? null;
}

export async function setVerseAudio(input: {
  verseId: string;
  data: Buffer;
  mimeType: string;
  filename: string | null;
  sizeBytes: number;
}): Promise<void> {
  await db
    .insert(verseAudio)
    .values(input)
    .onConflictDoUpdate({
      target: verseAudio.verseId,
      set: {
        data: input.data,
        mimeType: input.mimeType,
        filename: input.filename,
        sizeBytes: input.sizeBytes,
        updatedAt: new Date(),
      },
    });
}

export async function deleteVerseAudio(verseId: string): Promise<void> {
  await db.delete(verseAudio).where(eq(verseAudio.verseId, verseId));
}
