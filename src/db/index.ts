/**
 * DB-Client. Wird in Server Actions / Route Handlers / Loader importiert.
 *
 * Drizzle + postgres.js. Wir verwenden die "postgres"-Library statt "pg",
 * weil sie schneller startet und weniger Ressourcen braucht — passt zu Sliplane.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL ist nicht gesetzt. Siehe .env.example für ein Beispiel.",
  );
}

/**
 * Pooled Connection — Default in Next.js Server Components.
 * Sliplane Postgres unterstützt Pooling out-of-the-box.
 */
const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
export { schema };
