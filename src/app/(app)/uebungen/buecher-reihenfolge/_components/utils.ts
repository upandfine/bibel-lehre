import type { Book } from "./types";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Falls zufällig identisch zur Eingabe: nochmal mischen.
  if (a.length > 1 && a.every((x, i) => x === arr[i])) return shuffle(arr);
  return a;
}

/**
 * Längste aufsteigende Teilsequenz: Indizes der Elemente, die zusammen die
 * längste streng aufsteigende Sub-Sequenz bilden. Wird in der Sortier-
 * Auswertung benutzt — Bücher mit Index in dieser Menge stehen relativ
 * zueinander in richtiger kanonischer Reihenfolge.
 *
 * O(n²), bei max. 39 Büchern absolut unkritisch.
 */
export function lisIndices(arr: number[]): Set<number> {
  const n = arr.length;
  if (n === 0) return new Set();

  const len = new Array(n).fill(1);
  const prev = new Array(n).fill(-1);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i] && len[j] + 1 > len[i]) {
        len[i] = len[j] + 1;
        prev[i] = j;
      }
    }
  }

  let maxLen = 0;
  let maxIdx = 0;
  for (let i = 0; i < n; i++) {
    if (len[i] > maxLen) {
      maxLen = len[i];
      maxIdx = i;
    }
  }

  const result = new Set<number>();
  let k = maxIdx;
  while (k !== -1) {
    result.add(k);
    k = prev[k];
  }
  return result;
}

/**
 * Vergleichsfreundliche Form: lowercase, ohne Diakritika, ohne alles
 * außer Buchstaben und Ziffern. Damit reagiert die Eingabe-Toleranz
 * auf beliebige Punktuation, Klammern, Whitespace etc.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function aliasesFor(book: Book): string[] {
  // Bewusst nur deutscher Name + Abkürzung — Originalname/Transliteration werden
  // angezeigt, sollen aber nicht als Eingabe akzeptiert werden (sonst kein
  // echter Recall des deutschen Namens).
  return [book.nameDe, book.abbr].map(normalize).filter((x) => x.length > 0);
}

export function isInputCorrect(input: string, book: Book): boolean {
  const n = normalize(input);
  if (!n) return false;
  return aliasesFor(book).includes(n);
}

export function encouragement(percent: number): string {
  if (percent === 100) return "Vollständig richtig — herausragend.";
  if (percent >= 90)
    return "Sehr nah dran. Schau dir die Stellen an, an denen du noch ins Stolpern kommst.";
  if (percent >= 70)
    return "Gute Grundlage. Vertiefe die Stellen, die du verwechselt hast.";
  if (percent >= 50)
    return "Du bist auf dem Weg. Wiederholung hilft — versuch es gleich nochmal.";
  return "Kein Stress — Reihenfolgen sitzen erst nach mehrfachem Üben. Schau die richtigen Plätze in Ruhe an.";
}

export function groupsInOrder(books: Book[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of books) {
    if (seen.has(b.groupName)) continue;
    seen.add(b.groupName);
    out.push(b.groupName);
  }
  return out;
}

export function emptyAssignments(books: Book[]): Record<string, number[]> {
  const map: Record<string, number[]> = {
    __pool: shuffle(books.map((b) => b.id)),
  };
  for (const g of groupsInOrder(books)) map[g] = [];
  return map;
}

/**
 * Erwartete Buch-IDs einer Gruppe in kanonischer Reihenfolge.
 * Wird für den Pre-Check der Zuordnen-Übung benötigt — wenn der Lerner
 * einen Kasten als „fertig" markieren möchte, vergleichen wir damit.
 */
export function expectedBookIdsForGroup(
  groupId: string,
  books: Book[],
): number[] {
  return books
    .filter((b) => b.groupName === groupId)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((b) => b.id);
}

/**
 * Prüft, ob die items der Gruppe exakt der kanonischen Reihenfolge der
 * zugehörigen Bücher entsprechen — d.h. richtige Auswahl UND richtige
 * Sortierung.
 *
 * Bewusst keine differenzierte Diagnose („Reihenfolge falsch", „Buch X
 * fehlt"): das wäre verkappte Lösungs-Anzeige, der Lerner soll das
 * Selbst-Erkennen beibehalten. Ein einfaches OK / nicht-OK reicht für
 * den UX-Zweck (Kasten zuklappen).
 */
export function isGroupComplete(
  items: number[],
  groupId: string,
  books: Book[],
): boolean {
  const expected = expectedBookIdsForGroup(groupId, books);
  if (items.length !== expected.length) return false;
  for (let i = 0; i < items.length; i++) {
    if (items[i] !== expected[i]) return false;
  }
  return true;
}
