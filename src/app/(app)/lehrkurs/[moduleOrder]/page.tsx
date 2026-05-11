import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import {
  findModuleDetail,
  getCourseProgress,
} from "@/lib/repositories/courses";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { DEFAULT_COURSE_SLUG } from "../_lib/constants";
import { ProgressBar } from "../_components/progress-bar";

type Props = {
  params: Promise<{ moduleOrder: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleOrder } = await params;
  const order = Number(moduleOrder);
  if (!Number.isFinite(order)) return { title: "Modul" };
  const mod = await findModuleDetail(DEFAULT_COURSE_SLUG, order);
  return { title: mod?.title ?? "Modul" };
}

export default async function ModulePage({ params }: Props) {
  const { moduleOrder } = await params;
  const order = Number(moduleOrder);
  if (!Number.isFinite(order)) notFound();

  const user = await requireUser(routes.lehrkurs.module(order));
  const [mod, progress] = await Promise.all([
    findModuleDetail(DEFAULT_COURSE_SLUG, order),
    getCourseProgress(DEFAULT_COURSE_SLUG, user.id),
  ]);
  if (!mod) notFound();

  const modProgress = progress.find((p) => p.moduleId === mod.id);
  const progressByLesson = new Map(
    (modProgress?.lessons ?? []).map((l) => [l.lessonId, l]),
  );

  return (
    <div className="space-y-8">
      <Link
        href={routes.lehrkurs.overview()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Modul-Übersicht
      </Link>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Modul {mod.orderIndex}
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {mod.title}
        </h1>
        {mod.descriptionMd && (
          <p className="max-w-3xl text-sm text-muted-foreground">
            {mod.descriptionMd}
          </p>
        )}
      </header>

      {mod.goals && mod.goals.length > 0 && (
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Lernziele
          </h2>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            {mod.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Lektionen
        </h2>
        {mod.lessons.length === 0 ? (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            Für dieses Modul sind noch keine Lektionen angelegt.
          </div>
        ) : (
          <div className="space-y-2">
            {mod.lessons.map((l) => {
              const lp = progressByLesson.get(l.id);
              const total = lp?.total ?? 0;
              const answered = lp?.answered ?? 0;
              const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
              return (
                <Link
                  key={l.id}
                  href={routes.lehrkurs.lesson(mod.orderIndex, l.orderIndex)}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-5 py-4 transition-colors hover:border-foreground/40 hover:bg-accent"
                >
                  <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Lektion {l.orderIndex} — {l.title}
                    </p>
                    {total > 0 && (
                      <div className="mt-2">
                        <ProgressBar
                          answered={answered}
                          total={total}
                          percent={pct}
                        />
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {mod.recommendedLiterature && mod.recommendedLiterature.length > 0 && (
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Empfohlene Literatur
          </h2>
          <ul className="space-y-2 text-sm">
            {mod.recommendedLiterature.map((b, i) => (
              <li key={i}>
                <span className="font-medium">{b.author}</span> —{" "}
                <em>{b.title}</em>
                {b.publisher && (
                  <span className="text-muted-foreground"> ({b.publisher})</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

