/**
 * Reine Eingabe-Validierung für den Vers-Editor (keine DB, kein server-only)
 * — damit als Vitest-Unit testbar und sowohl in Server-Action als auch
 * (optional) im Client nutzbar.
 *
 * Bibelstelle als strukturierte Felder gemäß CLAUDE.md-Konvention
 * (bookId/chapter/verseFrom/verseTo), nicht als String "Joh 3,16".
 */

import { z } from "zod";

export const verseVisibilities = ["private", "group", "public"] as const;
export type VerseVisibility = (typeof verseVisibilities)[number];

const trimmedNonEmpty = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1).max(max));

export const VerseInputSchema = z
  .object({
    bookId: z.coerce
      .number()
      .int()
      .min(1, "Buch wählen")
      .max(66, "Ungültiges Buch"),
    chapter: z.coerce.number().int().min(1, "Kapitel ≥ 1").max(150),
    verseFrom: z.coerce.number().int().min(1, "Vers ≥ 1").max(176),
    verseTo: z.coerce.number().int().min(1).max(176),
    translationId: trimmedNonEmpty(20),
    text: trimmedNonEmpty(8000),
    visibility: z.enum(verseVisibilities).default("public"),
    attributionOverride: z
      .string()
      .max(500)
      .optional()
      .transform((s) => {
        const t = (s ?? "").trim();
        return t.length === 0 ? null : t;
      }),
  })
  .refine((v) => v.verseTo >= v.verseFrom, {
    message: "Vers-bis muss ≥ Vers-von sein",
    path: ["verseTo"],
  });

export type VerseInput = z.infer<typeof VerseInputSchema>;

export const CreateVerseSchema = VerseInputSchema;

export const UpdateVerseSchema = z.object({
  id: z.string().uuid("Ungültige Vers-ID"),
  data: VerseInputSchema,
});

export const DeleteVerseSchema = z.object({
  id: z.string().uuid("Ungültige Vers-ID"),
});
