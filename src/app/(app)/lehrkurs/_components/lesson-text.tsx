/**
 * Schlanker Markdown-Renderer für Lehrtexte. Wir nutzen bewusst keine
 * vollständige Markdown-Lib (kein react-markdown / unified) — die Lehrtexte
 * sind in der Hand des Admin (= Samuel), nicht User-generated, und brauchen
 * nur ein begrenztes Subset:
 *
 *   - Absätze (Leerzeile)
 *   - Listen (`- ` am Zeilenanfang)
 *   - Block-Zitate (`> ` am Zeilenanfang)
 *   - Inline: **fett**, *kursiv*
 *
 * Externe Markdown-Libs verbessern hier nichts und vergrößern den Bundle.
 */

import { Fragment } from "react";
import { parseBlocks } from "./lesson-text-parse";

/**
 * Inline-Formatierung: **fett** und *kursiv*. Wir parsen einmal links nach
 * rechts und produzieren ein React-Fragment-Array, damit verschachtelte
 * Tags korrekt funktionieren.
 */
function renderInline(text: string): React.ReactNode {
  // Regex matcht **...** zuerst (gierig auf Doppel-Sternchen), dann *...*.
  const tokens: { type: "text" | "bold" | "italic"; value: string }[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ type: "text", value: text.slice(lastIdx, match.index) });
    }
    const m = match[0];
    if (m.startsWith("**")) {
      tokens.push({ type: "bold", value: m.slice(2, -2) });
    } else {
      tokens.push({ type: "italic", value: m.slice(1, -1) });
    }
    lastIdx = match.index + m.length;
  }
  if (lastIdx < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIdx) });
  }

  return tokens.map((t, idx) => {
    const key = `${t.type}-${idx}`;
    if (t.type === "bold") return <strong key={key}>{t.value}</strong>;
    if (t.type === "italic") return <em key={key}>{t.value}</em>;
    return <Fragment key={key}>{t.value}</Fragment>;
  });
}

export function LessonText({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="space-y-4 text-base leading-relaxed text-foreground">
      {blocks.map((b, i) => {
        if (b.kind === "paragraph") {
          return (
            <p key={i} className="whitespace-pre-line">
              {renderInline(b.lines.join("\n"))}
            </p>
          );
        }
        if (b.kind === "list") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-6">
              {b.items.map((item, idx) => (
                <li key={idx}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        // blockquote
        return (
          <blockquote
            key={i}
            className="border-l-4 border-primary/40 bg-muted/40 px-4 py-2 italic text-foreground"
          >
            {b.lines.map((l, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {renderInline(l)}
              </p>
            ))}
          </blockquote>
        );
      })}
    </div>
  );
}
