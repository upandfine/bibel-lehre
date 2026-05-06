import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-class merger. Standard-Helper für shadcn/ui.
 * Erlaubt sauberes konditionales Zusammenfügen von Tailwind-Klassen.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
