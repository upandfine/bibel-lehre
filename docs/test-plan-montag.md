# Test-Plan Montag (2026-05-11)

Was zwischen Freitag (deinem Stand: A3 zuklappbare Kästen, 7f184c5) und
heute passiert ist — und wo du beim Antesten den Finger reinhalten solltest.

## Commits (Montag morgen)

```
4a543c8 Pre-Deploy-Smoke-Test: scripts/smoke.sh
a638965 Test-Coverage + DRY: zentrale Bewertungs-Logik in lib/lehrkurs-grading
accd8c0 Druckfunktion: Print-Stylesheet + Print-Button im Lektions-Header
b3c96ef A3 Match: Drag&Drop statt Dropdown
6305254 Lehrkurs-Fortschrittsanzeige (Modul / Lektion / Lektions-Header)
86d9cd0 Aufgabentypen-Renderer: A2 Cloze, A5 Ordering, A6 Choice
7c0d557 Aufgabentypen-Renderer: 13 weitere Typen verdrahtet
```

Alle sind auf `main`, Sliplane hat automatisch deployt. Live unter
https://bibel-lehre.sliplane.app.

## Was du klicken solltest

### 1. Bücher-Zuordnen mobile (dein eigentlicher Auftrag)

URL: https://bibel-lehre.sliplane.app/uebungen/buecher-reihenfolge/AT/zuordnen

- Eine Gruppe komplett richtig befüllen → **„Fertig?"** im Header klicken
  → Kasten kollabiert, grüner Border, Häkchen, „Erneut anschauen" rechts.
- Andere Gruppe falsch (z.B. ein Buch vertauscht) → **„Fertig?"** →
  amber Hinweis unter Header: „Da scheint noch etwas nicht zu passen…".
- Versuchen, in einen geschlossenen Kasten zu droppen → nichts passiert
  (drop disabled).
- „Erneut anschauen" → Kasten öffnet sich wieder.
- Auf Mobile fühlt sich das jetzt deutlich aufgeräumter an, weil
  geschlossene Kästen nur ~50px hoch sind statt ~250px.

### 2. Lehrkurs mit Fortschritts-Bar

URL: https://bibel-lehre.sliplane.app/lehrkurs

- Modul-Karte zeigt Fortschritts-Bar (z.B. „1/12" wenn du 1 Aufgabe
  beantwortet hast).
- Klick auf das Modul → Lektion zeigt eigene Fortschritts-Bar pro
  Lektion.
- Klick auf die Lektion → Header zeigt „Fortschritt: 1/12".
- Eine weitere Aufgabe beantworten (z.B. ein Text in Sektion b ändern
  und speichern) → Reload → Fortschritts-Bar zeigt jetzt „2/12".
- Bei 100% wird die Bar grün.

### 3. A3 Match: Drag&Drop statt Dropdown

URL: https://bibel-lehre.sliplane.app/lehrkurs/1/1, zu Sektion c) oder d) scrollen.

- Statt eines Dropdowns siehst du jetzt eine **Pool-Box** oben mit
  verfügbaren rechten Begriffen + Drop-Slots pro linken Begriff.
- Begriff aus Pool in einen Slot ziehen → Slot wird gefüllt, Begriff aus
  Pool verschwindet.
- Begriff aus einem Slot in einen anderen Slot ziehen → wandert.
- Begriff aus Slot zurück in den Pool ziehen → Slot wird leer.
- Wenn alle Slots gefüllt sind: **„Auflösen"** zeigt richtig/falsch
  inline (Slot-Farben).

### 4. Druckfunktion (PDF-Export)

URL: https://bibel-lehre.sliplane.app/lehrkurs/1/1, **„Drucken"-Button**
rechts oben im Header.

- Browser-Print-Dialog öffnet sich.
- Vorschau: weiße Seite, keine Top-Bar, keine Speichern-/Auflösen-Buttons,
  Texteingabefelder werden zu Linien (zum mit-Stift-Eintragen).
- Speichern als PDF → Datei sollte auf 2-3 A4-Seiten passen.
- Aufgaben werden nicht zwischen zwei Seiten zerrissen
  (`page-break-inside: avoid`).

### 5. Zusatz-Aufgabentypen (technisch fertig, aber noch keine Inhalte)

Diese Renderer existieren neu, werden aber erst sichtbar wenn du beim
Seeden der nächsten Lektionen die entsprechenden `task.type` setzt:

- **A2 Cloze** (Lückentext, tolerante Auto-Bewertung)
- **A5 Ordering** (Items per Pfeile in Reihenfolge bringen)
- **A6 Choice** (Single oder Multi je nach `multi`-Flag)
- **B2/B3/B4** (Liste / Definition / Vers-Bedeutung)
- **C2-C5** (Essay-Varianten, längere Textareas)
- **D1/D3** (private Reflexion mit „Privat"-Hinweis)
- **E1/E2** (verlinkt zum SRS-Vers-System)
- **E3** (verlinkt zur Bücher-Übung)
- **E4** (Reading-Checkbox „gelesen")
- **F1** (externe Recherche mit optionalem Notiz-Feld)

A4 Tabelle und E5 XOR fehlen noch — werden ergänzt, wenn ein konkreter
Bedarf entsteht.

## Was sich am Workflow geändert hat

- **`pnpm smoke`**: neues Skript fährt einen Production-Build und alle
  geschützten Routen mit Test-Session ab. 30 Sekunden, ersetzt die
  „lokale Browser-Verifikation" aus der Pre-Push-Checkliste, weil es
  RSC-Crashes wie den Webpack-Bug zuverlässig findet.

- **`lib/lehrkurs-grading.ts`**: zentrale Bewertungs-Logik. Vorher
  dreifach dupliziert. Jetzt eine Wahrheit, 28 Unit-Tests dazu.

- **Test-Coverage**: 52 → 90 Tests.

## Was offen ist

- **Lektion 2 + 3 Bibliologie**: brauchen Inhalte (paraphrasiert), die
  ich nicht ohne deine Review schreibe. Du hast 4 Fragen in
  `docs/bibliologie-aufbau.md` schon beantwortet — sobald wir konkrete
  Lektion-2-Texte haben, ist das eine Stunde Seed-Arbeit.

- **A4 Tabelle und E5 XOR**: noch ein Hinweis-Stub. A4 braucht einen
  Tabellen-Renderer mit Cell-Inputs, E5 braucht das `task_groups`-System.
  Nicht blockend für Modul 1.

- **Dependabot 3 moderate Vulnerabilities**: alle in devDependencies
  (vitest/vite/esbuild). Production-Bundle ist clean
  (`pnpm audit --prod` = 0). Siehe `SECURITY.md` für Details.

- **Live-Sliplane-Verifikation**: solange ich keinen automatisierten
  Browser-Test gegen die Live-URL habe, ist dein Klick die Bestätigung
  des Deploys.
