export type Book = {
  id: number;
  abbr: string;
  nameDe: string;
  nameOriginal: string | null;
  nameOriginalTransliterated: string | null;
  testament: "AT" | "NT";
  groupName: string;
  groupColor: string | null;
  orderIndex: number;
};

/** Übungs-Modi mit URL-Slugs in der Route. */
export type Mode = "zuordnen" | "sortieren" | "schreiben";

/**
 * Zuordnen-Modus: pro Container (Pool oder Abschnittsname) eine Liste der
 * book.ids in der vom Lerner gewählten Reihenfolge.
 */
export type AssignmentMap = Record<string, number[]>;
export const POOL_ID = "__pool";

/** Was beim Klick auf "Prüfen" in den sessionStorage geschrieben wird. */
export type StoredResult =
  | { mode: "sortieren"; userOrder: number[] }
  | { mode: "schreiben"; userInputs: string[] }
  | { mode: "zuordnen"; assignments: AssignmentMap };

export function storageKeyFor(testament: "AT" | "NT", mode: Mode): string {
  return `book-order:${testament}:${mode}`;
}

export function isTestament(value: string): value is "AT" | "NT" {
  return value === "AT" || value === "NT";
}

export function isMode(value: string): value is Mode {
  return value === "zuordnen" || value === "sortieren" || value === "schreiben";
}
