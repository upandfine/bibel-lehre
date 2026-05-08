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
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Nur die Schichten messen, für die wir aktuell Tests haben.
      // Pages, Server-Actions, UI-Komponenten kommen in einer späteren
      // Iteration mit Test-DB.
      include: [
        "src/lib/**/*.ts",
        "src/app/**/_components/utils.ts",
        "src/app/**/_components/cloze.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "src/lib/auth.ts", // braucht Mock von next-auth
        "src/lib/repositories/**", // braucht Test-DB
      ],
    },
  },
});
