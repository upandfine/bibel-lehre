# Bib-Inside

Lern-App für strukturierte biblische Lehrkurse — Verse, Bücher-Reihenfolge, Karteikarten und mehr. Web-App (PWA), DSGVO-konform, self-hosted in Deutschland.

> Status: Phase 0 (Repo-Skelett, noch kein Feature-Code). Konzept und Datenmodell stehen.

## Dokumentation

- **[KONZEPT.md](./KONZEPT.md)** — Hauptkonzept: Vision, Lerninhalte, Aufgabentypen, Datenmodell, Roadmap, Entscheidungen.
- **[INHALTSANALYSE.md](./INHALTSANALYSE.md)** — Auswertung des Original-Skripts „Biblischer Unterricht 2013".
- **[docs/dns-setup.md](./docs/dns-setup.md)** — DNS-Setup für `bib-inside.de`.
- **[lizenz-anfragen/](./lizenz-anfragen/)** — Mail-Vorlagen für Schlachter 2000 und Elberfelder rev.

## Tech-Stack

| Schicht | Tool | Begründung |
|---|---|---|
| Framework | Next.js 14 LTS (App Router) + TypeScript | Stabiler LTS-Zweig, Produktion-erprobt |
| UI | Tailwind CSS + shadcn/ui | Anpassbar, schlank |
| Datenbank | PostgreSQL 16 + Drizzle ORM | Robuster Standard |
| Auth | NextAuth.js v4 (Magic-Link via Resend) | Stable seit Jahren, große Community |
| Mail | Resend (EU-Region) | EU-Hosting, DSGVO-freundlich |
| Hosting | Sliplane (Frankfurt am Main) | DE-Hosting, max. 3 Container |
| Container | Docker (Multi-stage Build) | Sliplane-Standard |
| Tests | Vitest + Playwright | Standard |

## Voraussetzungen

- Node.js ≥ 20
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.12.3 --activate`)
- Docker + Docker Compose (für lokale Postgres-Instanz)

## Quickstart (lokal)

```bash
# 1) Repository klonen und Dependencies installieren
pnpm install

# 2) Postgres starten
docker compose up -d

# 3) Umgebungsvariablen einrichten
cp .env.example .env.local
# NEXTAUTH_SECRET generieren:
openssl rand -base64 32
# → in .env.local bei NEXTAUTH_SECRET einfügen
# SEED_ADMIN_EMAIL prüfen — das wird dein erster Admin-Account
# RESEND_API_KEY: für lokales Testen optional (Magic-Link wird sonst in der Konsole geloggt)

# 4) DB-Schema anwenden
pnpm db:generate    # erzeugt SQL-Migrations aus dem Schema
pnpm db:migrate     # spielt sie ein

# 5) Stammdaten seeden (66 Bücher, 4 Übersetzungen, Beispiel-Verse, Admin)
pnpm db:seed

# 6) Dev-Server starten
pnpm dev
# → http://localhost:3000
```

### Erste Anmeldung

1. Gehe auf http://localhost:3000/sign-in
2. Gib die `SEED_ADMIN_EMAIL` ein, die du in `.env.local` gesetzt hast.
3. Falls **kein** `RESEND_API_KEY` gesetzt ist: Der Magic-Link erscheint in der `pnpm dev`-Konsole — anklicken/kopieren.
4. Falls `RESEND_API_KEY` gesetzt ist: Mail kommt im Postfach an.
5. Nach dem Klick bist du eingeloggt unter `/dashboard`.

## Häufige Befehle

```bash
pnpm dev             # Dev-Server (Hot-Reload)
pnpm build           # Production-Build
pnpm start           # Production-Server (lokal testen)
pnpm typecheck       # TypeScript-Check ohne Build
pnpm lint            # ESLint
pnpm format          # Prettier auf alle Dateien

pnpm db:generate     # Drizzle-Migrations aus Schema erzeugen
pnpm db:migrate      # Migrations einspielen
pnpm db:studio       # Drizzle Studio (Web-UI für die DB)
pnpm db:seed         # Stammdaten (Bücher, Übersetzungen) seeden

pnpm test            # Vitest-Tests einmal ausführen
pnpm test:watch      # Vitest im Watch-Mode
pnpm test:e2e        # Playwright-E2E-Tests
```

## Projektstruktur

```
.
├── KONZEPT.md                Hauptkonzept
├── INHALTSANALYSE.md         Skript-Auswertung
├── docs/                     Operative Dokumente (DNS, Runbooks)
├── lizenz-anfragen/          Mail-Vorlagen für Verlage
├── src/
│   ├── app/                  Next.js App Router (Pages, Layouts, API-Routes)
│   │   ├── sign-in/          Anmeldung mit Magic-Link
│   │   ├── dashboard/        Geschützte Hauptseite (Stand: Platzhalter)
│   │   └── api/auth/         NextAuth-Handler
│   ├── db/                   Drizzle Schema + Client + Seed
│   │   └── seed-data/        Stammdaten (Bibelbücher, Übersetzungen, Verse)
│   ├── lib/                  Hilfsfunktionen, E-Mail-Templates, Auth-Config
│   │   └── auth.ts           NextAuth-Optionen (DB-Adapter, Provider, Callbacks)
│   ├── types/                Type-Augmentations (next-auth)
│   └── middleware.ts         Edge-Middleware für Routenschutz
├── drizzle/                  Generierte SQL-Migrations (Git-tracked!)
├── public/                   Statische Assets, später PWA-Icons
├── docker-compose.yml        Lokale Postgres
├── Dockerfile                Production-Image für Sliplane
├── .env.example              Beispiel-Konfig
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
└── drizzle.config.ts
```

## Deployment auf Sliplane (später)

1. Repo nach GitHub privat pushen.
2. In Sliplane neuen Service anlegen, mit GitHub-Repo verbinden.
3. Service A: Dockerfile-Service, Build aus dem Repo.
4. Service B: Postgres 16 (Sliplane bietet das als Managed Service).
5. Umgebungsvariablen in Sliplane setzen (siehe `.env.example`).
6. Custom Domain `bib-inside.de` zuweisen (siehe `docs/dns-setup.md`).
7. Deploy.

## Designprinzipien

Aus den Festlegungen vom 2026-05-05:

- **Sanftes Design** — keine Lootboxen, keine Schulnoten, keine Schamfaktor-Reminder.
- **„Liebevolle Einschätzung & Ermutigung"** statt „Bestanden"/„Durchgefallen".
- **Sabbat-Modus** für Streaks ist standardmäßig aktiv (Sonntag pausiert).
- **Lesefreundlich** — Serifen für Bibeltexte, ruhige Hintergründe, optional Dark-Mode.
- **Mobile-first** und Tastatur-bedienbar.
- **DSGVO-konform** — alle Daten in Deutschland (Sliplane), keine US-Cloud-Abhängigkeit für den Datenkern.

## Lizenz / Code-Sichtbarkeit

Privater GitHub-Repo. Bei Bedarf später als Open Source veröffentlichen.
Inhalte (Kurse, Verse) gehören den jeweiligen Eigentümern (Lehrer / Verlage).
