/**
 * NextAuth verwendet zwei verschiedene Cookie-Namen:
 *   - HTTP (lokal):    next-auth.session-token
 *   - HTTPS (prod):    __Secure-next-auth.session-token
 *
 * Beim Lesen aus dem Request-Header sollten beide geprüft werden, weil
 * Reverse-Proxy-Konfigurationen (Sliplane macht TLS-Termination am Edge)
 * dazu führen können, dass das Backend den Request als HTTP sieht, obwohl
 * der Browser HTTPS spricht.
 *
 * Beim Schreiben (z.B. /api/dev-login) reicht der unsichere Name in dev,
 * weil dev grundsätzlich HTTP ist.
 */

export const SESSION_COOKIE_NAME = "next-auth.session-token";
export const SESSION_COOKIE_NAME_SECURE = "__Secure-next-auth.session-token";

export const SESSION_COOKIE_NAMES = [
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME_SECURE,
] as const;
