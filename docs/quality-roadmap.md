# Quality Roadmap — Refactoring + Hardening

Dies ist eine ehrliche Bestandsaufnahme der Code-Qualität nach dem ersten
schnellen Aufbau. **Nicht jetzt sofort, sondern als Liste mit
Priorisierung** — pro Punkt steht, *warum* das wichtig ist und *was*
konkret getan werden müsste.

Konvention der Prioritäten:
- **🟥 H — High**: bald angehen, weil Risiko oder schnell wachsend.
- **🟨 M — Medium**: technische Schulden, die mit jeder Iteration teurer werden.
- **🟩 L — Low**: nice-to-have.

---

## Was schon gut ist

Damit wir nicht alles als rot sehen — der Stand ist solide:

- Schema sauber, mit klaren Indizes und Foreign-Keys
- Klare Trennung von Server-Components (DB-Zugriff) und Client-Components (Interaktion)
- 37 Unit-Tests für Kern-Algorithmen (SRS, LIS, Cloze)
- Pure Helper in eigenen Files, gut testbar
- Typescript strict (`strict: true` aktiv)
- Kommentare auf Deutsch erklären *warum*, nicht *was*
- Saubere Git-Historie, sprechende Commit-Messages

---

## Refactoring

### 🟥 R1. Repository-Pattern für DB-Zugriff

**Problem:** `db.select()` streut über Server-Actions (`verse/_actions.ts`), Server-Components (`load-books.ts`), Seed-Skripte. Bei einer Schema-Änderung muss man überall suchen.

**Lösung:** alle Queries hinter ein `src/lib/repositories/`-Layer ziehen, z.B. `verseRepo.findDueForUser(userId)`. Vorteile: zentrale Stelle für Query-Tuning, einfacher zu mocken in Tests, klare API zwischen Domänen-Logik und Datenbank.

**Aufwand:** ~3 h für die existierenden Queries.

### 🟥 R2. Auth-Helper zentralisieren

**Problem:** `requireUserId()` in `verse/_actions.ts` definiert. Layout `(app)/layout.tsx` macht eigene Session-Prüfung. `/api/dev-login` hat eigene Logik. `/admin` macht eigene Rollen-Prüfung.

**Lösung:** `src/lib/session.ts` mit `requireUser()`, `requireAdmin()`, `getOptionalUser()`. Konsistente Errors (`UnauthorizedError`, `ForbiddenError`).

**Aufwand:** ~1 h.

### 🟥 R3. Input-Validation mit Zod überall

**Problem:** Zod ist bereits installiert, wird aber nur im Sign-In-Form genutzt. Server-Actions wie `recordVerseReview(verseId, grade)` akzeptieren rohe Strings ohne Validierung. `/api/dev-login` parst body manuell.

**Lösung:** Pro Server-Action ein Zod-Schema; gemeinsamer Wrapper (`validatedAction`) der Schema-Validation, Auth und Error-Handling übernimmt.

**Aufwand:** ~2 h.

### 🟨 R4. SRS-Engine generischer machen

**Problem:** `recordVerseReview(verseId, grade)` ist verse-spezifisch, obwohl die SRS-Logik in `src/lib/srs.ts` neutral ist. Für andere Lerntypen (Flashcards, Buchreihenfolge als E3) müsste die Action dupliziert werden.

**Lösung:** generische `recordReview({ sourceType, sourceId, grade })` mit Validation-Whitelist für erlaubte sourceTypes pro User-Rolle.

**Aufwand:** ~1.5 h.

### 🟨 R5. URL-Builder

**Problem:** `/uebungen/buecher-reihenfolge/${testament}/${mode}/...` an mehreren Stellen hartkodiert.

**Lösung:** `src/lib/routes.ts` mit Funktionen wie `routes.buchReihenfolge.spielen(testament, mode)`. Ein Refactor nimmt etwa 30 min, danach IDE-Autocomplete für alle Routen.

**Aufwand:** ~1 h.

### 🟨 R6. Cookie-Namen aus NextAuth-Config beziehen

**Problem:** `next-auth.session-token` hartkodiert in `middleware.ts` UND `/api/dev-login`. Wenn NextAuth seine Convention ändert (z.B. v5-Migration), bricht es an mehreren Stellen.

**Lösung:** `src/lib/auth-cookies.ts` mit den Cookie-Namen als Konstanten, beide Stellen importieren.

**Aufwand:** 15 min.

### 🟨 R7. Seed-Modularisierung

**Problem:** `src/db/seed.ts` macht alles in einem File. Wenn Bibliologie-Lektionen dazukommen, wird's unübersichtlich.

