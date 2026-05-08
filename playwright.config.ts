import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Konfiguration für E2E-Smoke-Tests.
 *
 * Voraussetzungen vor `pnpm test:e2e`:
 *   - lokaler Postgres läuft (docker compose up -d)
 *   - .env.local hat ENABLE_DEV_LOGIN=true
 *
 * Der Test-Runner startet selbst `pnpm dev` und wartet bis Port 3050 da ist.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3050",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3050",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
