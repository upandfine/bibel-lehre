import { z } from "zod";

/**
 * Wrapper für Server-Actions mit eingebauter Eingabe-Validierung.
 *
 * Beispiel:
 *
 *   const RecordReviewInput = z.object({
 *     verseId: z.string().uuid(),
 *     grade: z.enum(["again", "hard", "good", "easy"]),
 *   });
 *
 *   export const recordVerseReview = validatedAction(
 *     RecordReviewInput,
 *     async ({ verseId, grade }) => {
 *       const userId = await getUserIdOrThrow();
 *       // ...
 *     },
 *   );
 *
 * Der zurückgegebene Wrapper:
 *   - parsed das Input via Zod (wirft ZodError bei Fehlschlag)
 *   - übergibt das geparste Input an den Handler
 *   - Handler-Errors fließen wie sonst durch
 */
export function validatedAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput) => Promise<TOutput>,
) {
  return async (rawInput: unknown): Promise<TOutput> => {
    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      throw new ValidationError(parsed.error);
    }
    return handler(parsed.data);
  };
}

export class ValidationError extends Error {
  readonly zodError: z.ZodError;
  constructor(zodError: z.ZodError) {
    super(
      "Eingabe-Validierung fehlgeschlagen: " +
        zodError.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
    this.name = "ValidationError";
    this.zodError = zodError;
  }
}

/** Liefert eine kompakte Fehlerbeschreibung für UI-Toasts. */
export function flatValidationMessage(err: unknown): string | null {
  if (err instanceof ValidationError) {
    return err.zodError.issues
      .map((i) => `${i.path.join(".") || "Eingabe"}: ${i.message}`)
      .join(", ");
  }
  return null;
}
