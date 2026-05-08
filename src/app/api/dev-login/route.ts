/**
 * DEV-ONLY: Schneller Login ohne Magic-Link-Versand.
 *
 * Doppelte Sicherheit gegen versehentliche Aktivierung in Production:
 *   1. NODE_ENV muss "development" sein
 *   2. ENABLE_DEV_LOGIN muss explizit "true" sein
 *
 * Sliplane setzt NODE_ENV=production und unsere .env.example setzt
 * ENABLE_DEV_LOGIN nicht — die Route ist also live nicht erreichbar.
 *
 * Lokal genügt in .env.local:
 *   ENABLE_DEV_LOGIN=true
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

const SESSION_DAYS = 30;

function isDevLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEV_LOGIN === "true"
  );
}

function forbidden() {
  return NextResponse.json(
    {
      error:
        "Dev-Login ist nicht aktiv. Setze NODE_ENV=development und ENABLE_DEV_LOGIN=true.",
    },
    { status: 403 },
  );
}

/**
 * Schützt vor cross-origin POSTs (CSRF). Server-Actions in Next 14 prüfen das
 * automatisch — diese Route ist aber eine klassische Route-Handler-API und
 * muss es selbst tun.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

/** GET listet die in der DB vorhandenen User auf — UI zeigt sie als Buttons. */
export async function GET() {
  if (!isDevLoginEnabled()) return forbidden();

  const list = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .orderBy(users.email);

  return NextResponse.json({ users: list });
}

/** POST { email } — legt eine neue Session an, setzt das NextAuth-Cookie. */
export async function POST(request: Request) {
  if (!isDevLoginEnabled()) return forbidden();
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin POST nicht erlaubt." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    return NextResponse.json(
      {
        error: `Kein User mit ${email} gefunden. pnpm db:seed läuft als sommer@upandfine.de.`,
      },
      { status: 404 },
    );
  }

  // Session-Token analog zu dem, was der Drizzle-Adapter bei einem
  // erfolgreichen Magic-Link-Klick erzeugen würde.
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    sessionToken,
    userId: user.id,
    expires,
  });

  // Cookie-Name aus zentraler Konstante. Lokal ist HTTP → unsichere Variante.
  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
