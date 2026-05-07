/**
 * Helpers für den Lückentext-Modus (Cloze-Deletion).
 *
 * Idee: Vers-Text in Tokens zerlegen — Wörter und Trenner (Whitespace +
 * Punktuation) — und einen Teil der Wort-Tokens zufällig zu Lücken machen.
 * Trenner bleiben sichtbar, sodass der Satzbau erkennbar ist.
 */

export type Token =
  | { kind: "word"; text: string }
  | { kind: "sep"; text: string };

const WORD_RE = /\p{L}[\p{L}\p{M}'’]*/gu;

/**
 * Zerlegt einen Text in eine Sequenz von Word-Tokens und Sep-Tokens.
 * Zwischen zwei Word-Tokens steht immer ein Sep-Token (auch wenn es leer ist).
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      tokens.push({ kind: "sep", text: text.slice(lastIndex, start) });
    }
    tokens.push({ kind: "word", text: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ kind: "sep", text: text.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Wählt zufällig Indizes (relativ zum Tokens-Array) aus, die zu Lücken werden.
 * Berücksichtigt nur Word-Tokens und davon nur Wörter mit ≥ 3 Buchstaben —
 * sehr kurze Wörter (im, der, du …) sind als Lücken zu generisch.
 *
 * Mindestens eine Lücke, höchstens halbe Wortzahl. Default ~33%.
 */
export function pickGapIndices(
  tokens: Token[],
  ratio = 0.33,
  rand: () => number = Math.random,
): Set<number> {
  const candidateIndices: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === "word" && t.text.replace(/[’']/g, "").length >= 3) {
      candidateIndices.push(i);
    }
  }
  if (candidateIndices.length === 0) return new Set();

  const target = Math.max(
    1,
    Math.min(
      Math.floor(candidateIndices.length / 2),
      Math.round(candidateIndices.length * ratio),
    ),
  );

  // Fisher-Yates auf Kopie
  const shuffled = [...candidateIndices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return new Set(shuffled.slice(0, target));
}

/** Vergleichsform: lowercase, ohne diakritische Zeichen, ohne Satzzeichen. */
export function normalizeWord(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, "");
}

export function isWordCorrect(input: string, expected: string): boolean {
  return normalizeWord(input.trim()) === normalizeWord(expected);
}
