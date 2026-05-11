/**
 * Repository für Lehrkurs-Daten (Course → Module → Lesson → Section → Task).
 *
 * Zwei Haupt-Use-Cases:
 *   1. Übersicht: alle Module eines Kurses + Lektionen-Liste pro Modul
 *   2. Lektion-Detail: alle Sektionen + Tasks einer Lektion + zugehörige Verse
 *
 * Antworten des Lerners (`task_answers`) werden hier mitgeladen, damit die
 * UI direkt anzeigen kann „bereits bearbeitet" / „noch offen".
 */

import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  bibleBooks,
  bibleTranslations,
  courseLessons,
  courseLessonVerses,
  courseModules,
  courseSections,
  courses,
  taskAnswers,
  tasks,
  verseLearnItems,
  type BibleReference,
  type Task,
} from "@/db/schema";

// ====================================================================
// Course-Header + Module-Liste
// ====================================================================

export type CourseOverview = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  modules: ModuleSummary[];
};

export type ModuleSummary = {
  id: string;
  orderIndex: number;
  title: string;
  descriptionMd: string | null;
  goals: string[] | null;
  lessonCount: number;
};

/**
 * Lädt einen Kurs anhand seines Slugs samt aller Module.
 * `null` wenn der Kurs nicht existiert.
 */
export async function findCourseOverview(
  slug: string,
): Promise<CourseOverview | null> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
  });
  if (!course) return null;

  const modules = await db
    .select({
      id: courseModules.id,
      orderIndex: courseModules.orderIndex,
      title: courseModules.title,
      descriptionMd: courseModules.descriptionMd,
      goals: courseModules.goals,
    })
    .from(courseModules)
    .where(eq(courseModules.courseId, course.id))
    .orderBy(asc(courseModules.orderIndex));

  // Lessons pro Modul zählen — bei max. 10 Modulen ist N+1 vertretbar.
  const countsByModule = new Map<string, number>();
  if (modules.length > 0) {
    const moduleIds = modules.map((m) => m.id);
    const allLessons = await db
      .select({ moduleId: courseLessons.moduleId })
      .from(courseLessons)
      .where(inArray(courseLessons.moduleId, moduleIds));
    for (const l of allLessons) {
      countsByModule.set(l.moduleId, (countsByModule.get(l.moduleId) ?? 0) + 1);
    }
  }

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    modules: modules.map((m) => ({
      id: m.id,
      orderIndex: m.orderIndex,
      title: m.title,
      descriptionMd: m.descriptionMd,
      goals: m.goals,
      lessonCount: countsByModule.get(m.id) ?? 0,
    })),
  };
}

// ====================================================================
// Modul-Detail (Beschreibung + Lektionen-Liste)
// ====================================================================

export type ModuleDetail = {
  id: string;
  orderIndex: number;
  title: string;
  descriptionMd: string | null;
  goals: string[] | null;
  recommendedLiterature:
    | { author: string; title: string; publisher?: string }[]
    | null;
  lessons: { id: string; orderIndex: number; title: string }[];
};

export async function findModuleDetail(
  courseSlug: string,
  moduleOrder: number,
): Promise<ModuleDetail | null> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSlug),
  });
  if (!course) return null;

  const mod = await db.query.courseModules.findFirst({
    where: and(
      eq(courseModules.courseId, course.id),
      eq(courseModules.orderIndex, moduleOrder),
    ),
  });
  if (!mod) return null;

  const lessons = await db
    .select({
      id: courseLessons.id,
      orderIndex: courseLessons.orderIndex,
      title: courseLessons.title,
    })
    .from(courseLessons)
    .where(eq(courseLessons.moduleId, mod.id))
    .orderBy(asc(courseLessons.orderIndex));

  return {
    id: mod.id,
    orderIndex: mod.orderIndex,
    title: mod.title,
    descriptionMd: mod.descriptionMd,
    goals: mod.goals,
    recommendedLiterature: mod.recommendedLiterature,
    lessons,
  };
}

