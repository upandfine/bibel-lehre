import type { Book } from "./types";

export function BookCardInline({
  book,
  showColor = true,
}: {
  book: Book;
  /**
   * Wenn true, wird der Gruppen-Farbbalken links angezeigt. Während aktiver
   * Übungen bewusst auf false setzen — die Farbe würde direkt die Gruppe
   * verraten. In der Auswertung dann wieder true für den Lerneffekt.
   */
  showColor?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      {showColor && (
        <span
          aria-hidden
          className="h-6 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: book.groupColor ?? "#94a3b8" }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{book.nameDe}</p>
        {book.nameOriginal && (
          <p className="truncate text-xs text-muted-foreground">
            <span dir="auto">{book.nameOriginal}</span>
            {book.nameOriginalTransliterated && (
              <span> · {book.nameOriginalTransliterated}</span>
            )}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        {book.abbr}
      </span>
    </div>
  );
}
