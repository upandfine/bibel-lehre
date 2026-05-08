import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";

/**
 * Stellt sicher, dass es einen Admin-User mit der Email aus
 * SEED_ADMIN_EMAIL gibt. Bestehende User mit dieser Email werden auf
 * role='admin' aktualisiert; sonst wird ein neuer User angelegt (der
 * sich beim ersten Login per Magic-Link authentifiziert).
 *
 * Returns: User-ID oder null wenn keine SEED_ADMIN_EMAIL gesetzt war.
 */
export async function seedAdminUser(): Promise<string | null> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log(
      "→ Seed: Admin-User übersprungen (SEED_ADMIN_EMAIL ist nicht gesetzt)",
    );
    return null;
  }
  console.log(`→ Seed: Admin-User ${email}`);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (existing.role !== "admin") {
      await db
        .update(users)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(users.id, existing.id));
      console.log("  ✓ Bestehender User auf Rolle 'admin' aktualisiert");
    } else {
      console.log("  ✓ Admin-User existiert bereits");
    }
    return existing.id;
  }

  const inserted = await db
    .insert(users)
    .values({
      email,
      role: "admin",
      name: email.split("@")[0],
    })
    .returning({ id: users.id });

  console.log("  ✓ Admin-User angelegt — bei nächster Anmeldung Magic-Link");
  return inserted[0]?.id ?? null;
}