// ====================================================================
// Lektion-Detail (Sektionen + Tasks + Memorize-Verse + Lerner-Antworten)
// ====================================================================

export type LessonAnswer = {
  taskId: string;
  /** Typ-spezifisches Antwort-Objekt — Form siehe taskAnswers-Schema. */
  answer: Record<string, unknown>;
  /** Auto-Bewertung bei A-Typen (true/false), null bei B/C/D. */
  isAutoCorrect: boolean | null;
  /** Selbstbewertung bei B-Typen ("ok"/"partial"/"needs_review"/null). */
  selfGrade: string | null;
  updatedAt: Date;
};

export type LessonTask = {
  id: string;
  orderIndex: number;
  type: Task["type"];
  promptMd: string;
  references: BibleReference[] | null;
  config: Record<string, unknown> | null;
  expectedAnswerMd: string | null;
  /** Letzte Antwort des aktuellen Lerners zu dieser Aufgabe, falls vorhanden. */
  answer: LessonAnswer | null;
};

export type LessonSection = {
  id: string;
  orderIndex: number;
  title: string;
  introMd: string | null;
  references: BibleReference[] | null;
  tasks: LessonTask[];
};

export type LessonMemorizeVerse = {
  verseLearnItemId: string;
  bookAbbr: string;
  bookNameDe: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
  translationFullName: string;
  text: string;
};

export type LessonDetail = {
  id: string;
  orderIndex: number;
  title: string;
  module: { id: string; orderIndex: number; title: string };
  course: { id: string; slug: string; title: string };
  /** Geschwister-Lektionen für die „weiter"/„zurück"-Navigation. */
  navigation: {
    prev: { orderIndex: number; title: string } | null;
    next: { orderIndex: number; title: string } | null;
  };
  sections: LessonSection[];
  memorizeVerses: LessonMemorizeVerse[];
};

