import { describe, expect, it } from "vitest";
import {
  isChoiceCorrect,
  isClozeCorrect,
  isGapCorrect,
  isMatchCorrect,
  isOrderingCorrect,
  isTrueFalseCorrect,
  normalizeForCloze,
} from "./lehrkurs-grading";

describe("normalizeForCloze", () => {
  it("lowercased Diakritika entfernt", () => {
    expect(normalizeForCloze("Hebräisch")).toBe("hebraisch");
    expect(normalizeForCloze("Griechisch")).toBe("griechisch");
  });
  it("Punktuation und Whitespace entfernt", () => {
    expect(normalizeForCloze("  Pentateuch.")).toBe("pentateuch");
    expect(normalizeForCloze("1. Mose")).toBe("1mose");
  });
  it("leere Eingabe → leer", () => {
    expect(normalizeForCloze("")).toBe("");
    expect(normalizeForCloze("   ")).toBe("");
    expect(normalizeForCloze(".,;:")).toBe("");
  });
});

describe("isGapCorrect", () => {
  const gap = { id: "g1", answer: "Hebräisch", accept: ["hebraeisch", "hebr"] };

  it("richtige Eingabe wird akzeptiert", () => {
    expect(isGapCorrect("Hebräisch", gap)).toBe(true);
    expect(isGapCorrect("hebräisch", gap)).toBe(true);
    expect(isGapCorrect("HEBRÄISCH", gap)).toBe(true);
  });
  it("Schreibweise mit Whitespace/Punkt funktioniert", () => {
    expect(isGapCorrect("  Hebräisch.", gap)).toBe(true);
  });
  it("`accept`-Alternativen werden akzeptiert", () => {
    expect(isGapCorrect("hebraeisch", gap)).toBe(true);
    expect(isGapCorrect("hebr", gap)).toBe(true);
  });
  it("falsche Eingabe wird abgelehnt", () => {
    expect(isGapCorrect("Griechisch", gap)).toBe(false);
    expect(isGapCorrect("", gap)).toBe(false);
  });
});

describe("isClozeCorrect", () => {
  const gaps = [
    { id: "a", answer: "Hebräisch" },
    { id: "b", answer: "Griechisch" },
  ];

  it("alle korrekt → true", () => {
    expect(
      isClozeCorrect({ a: "Hebräisch", b: "Griechisch" }, gaps),
    ).toBe(true);
  });
  it("eine falsch → false", () => {
    expect(isClozeCorrect({ a: "Hebräisch", b: "Latein" }, gaps)).toBe(false);
  });
  it("eine leer → false", () => {
    expect(isClozeCorrect({ a: "Hebräisch" }, gaps)).toBe(false);
  });
  it("keine Lücken → true (Edge-Case)", () => {
    expect(isClozeCorrect({}, [])).toBe(true);
  });
});

describe("isOrderingCorrect", () => {
  it("exakte Reihenfolge → true", () => {
    expect(isOrderingCorrect(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
  });
  it("falsche Reihenfolge → false", () => {
    expect(isOrderingCorrect(["a", "c", "b"], ["a", "b", "c"])).toBe(false);
  });
  it("zu wenig Elemente → false", () => {
    expect(isOrderingCorrect(["a", "b"], ["a", "b", "c"])).toBe(false);
  });
  it("zu viele Elemente → false", () => {
    expect(isOrderingCorrect(["a", "b", "c", "d"], ["a", "b", "c"])).toBe(
      false,
    );
  });
  it("zwei leere Listen → true", () => {
    expect(isOrderingCorrect([], [])).toBe(true);
  });
});

describe("isChoiceCorrect", () => {
  const single = [
    { id: "a", text: "A", correct: false },
    { id: "b", text: "B", correct: true },
    { id: "c", text: "C", correct: false },
  ];
  const multi = [
    { id: "a", text: "A", correct: true },
    { id: "b", text: "B", correct: false },
    { id: "c", text: "C", correct: true },
  ];

  it("Single: einzige richtige Auswahl → true", () => {
    expect(isChoiceCorrect(["b"], single)).toBe(true);
  });
  it("Single: falsche Auswahl → false", () => {
    expect(isChoiceCorrect(["a"], single)).toBe(false);
  });
  it("Single: keine Auswahl → false", () => {
    expect(isChoiceCorrect([], single)).toBe(false);
  });
  it("Multi: genau alle richtigen → true", () => {
    expect(isChoiceCorrect(["a", "c"], multi)).toBe(true);
  });
  it("Multi: nur eine richtige → false (zu wenig)", () => {
    expect(isChoiceCorrect(["a"], multi)).toBe(false);
  });
  it("Multi: alle plus eine falsche → false", () => {
    expect(isChoiceCorrect(["a", "b", "c"], multi)).toBe(false);
  });
});

describe("isTrueFalseCorrect", () => {
  const statements = [
    { id: "s1", text: "Test 1", answer: true },
    { id: "s2", text: "Test 2", answer: false },
  ];

  it("alle korrekt → true", () => {
    expect(isTrueFalseCorrect({ s1: true, s2: false }, statements)).toBe(true);
  });
  it("eine falsch → false", () => {
    expect(isTrueFalseCorrect({ s1: true, s2: true }, statements)).toBe(false);
  });
  it("eine fehlt → false", () => {
    expect(isTrueFalseCorrect({ s1: true }, statements)).toBe(false);
  });
});

describe("isMatchCorrect", () => {
  const pairs = [
    { left: "1. Mose", right: "Pentateuch" },
    { left: "Matthäus", right: "Evangelien" },
  ];

  it("alle richtig → true", () => {
    expect(
      isMatchCorrect(
        { "1. Mose": "Pentateuch", Matthäus: "Evangelien" },
        pairs,
      ),
    ).toBe(true);
  });
  it("eine falsche Zuordnung → false", () => {
    expect(
      isMatchCorrect(
        { "1. Mose": "Evangelien", Matthäus: "Evangelien" },
        pairs,
      ),
    ).toBe(false);
  });
  it("eine fehlende Zuordnung → false", () => {
    expect(isMatchCorrect({ "1. Mose": "Pentateuch" }, pairs)).toBe(false);
  });
});
