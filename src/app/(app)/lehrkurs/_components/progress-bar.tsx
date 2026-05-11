/**
 * Schlanke Fortschritts-Anzeige für Module + Lektionen. Server-Component-
 * kompatibel (kein State, kein "use client").
 */
export function ProgressBar({
  answered,
  total,
  percent,
}: {
  answered: number;
  total: number;
  percent: number;
}) {
  if (total === 0) return null;
  const complete = answered === total;
  return (
    <div className="inline-flex flex-1 items-center gap-2">
      <div className="relative h-1.5 max-w-32 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={
            "h-full rounded-full transition-all " +
            (complete ? "bg-emerald-500" : "bg-primary")
          }
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={
          "shrink-0 text-xs tabular-nums " +
          (complete
            ? "font-medium text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground")
        }
      >
        {answered}/{total}
      </span>
    </div>
  );
}