export async function findLessonDetail(
  courseSlug: string,
  moduleOrder: number,
  lessonOrder: number,
  userId: string,
): Promise<LessonDetail | null> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSlug),
  });
  if (!course) return null;

  const mod = await db.query.courseModules.findFirst({
    where: and(
      eq(courseModules.courseId, course.id),
      eq(courseModules.orderIndex, moduleOrder),
    ),
  });
  if (!mod) return null;

  const lesson = await db.query.courseLessons.findFirst({
    where: and(
      eq(courseLessons.moduleId, mod.id),
      eq(courseLessons.orderIndex, lessonOrder),
    ),
  });
  if (!lesson) return null;

  // Geschwister-Lektionen
  const siblings = await db
    .select({
      orderIndex: courseLessons.orderIndex,
      title: courseLessons.title,
    })
    .from(courseLessons)
    .where(eq(courseLessons.moduleId, mod.id))
    .orderBy(asc(courseLessons.orderIndex));

  const currentIdx = siblings.findIndex((s) => s.orderIndex === lessonOrder);
  const prev = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const next =
    currentIdx >= 0 && currentIdx < siblings.length - 1
      ? siblings[currentIdx + 1]
      : null;

  // Sektionen + Tasks
  const sections = await db
    .select({
      id: courseSections.id,
      orderIndex: courseSections.orderIndex,
      title: courseSections.title,
      introMd: courseSections.introMd,
      references: courseSections.references,
    })
    .from(courseSections)
    .where(eq(courseSections.lessonId, lesson.id))
    .orderBy(asc(courseSections.orderIndex));

  const sectionIds = sections.map((s) => s.id);
  const taskRows =
    sectionIds.length === 0
      ? []
      : await db
          .select({
            id: tasks.id,
            sectionId: tasks.sectionId,
            orderIndex: tasks.orderIndex,
            type: tasks.type,
            promptMd: tasks.promptMd,
            references: tasks.references,
            config: tasks.config,
            expectedAnswerMd: tasks.expectedAnswerMd,
          })
          .from(tasks)
          .where(inArray(tasks.sectionId, sectionIds))
          .orderBy(asc(tasks.orderIndex));

  // Letzte Antwort pro Task für diesen User
  const taskIds = taskRows.map((t) => t.id);
  const answers =
    taskIds.length === 0
      ? []
      : await db
          .select({
            taskId: taskAnswers.taskId,
            answer: taskAnswers.answer,
            isAutoCorrect: taskAnswers.isAutoCorrect,
            selfGrade: taskAnswers.selfGrade,
            updatedAt: taskAnswers.updatedAt,
          })
          .from(taskAnswers)
          .where(
            and(
              eq(taskAnswers.userId, userId),
              inArray(taskAnswers.taskId, taskIds),
            ),
          );

  const answerByTask = new Map(answers.map((a) => [a.taskId, a]));

  const sectionMap = new Map<string, LessonSection>(
    sections.map((s) => [
      s.id,
      {
        id: s.id,
        orderIndex: s.orderIndex,
        title: s.title,
        introMd: s.introMd,
        references: s.references,
        tasks: [],
      },
    ]),
  );

  for (const t of taskRows) {
    const section = sectionMap.get(t.sectionId);
    if (!section) continue;
    const ans = answerByTask.get(t.id);
    section.tasks.push({
      id: t.id,
      orderIndex: t.orderIndex,
      type: t.type,
      promptMd: t.promptMd,
      references: t.references,
      config: t.config,
      expectedAnswerMd: t.expectedAnswerMd,
      answer: ans
        ? {
            taskId: ans.taskId,
            answer: ans.answer,
            isAutoCorrect: ans.isAutoCorrect,
            selfGrade: ans.selfGrade,
            updatedAt: ans.updatedAt,
          }
        : null,
    });
  }

  // Memorize-Verse
  const memorizeVerses = await db
    .select({
      verseLearnItemId: verseLearnItems.id,
      bookAbbr: bibleBooks.abbr,
      bookNameDe: bibleBooks.nameDe,
      chapter: verseLearnItems.chapter,
      verseFrom: verseLearnItems.verseFrom,
      verseTo: verseLearnItems.verseTo,
      translationFullName: bibleTranslations.fullName,
      text: verseLearnItems.text,
    })
    .from(courseLessonVerses)
    .innerJoin(
      verseLearnItems,
      eq(courseLessonVerses.verseLearnItemId, verseLearnItems.id),
    )
    .innerJoin(bibleBooks, eq(verseLearnItems.bookId, bibleBooks.id))
    .innerJoin(
      bibleTranslations,
      eq(verseLearnItems.translationId, bibleTranslations.id),
    )
    .where(eq(courseLessonVerses.lessonId, lesson.id))
    .orderBy(asc(courseLessonVerses.orderIndex), asc(bibleTranslations.year));

  return {
    id: lesson.id,
    orderIndex: lesson.orderIndex,
    title: lesson.title,
    module: { id: mod.id, orderIndex: mod.orderIndex, title: mod.title },
    course: { id: course.id, slug: course.slug, title: course.title },
    navigation: { prev, next },
    sections: Array.from(sectionMap.values()),
    memorizeVerses,
  };
}

// ====================================================================
// Fortschritts-Aggregation (Course / Modul / Lektion)
// ====================================================================

/**
 * Aufgabentypen, die KEINEN task_answer-Eintrag erzeugen können oder sollen
 * — werden bei Fortschrittsberechnung weder im Zähler noch im Nenner
 * mitgerechnet:
 *
 *   - F2_thinking: hat absichtlich kein Save (rein Reflexion)
 *   - E1/E2_verse_memorize / E3_order_memorize: laufen außerhalb des
 *     Lehrkurs-Systems (SRS-Verse, Bücher-Übung) — würden sonst nie als
 *     "bearbeitet" zählen und den Fortschritt verzerren
 */
const NON_TRACKED_TASK_TYPES = new Set<Task["type"]>([
  "F2_thinking",
  "E1_verse_memorize",
  "E2_passage_memorize",
  "E3_order_memorize",
]);

