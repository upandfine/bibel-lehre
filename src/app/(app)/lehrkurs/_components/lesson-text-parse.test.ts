import { describe, expect, it } from "vitest";
import { parseBlocks } from "./lesson-text-parse";

describe("parseBlocks", () => {
  it("einfacher Absatz", () => {
    expect(parseBlocks("Hallo Welt")).toEqual([
      { kind: "paragraph", lines: ["Hallo Welt"] },
    ]);
  });

  it("mehrzeiliger Absatz wird als ein Block gesammelt", () => {
    const out = parseBlocks("Zeile 1\nZeile 2\nZeile 3");
    expect(out).toEqual([
      { kind: "paragraph", lines: ["Zeile 1", "Zeile 2", "Zeile 3"] },
    ]);
  });

  it("Leerzeile trennt zwei Absätze", () => {
    const out = parseBlocks("Erster Absatz.\n\nZweiter Absatz.");
    expect(out).toEqual([
      { kind: "paragraph", lines: ["Erster Absatz."] },
      { kind: "paragraph", lines: ["Zweiter Absatz."] },
    ]);
  });

  it("Listen-Items werden zusammengefasst", () => {
    const out = parseBlocks("- Eins\n- Zwei\n- Drei");
    expect(out).toEqual([{ kind: "list", items: ["Eins", "Zwei", "Drei"] }]);
  });

  it("Block-Zitat wird erkannt", () => {
    const out = parseBlocks("> Ein Zitat\n> über zwei Zeilen");
    expect(out).toEqual([
      { kind: "blockquote", lines: ["Ein Zitat", "über zwei Zeilen"] },
    ]);
  });

  it("Absatz vor Liste — getrennte Blocks", () => {
    const out = parseBlocks("Einleitung:\n- Eins\n- Zwei");
    expect(out).toEqual([
      { kind: "paragraph", lines: ["Einleitung:"] },
      { kind: "list", items: ["Eins", "Zwei"] },
    ]);
  });

  it("Mix aus Absatz, Liste, Zitat in einem Text", () => {
    const md = `Vorgespräch.

- Item A
- Item B

> Zitat-Text

Schluss-Paragraph.`;
    const out = parseBlocks(md);
    expect(out).toEqual([
      { kind: "paragraph", lines: ["Vorgespräch."] },
      { kind: "list", items: ["Item A", "Item B"] },
      { kind: "blockquote", lines: ["Zitat-Text"] },
      { kind: "paragraph", lines: ["Schluss-Paragraph."] },
    ]);
  });

  it("Windows-Zeilenenden (\\r\\n) werden normalisiert", () => {
    const out = parseBlocks("Zeile 1\r\nZeile 2");
    expect(out).toEqual([
      { kind: "paragraph", lines: ["Zeile 1", "Zeile 2"] },
    ]);
  });

  it("Leerer String → leere Block-Liste", () => {
    expect(parseBlocks("")).toEqual([]);
  });

  it("nur Whitespace → leere Block-Liste", () => {
    expect(parseBlocks("   \n\n  ")).toEqual([]);
  });
});
