/**
 * Minimaler, bewusst defensiver Service Worker für Bib-Inside.
 *
 * Designziel: Offline-Robustheit für die App-Hülle und statische Assets,
 * OHNE jemals dynamische Schreibvorgänge zu stören. Konkret fängt dieser
 * SW NIEMALS ab:
 *
 *   - non-GET-Requests (POST/PUT/DELETE) → Server-Actions, Audio-Upload,
 *     NextAuth-Callbacks laufen ungehindert durchs Netz. (Genau hier lag der
 *     ursprüngliche „Verbindungsfehler nach dem Absenden" — ein SW, der POSTs
 *     anfasst, würde ihn reproduzieren.)
 *   - /api/* → Auth, Audio-Streaming (Range!), Health.
 *   - RSC-/Server-Action-Navigationen (Header `RSC`/`Next-Action` bzw.
 *     `?_rsc=`-Query) → Next.js-interne Datenflüsse bleiben unangetastet.
 *   - Fremd-Origins.
 *
 * Strategie für den Rest (reine GET-Same-Origin-Requests):
 *   - /_next/static/* + Icons/Manifest: cache-first (immutable, gehasht).
 *   - Navigationen (Dokumente): network-first, Fallback auf Cache, sonst
 *     eine schlichte Offline-Notiz.
 */

const CACHE_VERSION = "bib-inside-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;

self.addEventListener("install", (event) => {
  // Sofort aktiv werden — bei neuem Deploy ersetzt die neue Version die alte
  // ohne dass der Nutzer alle Tabs schließen muss.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Alte Cache-Generationen aufräumen (bei CACHE_VERSION-Bump).
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function shouldBypass(request, url) {
  // Nur GET anfassen — alles andere (POST/Server-Actions/Upload) durchlassen.
  if (request.method !== "GET") return true;
  // Nur Same-Origin.
  if (url.origin !== self.location.origin) return true;
  // API-Routen nie cachen (Auth, Audio-Range-Streaming, Health).
  if (url.pathname.startsWith("/api/")) return true;
  // RSC-/Server-Action-Datenflüsse von Next.js nie anfassen.
  if (url.searchParams.has("_rsc")) return true;
  const accept = request.headers.get("accept") || "";
  if (
    request.headers.has("RSC") ||
    request.headers.has("Next-Action") ||
    accept.includes("text/x-component")
  ) {
    return true;
  }
  return false;
}

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(?:svg|png|ico|webmanifest|css|woff2?)$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypass(request, url)) return; // Browser handhabt normal.

  // Statische, gehashte Assets: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
    return;
  }

  // Navigationen (HTML-Dokumente): network-first mit Cache-Fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(PAGES_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Offline</title></head><body style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf8f4;color:#1a2233;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center\"><div><h1 style=\"font-size:20px;margin:0 0 8px\">Gerade offline</h1><p style=\"color:#5a6478;margin:0\">Diese Seite ist noch nicht zwischengespeichert. Sobald du wieder Verbindung hast, lädt sie ganz normal.</p></div></body></html>",
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
          );
        }
      })(),
    );
    return;
  }

  // Alles Übrige (sonstige GETs): einfach durchs Netz, ohne Cache.
});