**Lösung:** `src/db/seed/{books,translations,verses,courses}.ts` mit eigenen Funktionen, `seed.ts` als Orchestrator.

**Aufwand:** ~1 h.

### 🟩 R8. Komponenten-Aufteilung

**Problem:** `zuordnen-stage.tsx` ist 320 Zeilen, `cloze-session.tsx` 280 Zeilen. Lesbar, aber an der Grenze.

**Lösung:** Sub-Komponenten in eigene Files (`pool-container.tsx`, `section-container.tsx`, `cloze-input.tsx`).

**Aufwand:** ~2 h für alle Stages.

### 🟩 R9. Naming-Konvention dokumentieren

**Problem:** Manche Sub-Komponenten heißen `*-stage.tsx`, andere `*-form.tsx`, andere `LearnSession`, andere `SortStage`. Inkonsistent.

**Lösung:** Convention in CONTRIBUTING.md / README:
- Pages: `page.tsx` (Next-Konvention)
- Client-Komponenten lokal zur Route: `_components/<name>.tsx` (kebab-case)
- Komponenten-Funktionsnamen: PascalCase, ohne `*Component`-Suffix
- Server-Actions: `_actions.ts`, exportierte Funktionen mit Verb am Anfang

**Aufwand:** 30 min Doku + iterative Anpassung.

---

## Hardening

### 🟥 H1. Rate-Limiting auf öffentlichen Endpunkten

**Problem:** `/sign-in` (Magic-Link-Generierung) und `/api/dev-login` haben kein Rate-Limit. Ein Bot könnte beliebig viele Magic-Mails an beliebige Adressen triggern → Spam-Risiko, Resend-Quota verbraucht, eventuell als „Mailbomb"-Tool missbraucht.

**Lösung:** in-memory Sliding-Window per IP (z.B. 5 Anfragen / 10 Min), oder upstash-ratelimit wenn wir Redis hätten. Für jetzt: simpel, Map mit IP+Timestamp.

**Aufwand:** ~1 h.

### 🟥 H2. Security Headers

**Problem:** Standard-Next-Konfiguration setzt nicht alle Security-Header.

