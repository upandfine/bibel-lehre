/**
 * Edge-Middleware für Routenschutz.
 *
 * Mit NextAuth Database-Sessions: wir checken nur die Anwesenheit des
 * Session-Cookies. Die echte Session-Validierung passiert server-seitig
 * über getServerSession(authOptions) in der jeweiligen Page.
 *
 * Vorteil: läuft auf Edge Runtime ohne DB-Connection.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Beide möglichen Cookie-Namen prüfen — robust gegen
  // Reverse-Proxy-Konfigurationen, in denen das Protokoll nicht eindeutig ist.
  const hasSession =
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.cookies.has("next-auth.session-token");

  if (!hasSession) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
