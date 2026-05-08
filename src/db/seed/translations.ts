import { db } from "../index";
import { bibleTranslations } from "../schema";
import { translationsSeed } from "../seed-data/bible-translations";

export async function seedTranslations(): Promise<void> {
  console.log("→ Seed: Bibelübersetzungen");
  for (const t of translationsSeed) {
    await db
      .insert(bibleTranslations)
      .values({
        id: t.id,
        fullName: t.fullName,
        publisher: t.publisher,
        year: t.year,
        isPublicDomain: t.isPublicDomain,
        attribution: t.attribution,
        licenseStatus: t.licenseStatus,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${translationsSeed.length} Übersetzungen sichergestellt`);
}
