# Bib-Inside — Projekt-Kontext für Claude Code

> Lern-Web-App (PWA) für strukturierte biblische Lehrkurse, Vers-Lernen, Bücher-Reihenfolge.
> Domain: `bib-inside.de` · Solo-Maintainer: Samuel Sommer · Hosting: Sliplane (Frankfurt am Main)

## Was die App ist

Eine Selbststudium-Anwendung für Gemeindemitglieder, die einen mehrwöchigen biblischen Lehrkurs durcharbeiten. Vorbild ist das real existierende Skript *„Biblischer Unterricht für die Gemeinde, 5. Fassung 2013"* mit 10 Modulen Systematischer Theologie (Bibliologie bis Eschatologie).

Die App unterstützt:

- **Strukturierte Lehrkurse** — Course → Modul → Lektion → Sektion → Aufgabe (24 Aufgabentypen, A1–F2)
- **Bibelvers-Lernen** mit Spaced Repetition (SM-2)
- **Bücher-Reihenfolge auswendig** (Drag&Drop, Gruppen-Farbcode)
- **Karteikarten und Quizze** (Phase 2)
- **PDF-Druck** der ausgefüllten Lektion (zum Mitnehmen ins physische Treffen)

## Verbindliche Festlegungen (NICHT verändern, ohne Rücksprache)

- **Solo-Maintainer.** Tech-Stack so schlank wie möglich. Keine Enterprise-Patterns, dafür sauber und fehlerfrei.
- **Kein Mentor-Workflow im MVP.** Treffen finden physisch statt. Antworten sind privat beim Nutzer.
- **Eine theologische Position** (wie im Vorbild-Skript). Keine Multi-Position-Tags.
- **Keine Volltext-Bibel** in der App. Nur einzeln eingetippte Lerntexte mit Übersetzungs-Metadaten — vermeidet Lizenzfragen sauber.
- **Übersetzungen**: Schlachter 2000 + Elberfelder revidiert (Lizenz-Anfragen laufen, siehe `lizenz-anfragen/`). Public-Domain-Fallbacks: Elberfelder 1905, Luther 1912.
- **Hosting auf Sliplane in DE**, max. 3 Docker-Container, kein Supabase, kein Vercel-Postgres.
- **Designprinzip**: *„Liebevolle Einschätzung & Ermutigung"*. Kein Lootbox-/Punkte-/Wettbewerbsdesign, keine Schamfaktor-Reminder, Sabbat-Modus für Streaks.
- **Geistliche Würde des Inhalts** respektieren. Tonalität warm, nüchtern, einladend.

## Tech-Stack

| Schicht | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | 14.2 LTS |
| UI | Tailwind CSS + shadcn/ui | aktuell |
| Datenbank | PostgreSQL + Drizzle ORM | 16 / 0.36 |
| Auth | NextAuth.js v4 (Magic-Link via Resend) | 4.24 |
| Mail | Resend EU-Region | 4 |
| Hosting | Sliplane (Frankfurt) | — |
| Container | Docker Multi-Stage | — |
| Tests | Vitest + Playwright | aktuell |

**Wichtig**: NextAuth.js **v4 stable** — NICHT Auth.js v5 beta. Wurde explizit refactored wegen Stabilitätsanforderung.

## Häufige Befehle

```bash
pnpm dev               # Dev-Server (Hot-Reload, http://localhost:3050)
pnpm build             # Production-Build
pnpm typecheck         # TypeScript-Check ohne Build
pnpm lint              # ESLint
pnpm format            # Prettier auf alle Dateien

pnpm db:generate       # Drizzle-Migrations aus Schema erzeugen
pnpm db:migrate        # Migrations einspielen
pnpm db:studio         # Drizzle Studio (DB-Web-UI)
pnpm db:seed           # 66 Bücher, 4 Übersetzungen, Sample-Verse, Admin

pnpm test              # Vitest-Tests
pnpm test:e2e          # Playwright

docker compose up -d   # lokale Postgres
```

## Projekt-Struktur

