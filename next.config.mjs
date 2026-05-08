/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output für schlanken Docker-Build (Sliplane-tauglich)
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

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
