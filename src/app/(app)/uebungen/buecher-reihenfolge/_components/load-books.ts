/**
 * Re-Export auf das zentrale Repository. Bestehende Page-Imports bleiben
 * gültig, alle Queries laufen aber jetzt über src/lib/repositories/books.
 */
import "server-only";
import {
  findAllBooks,
  findBooksByTestament,
} from "@/lib/repositories/books";

export const loadAllBooks = findAllBooks;
export const loadBooksByTestament = findBooksByTestament;