```
.
├── KONZEPT.md                Hauptkonzept (14 Kapitel)
├── INHALTSANALYSE.md         Auswertung des Original-Skripts
├── docs/dns-setup.md         DNS-Setup für bib-inside.de
├── lizenz-anfragen/          Mail-Vorlagen für CLV / SCM-CSV
├── src/
│   ├── app/                  Next.js App Router
│   │   ├── sign-in/          Magic-Link-Anmeldung
│   │   ├── dashboard/        Geschützte Hauptseite
│   │   └── api/auth/         NextAuth-Handler
│   ├── db/                   Drizzle Schema + Client + Seed
│   │   └── seed-data/        Stammdaten
│   ├── lib/                  Auth-Config, Hilfsfunktionen, E-Mail-Templates
│   ├── types/                Type-Augmentations (next-auth)
│   └── middleware.ts         Edge-Middleware Routenschutz
├── drizzle/                  Generierte SQL-Migrations (Git-tracked!)
├── public/                   Static Assets, später PWA-Icons
├── docker-compose.yml        Lokale Postgres
├── Dockerfile                Production-Image für Sliplane
└── (configs)                 next/tsconfig/tailwind/drizzle/postcss
```

## Aufgabentypen (siehe INHALTSANALYSE.md für Details)

- **A1–A6** auto-bewertbar: R/F, Lückentext, Match, Tabelle, Reihenfolge, Multiple Choice
- **B1–B4** selbstbewertet: kurze offene Antwort, Liste, Definition, Bibelstelle-Aussage
- **C1–C5** beim Treffen besprochen: Argumentation, Essay, Vergleich, Anwendung, Zusammenfassung
- **D1–D3** privat: persönliche Reflexion (nie eingereicht)
- **E1–E5** Verhalten: Vers/Versblock/Reihenfolge auswendig, Reading Assignment, Wahlaufgabe (XOR)
- **F1–F2** Sonstiges: externe Recherche, Frage zum Nachdenken

**MVP-Phase 1 implementiert nur**: A1, A2, A3, B1, C1, E1, E4. Rest folgt in Phase 2.

## Konventionen

- **Sprache UI**: Deutsch (i18n vorbereitet, aber nur DE-Strings im MVP).
- **Code-Sprache**: Englisch (Variablen, Tabellen-Namen, Code-Kommentare). Doku-Texte und User-facing Strings auf Deutsch.
- **Aufgabentypen** im Schema als pgEnum mit semantischer Benennung (`A1_true_false`, `E4_reading`), nicht numerisch.
- **Bibelstellen** als strukturiertes JSON (`{ bookId, chapter, verseFrom, verseTo? }`), nicht als String wie „Joh 3,16".
- **Versionierung**: Antworten an Kursversion gepinnt (`taskAnswers.courseVersion`). Bei Update bleibt der Lerner an der Version, an der er angefangen hat.
- **Sichtbarkeit** (`private`/`group`/`public`) ist auf jedem benutzererstellten Inhalt.
- **Lerner können** eigene private Verse anlegen. **Admin/Lehrer** veröffentlichen für Gruppen oder global.
- **Kein „role: teacher"** im MVP. Nur `admin` und `learner`. (Datenmodell additiv erweiterbar.)

## Was NICHT zu tun ist

