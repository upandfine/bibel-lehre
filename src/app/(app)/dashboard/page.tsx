import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  // Layout (app)/layout.tsx hat die Session bereits sichergestellt — hier nur lesen.
  const session = await getServerSession(authOptions);
  const name = session?.user.name ?? session?.user.email ?? "Du";
  const firstName = name.split("@")[0].split(" ")[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Hallo {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Schön, dass du da bist.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium">Heute fällig</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hier siehst du bald deine fälligen Verse und die nächste Lektion.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-medium">Mein Fortschritt</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sobald du die ersten Lektionen oder Verse begonnen hast, siehst du
            hier deine Lernkurve.
          </p>
        </div>
      </section>
    </div>
  );
}
