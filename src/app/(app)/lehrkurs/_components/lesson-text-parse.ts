/**
 * Pure Parsing-Logik für den schlanken Markdown-Renderer.
 * Reagiert auf:
 *   - Absätze (durch Leerzeile getrennt)
 *   - Listen-Items (Zeile beginnt mit "- ")
 *   - Blockzitate (Zeile beginnt mit "> ")
 *
 * Inline-Formatierung (**fett**, *kursiv*) bleibt in `lesson-text.tsx`,
 * weil sie React-Nodes produziert — `parseBlocks` ist rein string-basiert
 * und damit isoliert testbar.
 */

export type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "blockquote"; lines: string[] };

export function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: "list", items });
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: "blockquote", lines: quoteLines });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("> ")
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", lines: paragraphLines });
  }

  return blocks;
}
