/**
 * Einfacher in-memory Sliding-Window-Rate-Limiter.
 *
 * Vorbehalt: Map ist pro Server-Instanz — bei Sliplane mit nur einem
 * Container ist das ausreichend, bei horizontaler Skalierung müsste
 * Redis/Upstash dahinter. Reicht für Phase 1.
 *
 * Schutz gegen:
 *   - Magic-Link-Spam an /sign-in (Mailbomb-Mitigation)
 *   - Login-Brute-Force an /api/dev-login (in Dev nicht relevant, in
 *     Production durch NODE_ENV-Check sowieso tot)
 *
 * Aufruf:
 *   const ok = checkRateLimit("signin", clientIp, { max: 5, windowMs: 600_000 });
 *   if (!ok) return new Response("Too many requests", { status: 429 });
 */

import { log } from "./log";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupAt = Date.now();

function maybeCleanup(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
  lastCleanupAt = now;
}

export type RateLimitOptions = {
  /** Maximale Anfragen pro Fenster. */
  max: number;
  /** Fenstergröße in Millisekunden. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Inkrementiert den Zähler für (scope, key) und gibt zurück, ob die
 * Anfrage erlaubt ist. Scope trennt verschiedene Endpunkte; key ist
 * üblicherweise die Client-IP.
 */
export function consumeRateLimit(
  scope: string,
  key: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  maybeCleanup(now);

  const bucketKey = `${scope}:${key}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
    return {
      allowed: true,
      remaining: opts.max - 1,
      resetAt: now + opts.windowMs,
    };
  }

  if (existing.count >= opts.max) {
    log.warn("rateLimit.exceeded", { scope, key, max: opts.max });
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: opts.max - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Holt eine möglichst echte Client-IP aus dem Request (hinter Sliplane-Proxy). */
export function clientIpFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
