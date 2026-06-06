/**
 * Erlaubte Origins für Server-Action-POSTs hinter dem Reverse-Proxy.
 *
 * Sliplane terminiert TLS am Edge: das Backend sieht den Request als HTTP und
 * unter einem internen Container-Host. Bei Server-Action-POSTs vergleicht
 * Next.js den `Origin`-Header (z. B. https://bib-inside.de) mit dem `Host`/
 * `X-Forwarded-Host`. Stimmen sie nicht überein, lehnt Next die Action
 * serverseitig mit 403 ab — im Browser sichtbar als „Verbindungsfehler" NACH
 * dem Absenden, während normale GET-Navigation weiter funktioniert (genau
 * dieses Muster: Lesen geht, Speichern/Auflösen/Upload nicht).
 *
 * Deshalb deklarieren wir die öffentlichen Hosts explizit als erlaubt. Die
 * Liste wird aus den konfigurierten URLs (NEXTAUTH_URL / NEXT_PUBLIC_APP_URL)
 * plus festen Fallbacks für Domain und Sliplane-Subdomain zusammengesetzt.
 */
function hostFromUrl(value) {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

const serverActionAllowedOrigins = Array.from(
  new Set(
    [
      hostFromUrl(process.env.NEXTAUTH_URL),
      hostFromUrl(process.env.NEXT_PUBLIC_APP_URL),
      "bib-inside.de",
      "www.bib-inside.de",
      "*.sliplane.app",
    ].filter(Boolean),
  ),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output für schlanken Docker-Build (Sliplane-tauglich)
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  // Server-Actions hinter dem Sliplane-Proxy: erlaubte Origins explizit
  // setzen, sonst 403 „Verbindungsfehler" nach dem Absenden (siehe oben).
  experimental: {
    serverActions: {
      allowedOrigins: serverActionAllowedOrigins,
    },
  },

  /**
   * Security-Header — werden für alle Routen gesetzt (auch statische Assets,
   * was ungefährlich ist). HSTS nur in Production aktivieren, weil Browser
   * lokal sonst http://localhost ablehnen würden.
   */
  async headers() {
    const securityHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "Permissions-Policy",
        value: [
          "camera=()",
          "microphone=()",
          "geolocation=()",
          "interest-cohort=()",
        ].join(", "),
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
