import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin-Bereich",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  // Layout (app)/layout.tsx hat Login bereits geprüft — hier Rollen-Schutz.
  if (session?.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Admin-Bereich
      </h1>
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p className="text-foreground">Bald verfügbar.</p>
        <p className="mt-2">
          Hier wirst du Lehrkurse, Module, Lektionen und Aufgaben verwalten —
          das wird das größte Phase-1-Modul.
        </p>
      </div>
    </div>
  );
}
