"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validatedAction } from "@/lib/action-helpers";
import { getUserIdOrThrow } from "@/lib/session";
import { initialState, schedule } from "@/lib/srs";
import {
  findDueVerses,
  findProgress,
  getStats,
  upsertProgress,
  type DueVerseRow,
} from "@/lib/repositories/verses";

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

function rowToDueVerse(r: DueVerseRow): DueVerse {
  return {
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
  };
}

/** Verse, die heute fällig sind (sichtbar = eigen oder public). */
export async function getDueVerses(): Promise<DueVerse[]> {
  const userId = await getUserIdOrThrow();
  const rows = await findDueVerses(userId);
  return rows.map(rowToDueVerse);
}

/** Total / fällig / nie geübt — eine Query, drei Filter-Aggregate. */
export async function getVerseStats() {
  const userId = await getUserIdOrThrow();
  return getStats(userId);
}

const RecordVerseReviewInput = z.object({
  verseId: z.string().uuid("verseId muss eine UUID sein"),
  grade: z.enum(["again", "hard", "good", "easy"]),
});

/**
 * Speichert eine Bewertung. Wenn der Vers für den User noch keinen
 * userProgress-Eintrag hat, wird er angelegt; sonst aktualisiert.
 */
export const recordVerseReview = validatedAction(
  RecordVerseReviewInput,
  async ({ verseId, grade }) => {
    const userId = await getUserIdOrThrow();

    const existing = await findProgress(userId, verseId);
    const prev = existing
      ? {
          easeFactor: existing.easeFactor,
          intervalDays: existing.intervalDays,
          repetitions: existing.repetitions,
        }
      : initialState();

    const next = schedule(prev, grade);

    await upsertProgress({
      userId,
      verseId,
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      lastReviewedAt: next.lastReviewedAt,
      lastGrade: next.lastGrade,
      countAsCorrect: grade !== "again",
    });

    revalidatePath("/verse");
    return { success: true } as const;
  },
);
