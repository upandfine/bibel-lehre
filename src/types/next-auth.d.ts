import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  /**
   * Erweitert die Session um unsere DB-Felder (id, role).
   * Wird vom session()-Callback in src/lib/auth.ts gefüllt.
   */
  interface Session {
    user: {
      id: string;
      role: "admin" | "learner";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "admin" | "learner";
  }
}
