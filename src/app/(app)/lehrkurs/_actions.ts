"use server";

/**
 * Server-Actions für Lehrkurs-Aufgaben.
 *
 * Antworten werden in `task_answers` polymorph als jsonb gespeichert.
 * Form je Aufgabentyp:
 *
 *   A1 (true_false):           { answers: Record<string, boolean> }
 *   A3 (match):                { matches: Record<string, string> }
 *   B1, C1, D2 (text):         { text: string }
 *   F2 (thinking):             — kein Save (rein zum Nachdenken)
 *
 * Alle Eingaben gehen durch Zod, der Caller muss sich um keine
 * Validierung kümmern.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { courses, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validatedAction } from "@/lib/action-helpers";
import { upsertTaskAnswer, type SelfGrade } from "@/lib/repositories/courses";
import { getUserIdOrThrow } from "@/lib/session";
import { routes } from "@/lib/routes";
import { DEFAULT_COURSE_SLUG } from "./_lib/constants";

const SaveTextAnswerInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  text: z.string().max(10_000),
  selfGrade: z
    .enum(["ok", "partial", "needs_review"])
    .optional()
    .nullable(),
});

const SaveTrueFalseInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  /** Map: statementId → User-Antwort (true/false). */
  answers: z.record(z.string(), z.boolean()),
});

const SaveMatchInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  /** Map: leftLabel → rightLabel. */
  matches: z.record(z.string(), z.string()),
});

const ToggleReadingInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  done: z.boolean(),
});

/**
 * Holt die aktuelle courseVersion + verifiziert, dass die Aufgabe zum
 * Standard-Course gehört. Verhindert, dass jemand fremde taskIds
 * (in der theoretischen Multi-Course-Welt) speichert.
 */
async function resolveCourseVersionForTask(taskId: string): Promise<number> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, DEFAULT_COURSE_SLUG),
  });
  if (!course) {
    throw new Error("Kurs nicht gefunden");
  }
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task) {
    throw new Error("Aufgabe nicht gefunden");
  }
  return course.version;
}

/**
 * Auto-Bewertung für A1 (true_false): Vergleich mit der `config.statements[].answer`.
 * Liefert true, wenn alle Items korrekt sind, sonst false.
 */
async function autoCorrectTrueFalse(
  taskId: string,
  userAnswers: Record<string, boolean>,
): Promise<boolean | null> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task?.config) return null;

  const cfg = task.config as { statements?: { id: string; answer: boolean }[] };
  if (!cfg.statements) return null;

  return cfg.statements.every((s) => userAnswers[s.id] === s.answer);
}

/** Auto-Bewertung für A3 (match): jeder Eintrag muss exakt zum config-Pair passen. */
async function autoCorrectMatch(
  taskId: string,
  userMatches: Record<string, string>,
): Promise<boolean | null> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task?.config) return null;

  const cfg = task.config as { pairs?: { left: string; right: string }[] };
  if (!cfg.pairs) return null;

  return cfg.pairs.every((p) => userMatches[p.left] === p.right);
}

export const saveTextAnswer = validatedAction(
  SaveTextAnswerInput,
  async ({ taskId, moduleOrder, lessonOrder, text, selfGrade }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { text },
      isAutoCorrect: null,
      selfGrade: (selfGrade ?? null) as SelfGrade | null,
    });

    revalidatePath(routes.lehrkurs.lesson(moduleOrder, lessonOrder));
    return { ok: true as const };
  },
);

export const saveTrueFalseAnswer = validatedAction(
  SaveTrueFalseInput,
  async ({ taskId, moduleOrder, lessonOrder, answers }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);
    const isAutoCorrect = await autoCorrectTrueFalse(taskId, answers);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { answers },
      isAutoCorrect,
      selfGrade: null,
    });

    revalidatePath(routes.lehrkurs.lesson(moduleOrder, lessonOrder));
    return { ok: true as const, isAutoCorrect };
  },
);

export const saveMatchAnswer = validatedAction(
  SaveMatchInput,
  async ({ taskId, moduleOrder, lessonOrder, matches }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);
    const isAutoCorrect = await autoCorrectMatch(taskId, matches);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { matches },
      isAutoCorrect,
      selfGrade: null,
    });

    revalidatePath(routes.lehrkurs.lesson(moduleOrder, lessonOrder));
    return { ok: true as const, isAutoCorrect };
  },
);

/**
 * E4_reading: Lerner markiert eine Lese-Aufgabe als „erledigt" oder hebt
 * die Markierung wieder auf. Antwort-Payload: `{ done: boolean, doneAt? }`.
 */
export const toggleReadingDone = validatedAction(
  ToggleReadingInput,
  async ({ taskId, moduleOrder, lessonOrder, done }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { done, doneAt: done ? new Date().toISOString() : null },
      isAutoCorrect: null,
      selfGrade: null,
    });

    revalidatePath(routes.lehrkurs.lesson(moduleOrder, lessonOrder));
    return { ok: true as const };
  },
);