- Kein Mentor-/Review-/Meeting-Code anlegen — wurde bewusst weggelassen.
- Keine Volltext-Bibel-Tabelle einführen.
- Keine US-Cloud-Dienste für den Datenkern (kein Supabase, kein Vercel-Postgres, kein Firebase).
- Keine Punkte-/Coin-/Lootbox-Mechaniken.
- Keine Push-Reminder mit Schamfaktor („Du hast deine Streak verloren!").
- Keine theologischen Eigen-Erweiterungen ohne Rücksprache mit Samuel.

## Pre-Push-Checkliste (verbindlich)

`pnpm build` + `curl /` prüft nur **Server-Side-Rendering**. Crashes auf
geschützten Routen (DB-Errors, Drizzle-Bugs, Client-Hydration) tauchen erst
**im Browser nach Auth** auf — und sind unsichtbar für Server-side-Tools.

Vor jedem `git push` (= Auto-Deploy auf Sliplane) gilt diese Reihenfolge:

1. `pnpm typecheck` — TypeScript-Fehler.
2. `pnpm test` — Vitest-Unit-Tests.
3. `pnpm build` — Next-Build muss durchlaufen.
4. **Browser-Verifikation einer geschützten Route**:
   - Lokal `pnpm dev` (NODE_ENV=development) starten.
   - Per `/api/dev-login` einloggen.
   - Mindestens **eine geschützte Route** öffnen (Dashboard, Verse, Übungen).
   - Browser-Console muss frei von `[error]`-Logs sein.
   - Bei Major-Bumps (Next, React, Drizzle, postgres.js, NextAuth):
     **alle drei Bereiche** öffnen — Dashboard, Verse-Lernen, Bücher-Übung.
5. Erst dann pushen.

**Lessons Learned (2026-05-08)**: Nach Next-15-Migration zeigte HTTP 200 +
SSR-Render auf `/`, aber `/dashboard` crashte mit Drizzle-`Failed query`
(postgres.js akzeptiert kein Date-Objekt im `sql\`\``-Template). Server-side
Tooling sah nur die Error-Boundary, nicht den Crash. Lokaler Browser-Check
hätte das in 30 Sekunden gefunden.

## Roadmap (siehe KONZEPT.md Kap. 12)

**Phase 0 ✓ abgeschlossen**: Repo-Skelett, Schema, Auth, Seed.

**Phase 1 — MVP (4–6 Wochen)**:
- Lehrkurs-Editor (Admin-UI für Module/Lektionen/Sektionen/Aufgaben)
- Selbststudium-Modus (Lektion bearbeiten, Auto-/Selbstbewertung)
- Aufgabentypen MVP (A1, A2, A3, B1, C1, E1, E4)
- SRS-Engine (SM-2)
- Reihenfolge-Bücher-Übung (Drag&Drop)
- Druckfunktion (PDF im Skript-ähnlichen Layout)
- PWA-Manifest + Service Worker

**Phase 2** (Monat 2–3): restliche Aufgabentypen, Karteikarten, Quizze, Audio, Gruppen, E-Mail-Reminder.

**Phase 3** (Monat 4+): FSRS, optional Mentor-Modul nachrüsten, mehr Übersetzungen.

## Externe Dokumente

- **KONZEPT.md** — Hauptkonzept, 14 Kapitel: Vision, Rollen, Lerninhalte, Methoden, Mentor-Workflow, Architektur, Tech-Stack, Datenmodell, UX, DSGVO/Lizenzen, Roadmap, Entscheidungen.
- **INHALTSANALYSE.md** — Detaillierte Auswertung des Skripts „Biblischer Unterricht 2013" mit Aufgabentypen-Inventar.
- **docs/dns-setup.md** — Schritt-für-Schritt DNS bei INWX/Hetzner + Resend + Sliplane.
- **lizenz-anfragen/** — Mail-Vorlagen für CLV (Schlachter 2000) und SCM/CSV (Elberfelder rev.).
- **README.md** — Quickstart für lokale Entwicklung.

## Aktueller Status (2026-05-08)

Phase 1 weitgehend offen — Lehrkurs-Editor + Selbststudium fehlen. Bisher
implementiert: Auth (Magic-Link via Resend), Vers-SRS-Lernen mit Standard-
und Lückentext-Modus, Bücher-Reihenfolge-Übung in drei Modi (Sortieren,
Zuordnen, Schreiben), PWA, mobile Navigation. Migration auf Next 15 +
React 19 + Drizzle 0.45 abgeschlossen. Codebase ist einmal komplett
refactored (Quality-Roadmap R1–R9, H1–H8, T1–T4 alle abgehakt).

**Verbleibende Aufgaben vor Phase 1**:
- `pnpm install` lokal frisch ziehen (nach Stack-Refactor)
- Lizenz-Mails an CLV und SCM/CSV abschicken
- Domain `bib-inside.de` bei INWX registrieren + DNS einrichten
- Repo zu GitHub privat pushen
- 1–2 Vertrauenspersonen als erste Tester ansprechen
