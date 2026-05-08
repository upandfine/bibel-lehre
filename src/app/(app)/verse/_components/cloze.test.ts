import { describe, expect, it } from "vitest";
import {
  isWordCorrect,
  normalizeWord,
  pickGapIndices,
  tokenize,
} from "./cloze";

describe("cloze.tokenize", () => {
  it("trennt Wörter und Whitespace", () => {
    const tokens = tokenize("Im Anfang schuf Gott");
    expect(tokens).toEqual([
      { kind: "word", text: "Im" },
      { kind: "sep", text: " " },
      { kind: "word", text: "Anfang" },
      { kind: "sep", text: " " },
      { kind: "word", text: "schuf" },
      { kind: "sep", text: " " },
      { kind: "word", text: "Gott" },
    ]);
  });

  it("behält Punktuation als sep-Token", () => {
    const tokens = tokenize("Gott; und.");
    const words = tokens.filter((t) => t.kind === "word").map((t) => t.text);
    const seps = tokens.filter((t) => t.kind === "sep").map((t) => t.text);
    expect(words).toEqual(["Gott", "und"]);
    expect(seps).toContain("; ");
    expect(seps).toContain(".");
  });

  it("erkennt diakritische Zeichen als Teil des Worts", () => {
    const tokens = tokenize("Müller über Größe");
    const words = tokens.filter((t) => t.kind === "word").map((t) => t.text);
    expect(words).toEqual(["Müller", "über", "Größe"]);
  });

  it("leerer Input → leeres Array", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("cloze.normalizeWord", () => {
  it("ist case-insensitiv", () => {
    expect(normalizeWord("Anfang")).toBe("anfang");
    expect(normalizeWord("ANFANG")).toBe("anfang");
  });

  it("entfernt Apostrophe", () => {
    expect(normalizeWord("ein’s")).toBe("eins");
    expect(normalizeWord("ein's")).toBe("eins");
  });

  it("entfernt Akzente", () => {
    expect(normalizeWord("über")).toBe("uber");
    expect(normalizeWord("Größe")).toBe("große");
  });
});

describe("cloze.isWordCorrect", () => {
  it("akzeptiert tolerante Varianten", () => {
    expect(isWordCorrect("anfang", "Anfang")).toBe(true);
    expect(isWordCorrect("  ANFANG  ", "Anfang")).toBe(true);
  });

  it("lehnt falsche Wörter ab", () => {
    expect(isWordCorrect("Ende", "Anfang")).toBe(false);
  });
});

describe("cloze.pickGapIndices", () => {
  it("ignoriert Wörter mit < 3 Buchstaben", () => {
    // "Im am" — beide nur 2 Zeichen, qualifizieren nicht
    const tokens = tokenize("Im am");
    const gaps = pickGapIndices(tokens);
    expect(gaps.size).toBe(0);
  });

  it("nimmt Wörter ab 3 Buchstaben mit", () => {
    // "Im der" — "der" hat 3 Buchstaben, qualifiziert
    const tokens = tokenize("Im der");
    const gaps = pickGapIndices(tokens);
    expect(gaps.size).toBe(1);
  });

  it("wählt mindestens eine Lücke wenn möglich", () => {
    const tokens = tokenize("Anfang Ende");
    const gaps = pickGapIndices(tokens);
    expect(gaps.size).toBeGreaterThanOrEqual(1);
  });

  it("respektiert die Ratio (mit deterministischem RNG)", () => {
    // 10 lange Wörter, ratio 0.5 → 5 Lücken
    const text = "Anfang Mitte Ende Beginn Schluss Schöpfung Welten Himmel Erden Wasser";
    const tokens = tokenize(text);
    let i = 0;
    const rand = () => {
      // deterministischer "Zufall": gibt monoton wachsende Werte 0.0, 0.1, …
      const v = (i % 10) / 10;
      i++;
      return v;
    };
    const gaps = pickGapIndices(tokens, 0.5, rand);
    expect(gaps.size).toBe(5);
  });

  it("wählt nur Word-Token-Indizes (keine sep)", () => {
    const tokens = tokenize("Anfang Ende Mittel");
    const gaps = pickGapIndices(tokens);
    for (const idx of gaps) {
      expect(tokens[idx].kind).toBe("word");
    }
  });
});
