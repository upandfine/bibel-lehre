import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Anmelden",
};

export default function SignInPage() {
  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <Link
            href="/"
            className="inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Bib-Inside
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Willkommen zurück
          </h1>
          <p className="text-sm text-muted-foreground">
            Wir schicken dir einen Anmelde-Link an deine E-Mail-Adresse.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
