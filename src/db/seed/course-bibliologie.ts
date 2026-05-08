/**
 * Seedet den Lehrkurs „Biblischer Unterricht" mit Modul 1 (Bibliologie)
 * und seiner ersten Lektion.
 *
 * Idempotent: Course wird per slug, alle anderen Entities per
 * (parent, orderIndex) wiedererkannt — bei wiederholtem Lauf wird
 * upgedatet, nicht dupliziert.
 *
 * Vorbedingung: `seedAdminUser` muss vorher gelaufen sein, weil der Kurs
 * dem Admin gehört. Verse aus `seedInitialVerses` werden über die
 * Junction-Tabelle `course_lesson_verses` an die Lektion geheftet.
 */

import { and, eq } from "drizzle-orm";
import { db } from "../index";
import {
  bibleBooks,
  courseLessons,
  courseLessonVerses,
  courseModules,
  courseSections,
  courses,
  tasks,
  verseLearnItems,
  type BibleReference,
} from "../schema";
import {
  bibliologieLessons,
  bibliologieSeed,
  courseSeed,
  type SeedBibleRef,
  type SeedSection,
  type SeedTask,
} from "../seed-data/course-bibliologie";

export async function seedCourseBibliologie(
  ownerId: string | null,
): Promise<void> {
  if (!ownerId) {
    console.log("→ Seed: Lehrkurs Bibliologie übersprungen (kein Admin)");
    return;
  }
  console.log("→ Seed: Lehrkurs Biblischer Unterricht — Modul 1 Bibliologie");

  const courseId = await upsertCourse(ownerId);
  const moduleId = await upsertBibliologieModule(courseId);

  // Buch-Lookup einmal cachen
  const books = await db.select().from(bibleBooks);
  const abbrToId = new Map(books.map((b) => [b.abbr, b.id]));

  let lessonsTouched = 0;
  let sectionsTouched = 0;
  let tasksTouched = 0;
  let versesLinked = 0;

  for (const lessonSeed of bibliologieLessons) {
    const lessonId = await upsertLesson(moduleId, lessonSeed.orderIndex, lessonSeed.title);
    lessonsTouched++;

    // Lektion-Verse verknüpfen
    versesLinked += await linkLessonVerses(
      lessonId,
      ownerId,
      lessonSeed.memorizeVerses.map((v) => ({
        bookId: abbrToId.get(v.bookAbbr),
        chapter: v.chapter,
        verseFrom: v.verseFrom,
        verseTo: v.verseTo,
      })),
    );

    for (const section of lessonSeed.sections) {
      const sectionId = await upsertSection(lessonId, section, abbrToId);
      sectionsTouched++;

      for (const task of section.tasks) {
        await upsertTask(sectionId, task, abbrToId);
        tasksTouched++;
      }
    }
  }

  console.log(
    `  ✓ ${lessonsTouched} Lektion(en), ${sectionsTouched} Sektionen, ${tasksTouched} Aufgaben, ${versesLinked} Lektion-Vers-Verknüpfungen`,
  );
}

// ====================================================================
// Helpers — alle idempotent (find-or-update-or-insert)
// ====================================================================

