import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anmeldung fehlgeschlagen",
};

const messages: Record<string, string> = {
  Configuration:
    "Die Anmeldung ist gerade nicht verfügbar. Bitte versuche es später erneut.",
  AccessDenied: "Dieser Zugang wurde nicht freigegeben.",
  Verification:
    "Der Anmelde-Link ist abgelaufen oder bereits verwendet worden. Bitte fordere einen neuen an.",
  default: "Bei der Anmeldung ist etwas schiefgegangen. Bitte erneut versuchen.",
};

export default function SignInErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
      <ErrorContent searchParams={searchParams} />
    </main>
  );
}

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = (error && messages[error]) || messages.default;

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        Anmeldung fehlgeschlagen
      </h1>
      <p className="text-base text-muted-foreground">{message}</p>
      <Link
        href="/sign-in"
        className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Erneut versuchen
      </Link>
    </div>
  );
}
