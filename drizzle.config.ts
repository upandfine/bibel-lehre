import "dotenv/config";
import type { Config } from "drizzle-kit";

// Lade .env.local zusätzlich (Next.js-Konvention für lokale Overrides)
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env.local", override: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ist nicht gesetzt — siehe .env.example");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