async function upsertCourse(ownerId: string): Promise<string> {
  const existing = await db.query.courses.findFirst({
    where: eq(courses.slug, courseSeed.slug),
  });

  if (existing) {
    await db
      .update(courses)
      .set({
        title: courseSeed.title,
        description: courseSeed.description,
        visibility: courseSeed.visibility,
        ownerId,
        status: "published",
        updatedAt: new Date(),
      })
      .where(eq(courses.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(courses)
    .values({
      slug: courseSeed.slug,
      title: courseSeed.title,
      description: courseSeed.description,
      ownerId,
      visibility: courseSeed.visibility,
      status: "published",
    })
    .returning({ id: courses.id });

  return inserted.id;
}

async function upsertBibliologieModule(courseId: string): Promise<string> {
  const existing = await db.query.courseModules.findFirst({
    where: and(
      eq(courseModules.courseId, courseId),
      eq(courseModules.orderIndex, bibliologieSeed.orderIndex),
    ),
  });

  if (existing) {
    await db
      .update(courseModules)
      .set({
        title: bibliologieSeed.title,
        descriptionMd: bibliologieSeed.descriptionMd,
        goals: bibliologieSeed.goals,
        recommendedLiterature: bibliologieSeed.recommendedLiterature,
      })
      .where(eq(courseModules.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(courseModules)
    .values({
      courseId,
      orderIndex: bibliologieSeed.orderIndex,
      title: bibliologieSeed.title,
      descriptionMd: bibliologieSeed.descriptionMd,
      goals: bibliologieSeed.goals,
      recommendedLiterature: bibliologieSeed.recommendedLiterature,
    })
    .returning({ id: courseModules.id });

  return inserted.id;
}

async function upsertLesson(
  moduleId: string,
  orderIndex: number,
  title: string,
): Promise<string> {
  const existing = await db.query.courseLessons.findFirst({
    where: and(
      eq(courseLessons.moduleId, moduleId),
      eq(courseLessons.orderIndex, orderIndex),
    ),
  });

  if (existing) {
    await db
      .update(courseLessons)
      .set({ title })
      .where(eq(courseLessons.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(courseLessons)
    .values({ moduleId, orderIndex, title })
    .returning({ id: courseLessons.id });

  return inserted.id;
}

async function upsertSection(
  lessonId: string,
  section: SeedSection,
  abbrToId: Map<string, number>,
): Promise<string> {
  const existing = await db.query.courseSections.findFirst({
    where: and(
      eq(courseSections.lessonId, lessonId),
      eq(courseSections.orderIndex, section.orderIndex),
    ),
  });

  const references = section.references
    ? section.references.map((r) => mapRef(r, abbrToId))
    : null;

  if (existing) {
    await db
      .update(courseSections)
      .set({
        title: section.title,
        introMd: section.introMd,
        references,
      })
      .where(eq(courseSections.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(courseSections)
    .values({
      lessonId,
      orderIndex: section.orderIndex,
      title: section.title,
      introMd: section.introMd,
      references,
    })
    .returning({ id: courseSections.id });

  return inserted.id;
}

async function upsertTask(
  sectionId: string,
  task: SeedTask,
  abbrToId: Map<string, number>,
): Promise<string> {
  const existing = await db.query.tasks.findFirst({
    where: and(
      eq(tasks.sectionId, sectionId),
      eq(tasks.orderIndex, task.orderIndex),
    ),
  });

  const references = task.references
    ? task.references.map((r) => mapRef(r, abbrToId))
    : null;

  if (existing) {
    await db
      .update(tasks)
      .set({
        type: task.type,
        promptMd: task.promptMd,
        references,
        expectedAnswerMd: task.expectedAnswerMd ?? null,
        config: task.config ?? null,
      })
      .where(eq(tasks.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(tasks)
    .values({
      sectionId,
      orderIndex: task.orderIndex,
      type: task.type,
      promptMd: task.promptMd,
      references,
      expectedAnswerMd: task.expectedAnswerMd ?? null,
      config: task.config ?? null,
    })
    .returning({ id: tasks.id });

  return inserted.id;
}

/**
 * Verknüpft Lernverse einer Lektion. Die Verse müssen im Katalog des
 * Admins (visibility=public) bereits existieren — `seedInitialVerses` legt
 * sie an. Wir suchen sie per (bookId, chapter, verseFrom, verseTo).
 *
 * Wenn ein Vers in mehreren Übersetzungen existiert, hängen wir alle
 * passenden an die Lektion (der Lerner sieht dann beim SRS-Lernen
 * automatisch die Variante, die er sich gewünscht hat).
 */
async function linkLessonVerses(
  lessonId: string,
  ownerId: string,
  verseRefs: { bookId: number | undefined; chapter: number; verseFrom: number; verseTo: number }[],
): Promise<number> {
  let count = 0;
  for (let i = 0; i < verseRefs.length; i++) {
    const ref = verseRefs[i];
    if (!ref.bookId) continue;

    const matchingVerses = await db
      .select({ id: verseLearnItems.id })
      .from(verseLearnItems)
      .where(
        and(
          eq(verseLearnItems.ownerId, ownerId),
          eq(verseLearnItems.bookId, ref.bookId),
          eq(verseLearnItems.chapter, ref.chapter),
          eq(verseLearnItems.verseFrom, ref.verseFrom),
          eq(verseLearnItems.verseTo, ref.verseTo),
        ),
      );

    for (const verse of matchingVerses) {
      const exists = await db.query.courseLessonVerses.findFirst({
        where: and(
          eq(courseLessonVerses.lessonId, lessonId),
          eq(courseLessonVerses.verseLearnItemId, verse.id),
        ),
      });

      if (!exists) {
        await db.insert(courseLessonVerses).values({
          lessonId,
          verseLearnItemId: verse.id,
          orderIndex: i,
        });
        count++;
      }
    }
  }
  return count;
}

function mapRef(
  ref: SeedBibleRef,
  abbrToId: Map<string, number>,
): BibleReference {
  const bookId = abbrToId.get(ref.bookAbbr);
  if (!bookId) {
    throw new Error(`Unbekannte Buch-Abkürzung: ${ref.bookAbbr}`);
  }
  return {
    bookId,
    chapter: ref.chapter,
    verseFrom: ref.verseFrom,
    verseTo: ref.verseTo,
  };
}