**Lösung:** `next.config.mjs` `headers()`-Funktion mit:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` (außer für Embed-Cases)
- `Permissions-Policy` (deaktiviert Camera, Geo etc.)
- Optional: `Content-Security-Policy` (komplex wegen Inline-Scripts)

**Aufwand:** 30 min für die einfachen Header, +1.5 h wenn man CSP richtig macht.

### 🟥 H3. CSRF-Status prüfen

**Problem:** Next-Server-Actions haben eingebauten CSRF-Schutz (Origin-Check). `/api/dev-login` macht POST aber **nicht** über Server-Action — also ohne diesen Schutz. Da nur in Dev aktiv: niedriges Risiko, aber dokumentieren.

**Lösung:** `/api/dev-login` zu Server-Action umbauen (sauberer) oder explizit Origin-Header prüfen.

**Aufwand:** 30 min.

### 🟨 H4. Audit-Log nutzen

**Problem:** Tabelle `audit_log` existiert, wird aber nicht beschrieben.

**Lösung:** Jede Admin-Aktion (User-Rollen-Änderung, Kurs-Veröffentlichung, Lösch-Operationen) loggt automatisch über einen Helper.

**Aufwand:** ~1.5 h, kann inkrementell wachsen.

### 🟨 H5. Strukturiertes Logging

**Problem:** `console.log/warn/error` verstreut. Nicht filterbar, kein Level, keine Korrelations-IDs.

**Lösung:** dünner Wrapper `src/lib/log.ts` mit `log.info/warn/error(msg, ctx)`. Im Production-Build optional zu Pino oder Sliplane-Output mit JSON.

**Aufwand:** ~1 h für den Wrapper, +30 min jeden Console-Call zu portieren.

### 🟨 H6. DB-Query-Tuning

**Problem:** `getVerseStats()` macht 3 separate Queries für eng verwandte Daten. `getDueVerses()` läuft mit jedem Page-Load durch.

**Lösung:**
- `getVerseStats` zu einer Query mit `count(filter where ...)` zusammenfassen
- Optional: Result für 30 s cachen (Next-Cache mit revalidate)

**Aufwand:** 1 h.

### 🟨 H7. Error-Boundaries und Loading-States

**Problem:** Nur `error.tsx` und `not-found.tsx` an Top-Level würden Render-Crashes auffangen. Aktuell sieht der User bei einem Server-Fehler den Default-Next-Error-Screen.

**Lösung:** `(app)/error.tsx`, `(app)/not-found.tsx`, ggf. pro Sub-Bereich eigene Error-Boundaries.

**Aufwand:** ~1 h für die wichtigsten Stellen.

### 🟩 H8. Dependabot-Vulnerabilities aufräumen

**Problem:** GitHub meldet 16 Findings (7 high, 9 moderate). Vermutlich transitive Deps in @next/* oder ähnlich.

**Lösung:** systematisch durch `pnpm audit` gehen, einfache Fixes per `pnpm update`, riskante (Major-Bumps) explizit besprechen.

**Aufwand:** ~1.5 h.

---

## Test-Strategie

### 🟥 T1. Server-Action-Tests

**Problem:** Server-Actions (`recordVerseReview`, `getDueVerses`) sind ungetestet. Sie kapseln aber die kritische Geschäftslogik.

**Lösung:** Test-DB-Setup (kleine Postgres-Container in CI, oder pglite), Tests pro Action mit echten DB-Calls.

**Aufwand:** ~3 h für Setup + erste Tests.

### 🟨 T2. E2E mit Playwright

**Problem:** Playwright ist als Dependency drin, wird nicht genutzt.

**Lösung:** Smoke-Tests für die wichtigsten Flows:
- Anmeldung mit Dev-Login
- Bücher-Reihenfolge: Auswahl → Modus → Übung → Auswertung
- Vers-Lernen: Übersicht → Lern-Session → Bewertung speichern
- Mobile-Hamburger-Drawer

**Aufwand:** ~3 h für Setup + 5–10 Smoke-Tests.

### 🟨 T3. CI mit GitHub Actions

**Problem:** Tests laufen nur lokal. Code wird gepusht, ohne dass Tests vorher gegen den Stand laufen.

**Lösung:** `.github/workflows/test.yml`:
- typecheck
- vitest run
- ggf. playwright in einem zweiten Job

**Aufwand:** ~1 h.

### 🟩 T4. Coverage-Messung

**Problem:** Wir wissen nicht, was getestet ist. Kann zu falschem Sicherheitsgefühl führen.

**Lösung:** `pnpm test --coverage` einrichten, mind. 70 % auf den `lib/` und `_components/_helpers`-Dateien als Ziel.

**Aufwand:** 30 min Setup.

---

## Empfohlene Reihenfolge

In drei Iterationen, kompatibel mit dem normalen Feature-Flow:

### Iteration A — Foundation (Total ~6 h)
Auf einem Schwung, sobald das Bibliologie-Modul angefangen hat:

1. **R2** Auth-Helper zentralisieren — vor jedem neuen Lehrkurs-Code
2. **R3** Zod-Validation überall — gleicher Block, sauber zusammen
3. **H2** Security Headers — schnell erledigt, sofort produktiv
4. **R6** Cookie-Namen-Konstanten — 15 min, ein Stress weniger
5. **H7** Error- und Not-Found-Pages — verhindert kaputte UX bei Server-Fehlern

### Iteration B — Architektur (Total ~5 h)
Wenn die ersten zwei oder drei Lektionen drinnen sind:

6. **R1** Repository-Pattern — konsolidiert die DB-Zugriffe, jetzt sehen wir Patterns
7. **R5** URL-Builder — wachsende Routen-Zahl macht das wertvoller
8. **R7** Seed-Modularisierung — vor dem nächsten Inhalts-Schub
9. **R4** Generische SRS-Action — wenn Karteikarten als zweiter Lerntyp drankommen

### Iteration C — Härten + Tests (Total ~7 h)
Vor öffentlichem Tester-Beta:

10. **H1** Rate-Limiting — bevor mehr Leute reinkommen
11. **H5** Strukturiertes Logging — bevor wir es in Production-Logs brauchen
12. **H6** DB-Query-Tuning — wenn Performance auffällt
13. **T1** Server-Action-Tests — Sicherheitsnetz
14. **T2** Playwright-Smoke-Tests — Regression-Schutz
15. **T3** CI mit GitHub Actions — automatisch grüner Bauch
16. **H8** Dependabot-Vulnerabilities — zwischendurch oder am Ende

---

## Was bewusst NICHT auf der Liste steht

- **Microservices / Backend-Auslagerung** — overkill für Solo-Maintainer.
- **Custom-Auth-Stack** — NextAuth deckt 95 % ab, wir bleiben.
- **Eigenes Design-System** — shadcn/ui passt.
- **GraphQL / tRPC** — Server-Actions reichen.
- **Redis / Upstash** — kommt erst wenn Rate-Limit oder Background-Queue nötig.
- **i18n-Framework** — nur DE im MVP.
