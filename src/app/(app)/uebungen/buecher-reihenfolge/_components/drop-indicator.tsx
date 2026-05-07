import { cn } from "@/lib/utils";

/**
 * Eindeutiger visueller Hinweis, an welcher Stelle das gezogene Item beim
 * Loslassen landet. Höhe 0 im Layout, die farbige Linie wird absolut
 * darüber positioniert — so springt das Layout nicht.
 */
export function DropIndicator({ active }: { active: boolean }) {
  return (
    <li
      className="pointer-events-none relative h-0 list-none"
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute -top-1 left-0 right-0 h-1 rounded-full transition-opacity duration-150",
          active ? "bg-primary opacity-100" : "opacity-0",
        )}
      />
    </li>
  );
}
