// Wendet ausstehende Drizzle-Migrationen an.
// Wird im Production-Container vor dem Server-Start aufgerufen.
//
// Nutzt nur runtime-Dependencies (drizzle-orm, postgres) — drizzle-kit ist
// dev-only und nicht im Image enthalten.

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL ist nicht gesetzt — Abbruch.");
  process.exit(1);
}

const client = postgres(url, { max: 1 });

try {
  console.log("[migrate] Wende ausstehende Migrationen an …");
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("[migrate] Fertig.");
} catch (err) {
  console.error("[migrate] Fehler beim Migrieren:", err);
  process.exit(1);
} finally {
  await client.end({ timeout: 5 });
}
