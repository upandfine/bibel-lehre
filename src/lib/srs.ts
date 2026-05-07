/**
 * Spaced-Repetition-Scheduling für Lernkarten (Bibelverse, später Karteikarten).
 *
 * Variante eines vereinfachten SM-2 mit 4 Antwort-Stufen (Anki-Stil) statt der
 * klassischen Quality-Skala 0–5. Pädagogisch ist das für Erwachsene-Selbstlerner
 * deutlich klarer:
 *
 *   - "Nochmal"  → Erinnerung weg, sofort wieder dran
 *   - "Schwer"   → erinnert mit Mühe, Intervall nur leicht hoch
 *   - "Gut"      → Standard-Lernen, normales Wachstum
 *   - "Leicht"   → mühelos, größerer Sprung
 *
 * Die Persistenz-Felder im Schema (siehe userProgress in src/db/schema.ts):
 *   - easeFactor: integer ×100 — z.B. 250 ≙ 2.5 (übliche SM-2-Konvention)
 *   - intervalDays: integer — Tage bis zur nächsten Fälligkeit
 *   - repetitions: integer — Anzahl erfolgreicher Durchgänge in Folge
 *
 * Die Schedule-Funktion ist pure (keine I/O) und damit gut testbar.
 */

export type SrsGrade = "again" | "hard" | "good" | "easy";

export type SrsState = {
  /** Ease-Faktor ×100. 130 = 1.30 ist das absolute Minimum. */
  easeFactor: number;
  /** Tage bis zur nächsten Fälligkeit. */
  intervalDays: number;
  /** Anzahl Durchgänge in Folge ohne "again". */
  repetitions: number;
};

export type SrsResult = SrsState & {
  /** Wann die Karte das nächste Mal fällig ist. */
  dueAt: Date;
  /** Welche Stufe der Lerner gerade vergeben hat. */
  lastGrade: SrsGrade;
  /** Zeitpunkt dieser Bewertung. */
  lastReviewedAt: Date;
};

const MIN_EASE = 130; // 1.30 — Anki-Konvention
const DEFAULT_EASE = 250; // 2.50 — SM-2-Initial

export function initialState(): SrsState {
  return {
    easeFactor: DEFAULT_EASE,
    intervalDays: 0,
    repetitions: 0,
  };
}

/**
 * Berechnet den nächsten Stand nach einer Bewertung.
 *
 * Heuristik (vereinfachtes SM-2):
 *   "again":  reps = 0, interval = 0 (heute nochmal), ease −0.20
 *   "hard":   reps += 1, interval = max(1, prev × 1.2),    ease −0.15
 *   "good":   reps += 1, klassische SM-2-Progression,      ease unverändert
 *   "easy":   reps += 1, SM-2 × 1.3 (großer Sprung),       ease +0.15
 */
export function schedule(
  prev: SrsState,
  grade: SrsGrade,
  now: Date = new Date(),
): SrsResult {
  let { easeFactor, intervalDays, repetitions } = prev;

  if (grade === "again") {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(MIN_EASE, easeFactor - 20);
  } else {
    if (grade === "hard") {
      easeFactor = Math.max(MIN_EASE, easeFactor - 15);
      intervalDays = Math.max(1, Math.round((intervalDays || 1) * 1.2));
    } else if (grade === "good") {
      if (repetitions === 0) intervalDays = 1;
      else if (repetitions === 1) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * (easeFactor / 100));
    } else {
      // easy
      easeFactor += 15;
      if (repetitions === 0) intervalDays = 4;
      else if (repetitions === 1) intervalDays = 7;
      else intervalDays = Math.round(intervalDays * (easeFactor / 100) * 1.3);
    }
    repetitions += 1;
  }

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    dueAt,
    lastGrade: grade,
    lastReviewedAt: now,
  };
}

/** Hilfslabel für die UI. */
export const gradeLabels: Record<SrsGrade, string> = {
  again: "Nochmal",
  hard: "Schwer",
  good: "Gut",
  easy: "Leicht",
};

/** Vorschau auf das nächste Intervall pro Stufe — für Button-Untertitel in der UI. */
export function previewIntervals(prev: SrsState, now: Date = new Date()) {
  const all: SrsGrade[] = ["again", "hard", "good", "easy"];
  return Object.fromEntries(
    all.map((g) => [g, schedule(prev, g, now).intervalDays] as const),
  ) as Record<SrsGrade, number>;
}