export type LessonProgress = {
  lessonId: string;
  total: number;
  answered: number;
};

export type ModuleProgress = {
  moduleId: string;
  total: number;
  answered: number;
  lessons: LessonProgress[];
};

/**
 * Berechnet pro Modul + Lektion eines Kurses, wie viele Aufgaben es gibt
 * und wie viele der Lerner bereits beantwortet hat. Eine Aufgabe gilt als
 * „beantwortet", sobald ein `task_answers`-Eintrag für (userId, taskId)
 * existiert — der Inhalt wird nicht weiter geprüft, das wäre dem Lerner
 * gegenüber paternalistisch.
 *
 * Eine Query mit Joins über Course → Module → Lesson → Section → Task,
 * outer-joined gegen task_answers. Bei aktuell ~13 Aufgaben pro Lektion
 * und max. 30 Lektionen → unkritisch.
 */
export async function getCourseProgress(
  courseSlug: string,
  userId: string,
): Promise<ModuleProgress[]> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSlug),
  });
  if (!course) return [];

  const rows = await db
    .select({
      moduleId: courseModules.id,
      lessonId: courseLessons.id,
      taskId: tasks.id,
      taskType: tasks.type,
      hasAnswer: taskAnswers.id,
    })
    .from(courseModules)
    .innerJoin(courseLessons, eq(courseLessons.moduleId, courseModules.id))
    .innerJoin(courseSections, eq(courseSections.lessonId, courseLessons.id))
    .innerJoin(tasks, eq(tasks.sectionId, courseSections.id))
    .leftJoin(
      taskAnswers,
      and(eq(taskAnswers.taskId, tasks.id), eq(taskAnswers.userId, userId)),
    )
    .where(eq(courseModules.courseId, course.id));

  // Aggregation in der App — die SQL-Aggregation wäre möglich, aber bei der
  // kleinen Zeilenzahl ist die JS-Aggregation klarer.
  const moduleMap = new Map<string, ModuleProgress>();

  for (const r of rows) {
    if (NON_TRACKED_TASK_TYPES.has(r.taskType)) continue;

    let mod = moduleMap.get(r.moduleId);
    if (!mod) {
      mod = {
        moduleId: r.moduleId,
        total: 0,
        answered: 0,
        lessons: [],
      };
      moduleMap.set(r.moduleId, mod);
    }

    let lesson = mod.lessons.find((l) => l.lessonId === r.lessonId);
    if (!lesson) {
      lesson = { lessonId: r.lessonId, total: 0, answered: 0 };
      mod.lessons.push(lesson);
    }

    mod.total += 1;
    lesson.total += 1;
    if (r.hasAnswer !== null) {
      mod.answered += 1;
      lesson.answered += 1;
    }
  }

  return Array.from(moduleMap.values());
}

// ====================================================================
// Antwort speichern (Server-Action ruft diese Funktion auf)
// ====================================================================

export type SelfGrade = "ok" | "partial" | "needs_review";

export async function upsertTaskAnswer(input: {
  userId: string;
  taskId: string;
  courseVersion: number;
  answer: Record<string, unknown>;
  isAutoCorrect?: boolean | null;
  selfGrade?: SelfGrade | null;
}): Promise<void> {
  const existing = await db.query.taskAnswers.findFirst({
    where: and(
      eq(taskAnswers.userId, input.userId),
      eq(taskAnswers.taskId, input.taskId),
    ),
  });

  if (existing) {
    await db
      .update(taskAnswers)
      .set({
        answer: input.answer,
        isAutoCorrect: input.isAutoCorrect ?? null,
        selfGrade: input.selfGrade ?? null,
        updatedAt: new Date(),
      })
      .where(eq(taskAnswers.id, existing.id));
    return;
  }

  await db.insert(taskAnswers).values({
    userId: input.userId,
    taskId: input.taskId,
    courseVersion: input.courseVersion,
    answer: input.answer,
    isAutoCorrect: input.isAutoCorrect ?? null,
    selfGrade: input.selfGrade ?? null,
  });
}

