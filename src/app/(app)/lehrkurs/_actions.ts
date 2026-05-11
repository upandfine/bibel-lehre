"use server";

/**
 * Server-Actions für Lehrkurs-Aufgaben.
 *
 * Antworten werden in `task_answers` polymorph als jsonb gespeichert.
 * Form je Aufgabentyp:
 *
 *   A1 (true_false):           { answers: Record<string, boolean> }
 *   A2 (cloze):                { fills: Record<string, string> }
 *   A3 (match):                { matches: Record<string, string> }
 *   A5 (ordering):             { order: string[] }
 *   A6 (choice):               { selected: string[] }   // 1+ Items
 *   B1, C1-C5, D1-D3:          { text: string }
 *   B2 (list):                 { text: string }         // ein Eintrag/Zeile
 *   E4 (reading):              { done: boolean, doneAt }
 *   F1 (external_research):    { text: string } (optionale Notiz)
 *   F2 (thinking):             — kein Save
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
import {
  isChoiceCorrect,
  isClozeCorrect,
  isOrderingCorrect,
  isTrueFalseCorrect,
  isMatchCorrect,
  type ChoiceOption,
  type ClozeGap,
  type MatchPair,
  type TrueFalseStatement,
} from "@/lib/lehrkurs-grading";
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

const SaveClozeInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  /** Map: gapId → User-Eingabe als String. */
  fills: z.record(z.string(), z.string()),
});

const SaveOrderingInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  /** Liste der Item-Labels in der vom Lerner gewählten Reihenfolge. */
  order: z.array(z.string()),
});

const SaveChoiceInput = z.object({
  taskId: z.string().uuid(),
  moduleOrder: z.number().int().positive(),
  lessonOrder: z.number().int().positive(),
  /** Liste der angewählten Option-IDs (bei Single-Choice genau eine). */
  selected: z.array(z.string()),
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
 * Lädt die `config` eines Tasks aus der DB und liefert sie zurück — oder
 * null, wenn der Task fehlt oder keine Config hat. Die Bewertungs-Logik
 * selbst kommt aus `@/lib/lehrkurs-grading` (pure functions, getestet).
 */
async function getTaskConfig(taskId: string): Promise<Record<string, unknown> | null> {
  const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
  return (task?.config as Record<string, unknown> | undefined) ?? null;
}

async function autoCorrectTrueFalse(
  taskId: string,
  userAnswers: Record<string, boolean>,
): Promise<boolean | null> {
  const cfg = await getTaskConfig(taskId);
  const statements = cfg?.statements as TrueFalseStatement[] | undefined;
  if (!Array.isArray(statements)) return null;
  return isTrueFalseCorrect(userAnswers, statements);
}

async function autoCorrectMatch(
  taskId: string,
  userMatches: Record<string, string>,
): Promise<boolean | null> {
  const cfg = await getTaskConfig(taskId);
  const pairs = cfg?.pairs as MatchPair[] | undefined;
  if (!Array.isArray(pairs)) return null;
  return isMatchCorrect(userMatches, pairs);
}

async function autoCorrectCloze(
  taskId: string,
  userFills: Record<string, string>,
): Promise<boolean | null> {
  const cfg = await getTaskConfig(taskId);
  const gaps = cfg?.gaps as ClozeGap[] | undefined;
  if (!Array.isArray(gaps)) return null;
  return isClozeCorrect(userFills, gaps);
}

async function autoCorrectOrdering(
  taskId: string,
  userOrder: string[],
): Promise<boolean | null> {
  const cfg = await getTaskConfig(taskId);
  const items = cfg?.items as string[] | undefined;
  if (!Array.isArray(items)) return null;
  return isOrderingCorrect(userOrder, items);
}

async function autoCorrectChoice(
  taskId: string,
  userSelected: string[],
): Promise<boolean | null> {
  const cfg = await getTaskConfig(taskId);
  const options = cfg?.options as ChoiceOption[] | undefined;
  if (!Array.isArray(options)) return null;
  return isChoiceCorrect(userSelected, options);
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

export const saveClozeAnswer = validatedAction(
  SaveClozeInput,
  async ({ taskId, moduleOrder, lessonOrder, fills }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);
    const isAutoCorrect = await autoCorrectCloze(taskId, fills);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { fills },
      isAutoCorrect,
      selfGrade: null,
    });

    revalidatePath(routes.lehrkurs.lesson(moduleOrder, lessonOrder));
    return { ok: true as const, isAutoCorrect };
  },
);

export const saveOrderingAnswer = validatedAction(
  SaveOrderingInput,
  async ({ taskId, moduleOrder, lessonOrder, order }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);
    const isAutoCorrect = await autoCorrectOrdering(taskId, order);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { order },
      isAutoCorrect,
      selfGrade: null,
    });

    revalidatePath(routes.lehrkurs.lesson(moduleOrder, lessonOrder));
    return { ok: true as const, isAutoCorrect };
  },
);

export const saveChoiceAnswer = validatedAction(
  SaveChoiceInput,
  async ({ taskId, moduleOrder, lessonOrder, selected }) => {
    const userId = await getUserIdOrThrow();
    const courseVersion = await resolveCourseVersionForTask(taskId);
    const isAutoCorrect = await autoCorrectChoice(taskId, selected);

    await upsertTaskAnswer({
      userId,
      taskId,
      courseVersion,
      answer: { selected },
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
