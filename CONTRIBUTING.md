# Contributing — Konventionen für Bib-Inside

Knappe Hausregeln für konsistenten Code. Solo-Maintainer-Projekt — wir
optimieren auf *„in 6 Monaten lesbar"*, nicht auf *„maximale Flexibilität"*.

## Code-Sprache

| | |
|---|---|
| Datei- und Variablennamen | Englisch |
| Funktionen / Klassen | Englisch, sprechende Namen |
| Inline-Kommentare | Deutsch — sie erklären *warum*, nicht *was* |
| Commit-Messages | Deutsch, Imperativ („Vers-Lernen: SRS-Engine und Lern-UI") |
| User-facing Strings | Deutsch (i18n vorbereitet, aber nur DE im MVP) |
| TSDoc / API-Doku | Deutsch |

## Datei-Konventionen

```
src/
├── app/                            Next.js App Router
│   ├── (app)/                      Authentifizierte Routen (Route-Group)
│   │   ├── layout.tsx              Top-Bar + Session-Check
│   │   ├── error.tsx               Error-Boundary für (app)
│   │   ├── not-found.tsx           404 für (app)
│   │   ├── dashboard/page.tsx      Page → Server-Component
│   │   └── verse/
│   │       ├── page.tsx
│   │       ├── _actions.ts         Server-Actions (mit "use server")
│   │       ├── _components/        lokale Komponenten zur Route
│   │       │   ├── learn-card.tsx  kebab-case
│   │       │   └── helpers.ts      pure utilities
│   │       └── lernen/
│   │           ├── page.tsx
│   │           └── _components/
│   ├── api/                        Klassische Route-Handler
│   ├── error.tsx                   Globaler Error-Boundary
│   ├── not-found.tsx               Globale 404
│   └── page.tsx                    Landing
├── components/                     Geteilte Komponenten
│   └── app-shell/                  Themengruppe
├── db/                             Schema, Client, Seed
└── lib/                            Reine Helpers, kein I/O wenn möglich
    ├── auth.ts                     NextAuth-Config
    ├── auth-cookies.ts             Cookie-Konstanten
    ├── session.ts                  requireUser etc.
    ├── action-helpers.ts           validatedAction etc.
    ├── srs.ts                      Pure SRS-Engine
    └── utils.ts                    cn() etc.
```

### Benennung

- **Dateinamen**: kebab-case. `learn-session.tsx`, `cloze-stage.tsx`.
- **Funktionsnamen**: PascalCase für Komponenten, camelCase sonst.
- **Server-Actions**: Verb am Anfang (`recordVerseReview`, `getDueVerses`).
- **Server-Component-Pages**: Komponentenname endet auf `Page`
  (`VerseLearnPage`, `BookOrderSelectionPage`).
- **Client-Komponenten**: keine spezielle Endung, Hauptkomponente
  exportiert, Sub-Komponenten privat im selben File oder
  in `_components/` ausgelagert.
- **Test-Dateien**: `<modul>.test.ts` neben dem Modul.

### Underscore-Prefix in App-Router

In Next.js' App-Router werden Verzeichnisse, die mit `_` beginnen, **nicht
zu Routen**. Das nutzen wir konsequent für lokale Komponenten und Helpers:

- `_components/` — Komponenten, die nur diese Route nutzt
- `_actions.ts` — Server-Actions
- `_helpers.ts` / `_utils.ts` — pure Helpers

Geteilter Code wandert in `src/lib/` oder `src/components/`.

## Server vs. Client

- **Default**: Server-Component (kein `"use client"` nötig).
- **`"use client"`** nur, wenn:
  - Hooks (useState, useEffect, useRef, …)
  - Event-Handler (onClick, onChange, …)
  - Browser-APIs (localStorage, window, …)
  - DnD, drag, tipping, etc.

Hybrid-Komponenten splitten: Server-Container lädt Daten und reicht sie an
Client-Sub-Komponenten weiter.

## Server-Actions

- Pro Server-Action ein **Zod-Schema** für die Eingabe.
- Über `validatedAction(schema, handler)` aus `src/lib/action-helpers.ts`
  wrappen — der Wrapper validiert das Input und wirft `ValidationError`.
- Auth über `getUserIdOrThrow()` / `getAdminUserIdOrThrow()` aus
  `src/lib/session.ts`. Niemals `getServerSession` direkt im Action-Code.
- Bei Datenänderung: `revalidatePath()` für betroffene Routen.

## Pages und Layouts

- Auth-Pflicht für `(app)/*` ist im Layout zentral.
- Pages benutzen `requireUser()` / `requireAdmin()` aus `src/lib/session.ts`.
- DB-Zugriff in Server-Components ist OK, sollte aber idealerweise über die
  Repository-Schicht gehen (siehe `src/lib/repositories/` — Stand: in
  Arbeit).

## Tests

- **Pure Helper**: Vitest, neben dem Modul (`<modul>.test.ts`).
- **Server-Actions**: später mit Test-DB (siehe `docs/quality-roadmap.md`).
- **E2E**: Playwright (siehe `docs/quality-roadmap.md`).

`pnpm test` läuft alle Vitest-Tests. `pnpm typecheck` ist Pflicht vor
jedem Commit.

## Commits

- **Pro thematischem Block einen Commit**, nicht pro Datei.
- **Imperative Subject-Line** unter ~70 Zeichen, dann eine Leerzeile, dann
  Begründung im Body.
- **Body** erklärt das *Warum* der Änderung — was geändert wurde, sieht man
  im Diff.
- **Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>**
  am Ende, wenn KI mitgearbeitet hat.

## Scope-Disziplin

Für ein Solo-Maintainer-Projekt gilt:

- **YAGNI** — keine Abstraktion „für den Fall" einführen
- **Eine Wahl pro Problem** — z.B. nur Server-Actions, kein paralleler tRPC
- **Lieber zu wenig Architektur als zu viel** — Refactoring ist günstig,
  vorzeitige Verallgemeinerung wird teuer
