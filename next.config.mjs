/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output für schlanken Docker-Build (Sliplane-tauglich)
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // PWA-Manifest und Service-Worker werden später separat hinzugefügt
  experimental: {
    // Server Actions sind in Next 15 stabil, hier nur Optionen
  },
};

export default nextConfig;
