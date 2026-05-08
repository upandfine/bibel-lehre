import { describe, expect, it } from "vitest";
import {
  aliasesFor,
  expectedBookIdsForGroup,
  groupsInOrder,
  isGroupComplete,
  isInputCorrect,
  lisIndices,
  normalize,
} from "./utils";
import type { Book } from "./types";

const BOOK: Book = {
  id: 1,
  abbr: "1Mo",
  nameDe: "1. Mose",
  nameOriginal: "בְּרֵאשִׁית",
  nameOriginalTransliterated: "Bereschit",
  testament: "AT",
  groupName: "Pentateuch",
  groupColor: "#d97706",
  orderIndex: 1,
};

describe("utils.normalize", () => {
  it("entfernt Whitespace, Punktuation, Akzente und macht lowercase", () => {
    expect(normalize("  1. Mose ")).toBe("1mose");
    expect(normalize("Jeschajáhú")).toBe("jeschajahu");
    expect(normalize("')-,.;:'")).toBe("");
  });
});

describe("utils.aliasesFor", () => {
  it("akzeptiert nur deutschen Namen und Abkürzung", () => {
    const aliases = aliasesFor(BOOK);
    expect(aliases).toContain("1mose");
    expect(aliases).toContain("1mo");
    // Originalname und Transliteration sind bewusst NICHT enthalten
    expect(aliases).not.toContain("bereschit");
  });
});

describe("utils.isInputCorrect", () => {
  it("akzeptiert verschiedene Schreibweisen des deutschen Namens", () => {
    expect(isInputCorrect("1. Mose", BOOK)).toBe(true);
    expect(isInputCorrect("1mose", BOOK)).toBe(true);
    expect(isInputCorrect("1Mo", BOOK)).toBe(true);
    expect(isInputCorrect(" 1. mose  ", BOOK)).toBe(true);
  });

  it("lehnt Originalnamen und Transliterationen ab", () => {
    expect(isInputCorrect("Bereschit", BOOK)).toBe(false);
    expect(isInputCorrect("Genesis", BOOK)).toBe(false);
  });

  it("leere Eingabe ist immer falsch", () => {
    expect(isInputCorrect("", BOOK)).toBe(false);
    expect(isInputCorrect("   ", BOOK)).toBe(false);
  });
});

describe("utils.lisIndices", () => {
  it("voll sortiert: alle Indizes sind in der LIS", () => {
    const out = lisIndices([1, 2, 3, 4, 5]);
    expect(out.size).toBe(5);
    [0, 1, 2, 3, 4].forEach((i) => expect(out.has(i)).toBe(true));
  });

  it("ein einzelnes verschobenes Element fällt raus", () => {
    // [1, 2, 3, 4, 5] aber 5 ist an Position 0 → LIS = {1,2,3,4} = 4 Elemente
    const out = lisIndices([5, 1, 2, 3, 4]);
    expect(out.size).toBe(4);
    expect(out.has(0)).toBe(false); // die 5 fällt raus
  });

  it("komplett umgekehrt: nur 1 Element in LIS", () => {
    const out = lisIndices([5, 4, 3, 2, 1]);
    expect(out.size).toBe(1);
  });

  it("leeres Array → leeres Set", () => {
    expect(lisIndices([]).size).toBe(0);
  });

  it("Folgefehler-Szenario: ein vergessenes Buch → genau 1 Fehler", () => {
    // Vergessenes Buch (5) am Ende statt in der Mitte
    const out = lisIndices([1, 2, 3, 4, 6, 7, 8, 9, 5]);
    // LIS = [1,2,3,4,6,7,8,9] = 8 Elemente
    expect(out.size).toBe(8);
    expect(out.has(8)).toBe(false); // die 5 am Ende ist außerhalb
  });
});

describe("utils.groupsInOrder", () => {
  it("liefert Gruppen in der Reihenfolge ihres ersten Auftretens", () => {
    const books: Book[] = [
      { ...BOOK, id: 1, groupName: "Pentateuch" },
      { ...BOOK, id: 2, groupName: "Pentateuch" },
      { ...BOOK, id: 6, groupName: "Geschichtsbücher" },
      { ...BOOK, id: 18, groupName: "Lehrbücher" },
    ];
    expect(groupsInOrder(books)).toEqual([
      "Pentateuch",
      "Geschichtsbücher",
      "Lehrbücher",
    ]);
  });
});

describe("utils.expectedBookIdsForGroup", () => {
  const BOOKS: Book[] = [
    { ...BOOK, id: 3, groupName: "Pentateuch", orderIndex: 3 },
    { ...BOOK, id: 1, groupName: "Pentateuch", orderIndex: 1 },
    { ...BOOK, id: 2, groupName: "Pentateuch", orderIndex: 2 },
    { ...BOOK, id: 10, groupName: "Geschichtsbücher", orderIndex: 6 },
  ];

  it("liefert nur IDs der Gruppe, in kanonischer Reihenfolge", () => {
    expect(expectedBookIdsForGroup("Pentateuch", BOOKS)).toEqual([1, 2, 3]);
  });

  it("liefert leeres Array für unbekannte Gruppe", () => {
    expect(expectedBookIdsForGroup("Apokryphen", BOOKS)).toEqual([]);
  });
});

describe("utils.isGroupComplete", () => {
  const BOOKS: Book[] = [
    { ...BOOK, id: 1, groupName: "Pentateuch", orderIndex: 1 },
    { ...BOOK, id: 2, groupName: "Pentateuch", orderIndex: 2 },
    { ...BOOK, id: 3, groupName: "Pentateuch", orderIndex: 3 },
    { ...BOOK, id: 6, groupName: "Geschichtsbücher", orderIndex: 6 },
  ];

  it("genau die richtigen IDs in genau der richtigen Reihenfolge → true", () => {
    expect(isGroupComplete([1, 2, 3], "Pentateuch", BOOKS)).toBe(true);
  });

  it("richtige Bücher, falsche Reihenfolge → false", () => {
    expect(isGroupComplete([1, 3, 2], "Pentateuch", BOOKS)).toBe(false);
  });

  it("zu wenige → false", () => {
    expect(isGroupComplete([1, 2], "Pentateuch", BOOKS)).toBe(false);
  });

  it("Fremdes Buch dabei → false", () => {
    expect(isGroupComplete([1, 2, 6], "Pentateuch", BOOKS)).toBe(false);
  });

  it("leerer Kasten ist nicht komplett (außer die Gruppe ist leer)", () => {
    expect(isGroupComplete([], "Pentateuch", BOOKS)).toBe(false);
    expect(isGroupComplete([], "Apokryphen", BOOKS)).toBe(true);
  });
});
