import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import {
  findCourseOverview,
  getCourseProgress,
} from "@/lib/repositories/courses";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { DEFAULT_COURSE_SLUG } from "./_lib/constants";
import { ProgressBar } from "./_components/progress-bar";

export const metadata: Metadata = {
  title: "Lehrkurs",
};

export default async function LehrkursPage() {
  const user = await requireUser(routes.lehrkurs.overview());
  const [course, progress] = await Promise.all([
    findCourseOverview(DEFAULT_COURSE_SLUG),
    getCourseProgress(DEFAULT_COURSE_SLUG, user.id),
  ]);
  const progressByModule = new Map(progress.map((p) => [p.moduleId, p]));

  if (!course || course.modules.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Lehrkurs</h1>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          <p className="text-foreground">Noch keine Inhalte verfügbar.</p>
          <p className="mt-2">
            Sobald die Module gesetzt sind, erscheinen sie hier. Lokal hilft{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">pnpm db:seed</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {course.description}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Module
        </h2>
        <div className="space-y-3">
          {course.modules.map((m) => {
            const p = progressByModule.get(m.id);
            const total = p?.total ?? 0;
            const answered = p?.answered ?? 0;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            return (
              <Link
                key={m.id}
                href={routes.lehrkurs.module(m.orderIndex)}
                className="group flex items-start gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-semibold text-primary">
                  {m.orderIndex}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{m.title}</span>
                  </div>
                  {m.descriptionMd && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {m.descriptionMd}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">
                      {m.lessonCount}{" "}
                      {m.lessonCount === 1 ? "Lektion" : "Lektionen"}
                    </p>
                    {total > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <ProgressBar
                          answered={answered}
                          total={total}
                          percent={pct}
                        />
                      </>
                    )}
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
