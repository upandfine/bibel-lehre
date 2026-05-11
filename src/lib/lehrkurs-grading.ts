/**
 * Pure Bewertungs-Helper für Lehrkurs-Aufgabentypen.
 *
 * Bewusst frei von DB-Abhängigkeiten — die Server-Action und die UI-
 * Komponenten teilen sich diese Logik, was Inkonsistenzen verhindert
 * (alte UI-Status-Anzeige zeigt "richtig", aber DB sagt "falsch", o.ä.).
 *
 * Alle Funktionen sind referenz-transparent, deterministisch und mit
 * Vitest-Unit-Tests abgedeckt.
 */

// --------------------------------------------------------------------
// A2 Cloze (Lückentext)
// --------------------------------------------------------------------

export type ClozeGap = {
  id: string;
  answer: string;
  /** Zusätzlich akzeptierte Schreibweisen (Synonyme, Plural, …). */
  accept?: string[];
};

/**
 * Tolerante String-Normalisierung für Cloze-Vergleiche: lowercase,
 * ohne Diakritika, ohne Punktuation/Whitespace. Beispiele:
 *
 *   "Hebräisch"     → "hebraisch"
 *   "  pentateuch." → "pentateuch"
 *   "1. Mose"       → "1mose"
 */
export function normalizeForCloze(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** Eine einzelne Lücke gegen ihre `answer`/`accept`-Werte prüfen. */
export function isGapCorrect(userValue: string, gap: ClozeGap): boolean {
  const u = normalizeForCloze(userValue);
  if (!u) return false;
  const accepted = [gap.answer, ...(gap.accept ?? [])].map(normalizeForCloze);
  return accepted.includes(u);
}

/** Alle Lücken einer Cloze-Aufgabe müssen ausgefüllt und korrekt sein. */
export function isClozeCorrect(
  fills: Record<string, string>,
  gaps: ClozeGap[],
): boolean {
  if (gaps.length === 0) return true;
  return gaps.every((g) => isGapCorrect(fills[g.id] ?? "", g));
}

// --------------------------------------------------------------------
// A5 Ordering (Reihenfolge)
// --------------------------------------------------------------------

/**
 * Vergleich zweier Listen: User-Reihenfolge muss exakt der erwarteten
 * Reihenfolge entsprechen (Element-für-Element).
 */
export function isOrderingCorrect(
  user: string[],
  correct: string[],
): boolean {
  if (user.length !== correct.length) return false;
  for (let i = 0; i < user.length; i++) {
    if (user[i] !== correct[i]) return false;
  }
  return true;
}

// --------------------------------------------------------------------
// A6 Choice (Multiple Choice, Single oder Multi)
// --------------------------------------------------------------------

export type ChoiceOption = {
  id: string;
  text: string;
  correct: boolean;
};

/**
 * Vergleich: die Menge der vom Lerner ausgewählten Option-IDs muss
 * exakt der Menge der `correct: true`-Option-IDs entsprechen.
 *
 * Bei Single-Choice: genau eine Auswahl, die richtig sein muss.
 * Bei Multi-Choice: alle richtigen müssen ausgewählt sein, keine
 * zusätzlichen falschen.
 */
export function isChoiceCorrect(
  selected: string[],
  options: ChoiceOption[],
): boolean {
  const correctIds = new Set(
    options.filter((o) => o.correct).map((o) => o.id),
  );
  const selectedIds = new Set(selected);
  if (correctIds.size !== selectedIds.size) return false;
  for (const id of correctIds) {
    if (!selectedIds.has(id)) return false;
  }
  return true;
}

// --------------------------------------------------------------------
// A1 True/False
// --------------------------------------------------------------------

export type TrueFalseStatement = {
  id: string;
  text: string;
  answer: boolean;
  /** Wird beim "Auflösen" im UI als Begründung gezeigt — optional. */
  explanation?: string;
};

/** Alle Items müssen mit der gespeicherten Lösung übereinstimmen. */
export function isTrueFalseCorrect(
  answers: Record<string, boolean>,
  statements: TrueFalseStatement[],
): boolean {
  if (statements.length === 0) return true;
  return statements.every((s) => answers[s.id] === s.answer);
}

// --------------------------------------------------------------------
// A3 Match (Paar-Zuordnung)
// --------------------------------------------------------------------

export type MatchPair = { left: string; right: string };

/**
 * Jedes left-Element muss exakt dem zugehörigen right zugeordnet sein.
 * Unterstützt auch das edge case: gleiches right für mehrere lefts
 * (im aktuellen MVP nicht genutzt, aber tolerant).
 */
export function isMatchCorrect(
  matches: Record<string, string>,
  pairs: MatchPair[],
): boolean {
  if (pairs.length === 0) return true;
  return pairs.every((p) => matches[p.left] === p.right);
}
