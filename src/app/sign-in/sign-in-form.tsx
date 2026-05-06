"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben"),
});

type State =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success"; email: string };

export function SignInForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const parsed = SignInSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      setState({
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Ungültige Eingabe",
      });
      return;
    }

    setState({ status: "submitting" });

    try {
      const result = await signIn("email", {
        email: parsed.data.email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setState({
          status: "error",
          message:
            "Es gab ein Problem beim Versenden des Anmelde-Links. Bitte später erneut versuchen.",
        });
        return;
      }

      setState({ status: "success", email: parsed.data.email });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[sign-in] signIn failed", err);
      setState({
        status: "error",
        message:
          "Es gab ein Problem beim Versenden des Anmelde-Links. Bitte später erneut versuchen.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        <p className="font-medium">Wir haben dir eine E-Mail geschickt.</p>
        <p className="mt-2">
          Bitte schau in dein Postfach für{" "}
          <strong>{state.email}</strong> — dort findest du den Anmelde-Link.
        </p>
        <p className="mt-2 text-emerald-700">
          (Falls keine Mail ankommt, prüfe den Spam-Ordner.)
        </p>
      </div>
    );
  }

  const isPending = state.status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="dein.name@example.de"
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          disabled={isPending}
        />
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Sende Anmelde-Link …" : "Anmelde-Link per E-Mail senden"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Du bekommst einen Link zugeschickt — kein Passwort nötig.
      </p>
    </form>
  );
}
