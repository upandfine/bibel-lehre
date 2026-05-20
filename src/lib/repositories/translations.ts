/**
 * Repository für die Übersetzungs-Stammdaten (bible_translations).
 *
 * Wird für das Übersetzungs-Dropdown im Vers-Editor gebraucht. Kein
 * Volltext — nur Metadaten + Pflicht-Attribution pro Übersetzung.
 */

import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { bibleTranslations } from "@/db/schema";

export type TranslationOption = {
  id: string;
  fullName: string;
  attribution: string | null;
  licenseStatus: string | null;
};

/** Alle Übersetzungen, alphabetisch nach Anzeigename. */
export async function findAllTranslations(): Promise<TranslationOption[]> {
  return db
    .select({
      id: bibleTranslations.id,
      fullName: bibleTranslations.fullName,
      attribution: bibleTranslations.attribution,
      licenseStatus: bibleTranslations.licenseStatus,
    })
    .from(bibleTranslations)
    .orderBy(asc(bibleTranslations.fullName));
}
