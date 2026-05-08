/**
 * Generischer SRS-Progress über alle sourceTypes.
 *
 * Die user_progress-Tabelle ist polymorph: Vers-Lernen, Bücher-Reihenfolge
 * (E3) und später Karteikarten teilen sich denselben Mechanismus. Dieses
 * Modul kapselt die DB-Operationen, sodass nicht jede Aktion eigene
 * Drizzle-Queries duplizieren muss.
 */

import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userProgress } from "@/db/schema";

/** Erlaubte sourceTypes — Whitelist gegen Tippfehler. */
export const SRS_SOURCE_TYPES = ["verse", "book_order", "flashcard"] as const;
export type SrsSourceType = (typeof SRS_SOURCE_TYPES)[number];

export type SrsProgressRow = {
  id: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  totalReviews: number;
  correctReviews: number;
};

export async function findSrsProgress(
  userId: string,
  sourceType: SrsSourceType,
  sourceId: string,
): Promise<SrsProgressRow | null> {
  const row = await db.query.userProgress.findFirst({
    where: and(
      eq(userProgress.userId, userId),
      eq(userProgress.sourceType, sourceType),
      eq(userProgress.sourceId, sourceId),
    ),
  });
  return row ?? null;
}

export type SrsUpsertInput = {
  userId: string;
  sourceType: SrsSourceType;
  sourceId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date;
  lastGrade: string;
  countAsCorrect: boolean;
};

export async function upsertSrsProgress(input: SrsUpsertInput): Promise<void> {
  const existing = await findSrsProgress(
    input.userId,
    input.sourceType,
    input.sourceId,
  );

  if (existing) {
    await db
      .update(userProgress)
      .set({
        easeFactor: input.easeFactor,
        intervalDays: input.intervalDays,
        repetitions: input.repetitions,
        dueAt: input.dueAt,
        lastReviewedAt: input.lastReviewedAt,
        lastGrade: input.lastGrade,
        totalReviews: existing.totalReviews + 1,
        correctReviews:
          existing.correctReviews + (input.countAsCorrect ? 1 : 0),
      })
      .where(eq(userProgress.id, existing.id));
    return;
  }

  await db.insert(userProgress).values({
    userId: input.userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    easeFactor: input.easeFactor,
    intervalDays: input.intervalDays,
    repetitions: input.repetitions,
    dueAt: input.dueAt,
    lastReviewedAt: input.lastReviewedAt,
    lastGrade: input.lastGrade,
    totalReviews: 1,
    correctReviews: input.countAsCorrect ? 1 : 0,
  });
}
