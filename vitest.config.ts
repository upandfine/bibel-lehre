import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Alle Pages und Routen ignorieren — wir testen nur Helpers/Pure-Logic
    exclude: ["**/node_modules/**", "**/.next/**", "**/playwright-report/**"],
  },
});
