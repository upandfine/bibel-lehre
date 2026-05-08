"use client";

import { useEffect, useState } from "react";

type DevUser = { id: string; email: string; role: "admin" | "learner" };

/**
 * Lokales Schnell-Login. Wird auf /sign-in nur angezeigt, wenn der Server
 * der GET /api/dev-login mit User-Liste antwortet (was er nur tut, wenn
 * NODE_ENV=development UND ENABLE_DEV_LOGIN=true).
 */
export function DevLoginPanel() {
  const [users, setUsers] = useState<DevUser[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dev-login")
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.users) setUsers(data.users);
      })
      .catch(() => {});
  }, []);

  if (!users) return null; // Route nicht aktiv → Panel verschwindet still

  async function quickLogin(email: string) {
    setPending(email);
    setError(null);
    try {
      const res = await fetch("/api/dev-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `HTTP ${res.status}`);
        setPending(null);
        return;
      }
      // Hard-Reload, damit der Server-Component-Tree die neue Session sieht
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700/40 dark:bg-amber-950/20">
      <p className="font-medium text-amber-900 dark:text-amber-200">
        🔧 Dev-Login (lokal)
      </p>
      <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
        Schnell-Login ohne Magic-Link. Nur aktiv mit{" "}
        <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">
          ENABLE_DEV_LOGIN=true
        </code>{" "}
        in der lokalen .env.
      </p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => quickLogin(u.email)}
              disabled={pending !== null}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {pending === u.email ? "…" : "→"}
              <span>{u.email}</span>
              <span className="rounded bg-amber-200 px-1 text-[10px] uppercase dark:bg-amber-900/40">
                {u.role}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-3 text-xs text-red-700 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
