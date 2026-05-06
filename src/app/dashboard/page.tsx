import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Doppelt gesichert (Middleware sollte schon redirected haben).
  if (!session?.user) {
    redirect("/sign-in");
  }

  const name = session.user.name ?? session.user.email ?? "Du";
  const role = session.user.role;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bib-Inside</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Hallo {name.split(" ")[0]} 👋
          </h1>
        </div>
        <SignOutButton />
      </header>

      <section className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Schön, dass du da bist.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hier wird bald dein persönliches Dashboard zu sehen sein: aktuelle
            Lektion, fällige Verse, Lernfortschritt.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Im MVP-Stand siehst du nur, dass die Anmeldung funktioniert.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 text-sm">
          <p className="font-medium">Eingeloggt als</p>
          <dl className="mt-3 space-y-1 text-muted-foreground">
            <div className="flex">
              <dt className="w-24">E-Mail:</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div className="flex">
              <dt className="w-24">Rolle:</dt>
              <dd>{role}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
