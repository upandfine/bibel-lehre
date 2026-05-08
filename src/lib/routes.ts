/**
 * Zentrale URL-Builder für alle internen Routen.
 *
 * Vorteil:
 *   - Refactor-Sicherheit: ändern wir den URL-Schemata, müssen wir nur hier
 *     anfassen, nicht in zwanzig Components.
 *   - IDE-Autocomplete: tippen statt copy-paste.
 *   - Type-Safety auf den Parametern.
 */

export type Testament = "AT" | "NT";
export type BookOrderMode = "sortieren" | "zuordnen" | "schreiben";

export const routes = {
  // Public
  home: () => "/",
  signIn: () => "/sign-in",
  signInCheckEmail: () => "/sign-in/check-email",

  // App-Hülle
  dashboard: () => "/dashboard",
  admin: () => "/admin",

  // Lehrkurs
  lehrkurs: {
    overview: () => "/lehrkurs",
    module: (moduleOrder: number) => `/lehrkurs/${moduleOrder}`,
    lesson: (moduleOrder: number, lessonOrder: number) =>
      `/lehrkurs/${moduleOrder}/${lessonOrder}`,
  },

  // Verse
  verse: {
    overview: () => "/verse",
    learn: () => "/verse/lernen",
    cloze: () => "/verse/lueckentext",
  },

  // Übungen
  uebungen: {
    overview: () => "/uebungen",
    bookOrder: {
      selection: () => "/uebungen/buecher-reihenfolge",
      modes: (t: Testament) => `/uebungen/buecher-reihenfolge/${t}`,
      play: (t: Testament, m: BookOrderMode) =>
        `/uebungen/buecher-reihenfolge/${t}/${m}`,
      result: (t: Testament, m: BookOrderMode) =>
        `/uebungen/buecher-reihenfolge/${t}/${m}/auswertung`,
    },
  },

  // API
  api: {
    health: () => "/api/health",
    devLogin: () => "/api/dev-login",
  },
} as const;
