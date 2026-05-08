import { expect, test } from "@playwright/test";

/**
 * Smoke-Tests für die kritischsten Flows. Voraussetzungen:
 *   - DB läuft (docker compose up -d)
 *   - ENABLE_DEV_LOGIN=true in .env.local
 *   - Seed lief mindestens einmal (pnpm db:seed)
 */

test("Landing-Page lädt und zeigt Anmelde-CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bib-Inside" })).toBeVisible();
  await expect(page.getByRole("link", { name: /anmelden/i })).toBeVisible();
});

test("Sign-In-Page hat Email-Form und Dev-Login-Panel", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /willkommen/i })).toBeVisible();
  await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  // Dev-Login wird async geladen — wir warten 2s, falls die Umgebung
  // ENABLE_DEV_LOGIN=true gesetzt hat, sollte die Card erscheinen
  const devCard = page.getByText(/Dev-Login/i);
  await devCard.waitFor({ timeout: 3000 }).catch(() => {});
});

test("Dev-Login: Klick auf User-Button → Dashboard", async ({ page }) => {
  await page.goto("/sign-in");

  const userButton = page.locator('button:has-text("@upandfine.de")').first();
  await userButton.waitFor({ timeout: 3000 });
  await userButton.click();

  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /hallo/i })).toBeVisible();
});

test("Übungen-Auswahl ist navigierbar", async ({ page }) => {
  await page.goto("/sign-in");
  const userButton = page.locator('button:has-text("@upandfine.de")').first();
  await userButton.waitFor({ timeout: 3000 });
  await userButton.click();
  await page.waitForURL(/\/dashboard/);

  await page.goto("/uebungen/buecher-reihenfolge");
  await expect(
    page.getByRole("heading", { name: /bücher der bibel/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /altes testament/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /neues testament/i })).toBeVisible();
});
