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

## Deployment auf Sliplane

### Übersicht

Zwei Services in einem Sliplane-Projekt:

| Service | Was | Quelle |
|---|---|---|
| `bibinside-app` | Die Next.js-App | dieser GitHub-Repo, Build aus `Dockerfile` |
| `bibinside-db` | PostgreSQL 16 | Sliplane-Postgres-Template |

### Schritt-für-Schritt

**1. Postgres-Service anlegen** (Service A)
- In Sliplane: „New Service" → Postgres-Template
- Datenbank-Name: `bibinside`, eigenen User/Passwort generieren
- Internal Hostname notieren (z. B. `bibinside-db.internal`) — den brauchen wir gleich
- Persistent Volume aktivieren (für Daten-Persistenz über Container-Restarts)

**2. App-Service anlegen** (Service B)
- „New Service" → GitHub-Repo `upandfine/bibel-lehre`
- Build: `Dockerfile` (Default-Pfad)
- Port: leer lassen — Sliplane setzt `PORT` automatisch, der Container liest sie

**3. Environment-Variablen setzen** (am App-Service)
```
DATABASE_URL=postgres://USER:PASS@bibinside-db.internal:5432/bibinside
NEXTAUTH_SECRET=<frisch generieren mit `openssl rand -base64 32`>
NEXTAUTH_URL=https://<sliplane-subdomain>.sliplane.app
NEXT_PUBLIC_APP_URL=https://<sliplane-subdomain>.sliplane.app
NEXT_PUBLIC_APP_NAME=Bib-Inside
RESEND_API_KEY=<Production-Key aus Resend-Dashboard>
EMAIL_FROM=Bib-Inside <noreply@send.bib-inside.de>
SEED_ADMIN_EMAIL=sommer@upandfine.de
AUTH_EMAIL_LINK_TTL_MINUTES=30
```

**4. Erstes Deploy auslösen**
Sliplane baut das Image, startet den Container. Beim Start läuft automatisch:
1. `node ./scripts/migrate.mjs` — spielt alle ausstehenden Drizzle-Migrationen ein
2. `node server.js` — startet den Next-Server

Wenn die Migration scheitert (z. B. weil die DB nicht erreichbar ist), beendet sich der Container und Sliplane meldet „Service nicht hochgekommen". Logs in der Sliplane-UI prüfen.

**5. Erst-Seed manuell ausführen** (einmalig)
Sliplane bietet kein Pre-Deploy-Hook. Den Seed führen wir per One-Off-Befehl im laufenden Container aus:
```bash
# Im Sliplane-Service: Shell öffnen
node -e "import('./scripts/seed.mjs')"   # oder via DB direkt — siehe unten
```
Falls das nicht möglich ist: lokal mit der Production-`DATABASE_URL` einmal `pnpm db:seed` laufen lassen (vorsichtig — schreibt produktive Daten).

**6. Custom Domain** (optional, später)
- Sliplane → Service → Domains → Add Custom Domain
- DNS bei INWX/Hetzner setzen (siehe [docs/dns-setup.md](./docs/dns-setup.md))
- HTTPS via Let's Encrypt automatisch
- Anschließend `NEXTAUTH_URL` und `NEXT_PUBLIC_APP_URL` auf die neue Domain umstellen

### Lokal das Production-Image testen

Bevor du nach Sliplane pushst, lokal verifizieren:
```bash
docker build -t bibinside .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgres://bibinside:bibinside@host.docker.internal:5432/bibinside" \
  -e NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  bibinside
# → http://localhost:3000
```

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
