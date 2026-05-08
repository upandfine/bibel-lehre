/**
 * Audit-Log für Admin- und Sicherheits-relevante Aktionen.
 *
 * Tabelle audit_log existiert seit dem ersten Schema; bisher haben wir
 * sie nicht beschrieben. Der Helper hier ist die einzige Stelle, an der
 * neue Einträge entstehen sollten.
 *
 * Konvention für `action`:
 *   "namespace.event" als kebab-case-Slug, analog zu log.ts
 *   z.B. "user.role.change", "course.publish", "verse.delete"
 *
 * targetType + targetId zeigen auf die betroffene Entität (UUID-strings,
 * weil polymorph). payload speichert vorher/nachher-Snapshots.
 */

import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { log } from "@/lib/log";

export type AuditEntry = {
  userId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  payload?: Record<string, unknown>;
};

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      payload: entry.payload,
    });
  } catch (err) {
    // Audit-Logging darf den eigentlichen Vorgang nicht blockieren —
    // wenn die DB hier scheitert, ist das ein Hintergrund-Problem, das
    // wir nur loggen.
    log.error("audit.write.fail", {
      action: entry.action,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
