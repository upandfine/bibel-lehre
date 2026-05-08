import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { findCourseOverview } from "@/lib/repositories/courses";
import { routes } from "@/lib/routes";
import { DEFAULT_COURSE_SLUG } from "./_lib/constants";

export const metadata: Metadata = {
  title: "Lehrkurs",
};

export default async function LehrkursPage() {
  const course = await findCourseOverview(DEFAULT_COURSE_SLUG);

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
          {course.modules.map((m) => (
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
                <p className="mt-2 text-xs text-muted-foreground">
                  {m.lessonCount}{" "}
                  {m.lessonCount === 1 ? "Lektion" : "Lektionen"}
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
