import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck } from "lucide-react";
import { findLessonDetail } from "@/lib/repositories/courses";
import { requireUser } from "@/lib/session";
import { routes } from "@/lib/routes";
import { DEFAULT_COURSE_SLUG } from "../../_lib/constants";
import { LessonText } from "../../_components/lesson-text";
import { TaskRenderer } from "../../_components/task-renderer";

type Props = {
  params: Promise<{ moduleOrder: string; lessonOrder: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleOrder, lessonOrder } = await params;
  const m = Number(moduleOrder);
  const l = Number(lessonOrder);
  if (!Number.isFinite(m) || !Number.isFinite(l)) return { title: "Lektion" };
  // Wir laden hier nicht doppelt — der Title wird in der Page selbst
  // gerendert. Der Metadata-Title bleibt generisch, das ist OK.
  return { title: `Lektion ${l}` };
}

export default async function LessonPage({ params }: Props) {
  const { moduleOrder, lessonOrder } = await params;
  const m = Number(moduleOrder);
  const l = Number(lessonOrder);
  if (!Number.isFinite(m) || !Number.isFinite(l)) notFound();

  const user = await requireUser(routes.lehrkurs.lesson(m, l));
  const lesson = await findLessonDetail(DEFAULT_COURSE_SLUG, m, l, user.id);
  if (!lesson) notFound();

  // Eindeutige Verse pro Bibelstelle (eine Übersetzung reicht für die Anzeige)
  const uniqueVerses = dedupeVersesByReference(lesson.memorizeVerses);

  let taskCounter = 0;

  return (
    <div className="space-y-8">
      <Link
        href={routes.lehrkurs.module(lesson.module.orderIndex)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {lesson.module.title}
      </Link>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Modul {lesson.module.orderIndex} · Lektion {lesson.orderIndex}
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {lesson.title}
        </h1>
      </header>

      {uniqueVerses.length > 0 && (
        <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/[0.03] p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            <BookOpenCheck className="h-4 w-4" />
            Auswendig zu lernen
          </h2>
          <ul className="space-y-1 text-sm">
            {uniqueVerses.map((v) => (
              <li key={v.verseLearnItemId}>
                <span className="font-medium">
                  {v.bookNameDe} {v.chapter},{v.verseFrom}
                  {v.verseTo > v.verseFrom ? `-${v.verseTo}` : ""}
                </span>{" "}
                — geht in dein tägliches Vers-Lernen mit ein.
              </li>
            ))}
          </ul>
          <Link
            href={routes.verse.overview()}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Zu „Verse lernen"
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      <div className="space-y-10">
        {lesson.sections.map((section) => (
          <section key={section.id} className="space-y-4">
            <h2 className="font-serif text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            {section.introMd && <LessonText markdown={section.introMd} />}
            {section.tasks.length > 0 && (
              <div className="space-y-3">
                {section.tasks.map((task) => {
                  taskCounter++;
                  return (
                    <TaskRenderer
                      key={task.id}
                      task={task}
                      moduleOrder={lesson.module.orderIndex}
                      lessonOrder={lesson.orderIndex}
                      number={taskCounter}
                    />
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      <nav className="flex items-center justify-between gap-4 border-t pt-6">
        {lesson.navigation.prev ? (
          <Link
            href={routes.lehrkurs.lesson(
              lesson.module.orderIndex,
              lesson.navigation.prev.orderIndex,
            )}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {lesson.navigation.prev.title}
          </Link>
        ) : (
          <span />
        )}
        {lesson.navigation.next ? (
          <Link
            href={routes.lehrkurs.lesson(
              lesson.module.orderIndex,
              lesson.navigation.next.orderIndex,
            )}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
          >
            {lesson.navigation.next.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={routes.lehrkurs.module(lesson.module.orderIndex)}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
          >
            Modul-Übersicht
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}

/**
 * Wenn ein Vers in mehreren Übersetzungen verknüpft ist, zeigen wir ihn
 * trotzdem nur einmal in der „Auswendig"-Box — der Lerner sieht im
 * SRS-Lernen ohnehin alle Übersetzungen.
 */
function dedupeVersesByReference<
  T extends { bookAbbr: string; chapter: number; verseFrom: number; verseTo: number },
>(verses: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of verses) {
    const key = `${v.bookAbbr}-${v.chapter}-${v.verseFrom}-${v.verseTo}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}
