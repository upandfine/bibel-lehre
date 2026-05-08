/**
 * Zentraler Zugriff auf die NextAuth-Session.
 *
 * Zwei Familien von Helfern:
 *
 * - Für Pages und Layouts: requireUser / requireAdmin / getOptionalUser.
 *   Diese rufen bei fehlender Berechtigung redirect() auf, was nur in
 *   Server-Components funktioniert. Der Caller bekommt im Erfolgsfall
 *   einen typisierten User zurück.
 *
 * - Für Server-Actions: getUserIdOrThrow.
 *   Wirft eine UnauthorizedError, die der Action-Caller fangen kann.
 *   redirect() funktioniert dort zwar auch, aber Errors lassen sich von
 *   der UI sauberer mappen.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "./auth";

export class UnauthorizedError extends Error {
  constructor(message = "Nicht eingeloggt") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Keine Berechtigung") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type SessionUser = NonNullable<Session["user"]>;

/** Ohne Seiteneffekte. null = nicht eingeloggt. */
export async function getOptionalSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  const session = await getOptionalSession();
  return session?.user ?? null;
}

/**
 * Für Pages/Layouts. Wenn nicht eingeloggt, redirect auf /sign-in
 * (mit callbackUrl, sodass der Lerner zurückkommt).
 */
export async function requireUser(callbackPath?: string): Promise<SessionUser> {
  const user = await getOptionalUser();
  if (!user) {
    const target = callbackPath
      ? `/sign-in?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "/sign-in";
    redirect(target);
  }
  return user;
}

/**
 * Für Pages/Layouts mit Admin-Anforderung. Lerner werden mit Notice
 * zurück aufs Dashboard geschickt.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard?msg=admin-only");
  }
  return user;
}

/**
 * Für Server-Actions. Wirft UnauthorizedError, wenn keine Session.
 * Im UI mit try/catch fangen und z.B. einen Toast anzeigen.
 */
export async function getUserIdOrThrow(): Promise<string> {
  const user = await getOptionalUser();
  if (!user?.id) {
    throw new UnauthorizedError();
  }
  return user.id;
}

/** Wie getUserIdOrThrow, aber prüft zusätzlich auf admin-Rolle. */
export async function getAdminUserIdOrThrow(): Promise<string> {
  const user = await getOptionalUser();
  if (!user?.id) {
    throw new UnauthorizedError();
  }
  if (user.role !== "admin") {
    throw new ForbiddenError("Nur für Admins");
  }
  return user.id;
}
