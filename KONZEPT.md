# Bib-Inside — Konzept & Möglichkeiten

> **Arbeitsname**: Bib-Inside · **Domain**: bib-inside.de
> Lern-App für strukturierte biblische Lehrkurse (Selbststudium) mit Vers-Lernen, Bücher-Reihenfolge, Karteikarten, Quizzen.
> Stand: 2026-05-05 (überarbeitet nach Skript-Sichtung und Entscheidungs-Runde) · Autor: Samuel · Status: Entwurf zur Diskussion

Diese Doku ist als **Diskussionsgrundlage** gedacht. Wo es Optionen gibt, ist die empfohlene Variante mit *(Empfehlung)* markiert.

> **Begleitdokument**: `INHALTSANALYSE.md` — konkrete Auswertung des bereitgestellten Kursskripts mit Aufgabentypen-Inventar und Layout-Mustern. Diese Doku hier baut darauf auf.

> **Wichtige Festlegungen aus der Entscheidungs-Runde 2026-05-05** — diese Punkte sind verbindlich und prägen das gesamte Konzept:
>
> - **Kein Mentor-Workflow im MVP.** Treffen finden physisch statt. Die App ist Selbststudium-Werkzeug. Antworten sind privat beim Nutzer.
> - **Druckfunktion** für ausgefüllte Lektionen ist Pflicht-Feature (mitnehmbar zum physischen Treffen).
> - **Eine theologische Position** (wie im Skript). Keine Multi-Position-Architektur.
> - **Keine Volltext-Bibel** in der App — nur einzeln eingetippte Lerntexte mit Übersetzungs-Metadaten. Vermeidet Lizenzfragen sauber.
> - **Musterlösungen sind optional und leer-tolerant.** Samuel pflegt sie nach und nach.
> - **Kein „Bestanden"-Konzept.** Statt Noten gibt es liebevolle Einschätzung & Ermutigung als Designprinzip.
> - **Solo-Maintainer.** Tech-Stack so schlank wie möglich, sauber und fehlerfrei, keine Enterprise-Patterns.

---

## Inhaltsverzeichnis

1. Vision und Leitgedanken
2. Zielgruppen, Rollen, Berechtigungen
3. Lerninhalte (Domänen) — inkl. **Strukturierte Lehrkurse** (3.0) und Aufgabentypen-Inventar (3.5)
4. Lernmethoden — modern, didaktisch fundiert
5. Lernaufgaben anlegen und verwalten — inkl. **Mentor-Workflow** (5.6), Frist-Mechanik (5.7), Wahlaufgaben (5.8), Reading Assignments (5.9)
6. Gamification, Motivation, Soziales
7. Architektur (mit Sliplane-Constraints)
8. Tech-Stack-Empfehlung
9. Datenmodell — inkl. **Lehrkurs-Schema** (9.1)
10. UX/UI-Konzept — inkl. **Zwei UI-Welten** (10.3)
11. DSGVO, Lizenzen, Bibelübersetzungen
12. Roadmap / MVP-Vorschlag — überarbeitet, MVP umfasst jetzt Lehrkurs + Mentor
13. Offene Entscheidungen — Punkte 13–20 NEU aus Skript-Sichtung
14. Referenzen und Inspiration

**Begleitdokument**: [`INHALTSANALYSE.md`](INHALTSANALYSE.md) — Auswertung des Skripts „Biblischer Unterricht 2013".

---

## 1. Vision und Leitgedanken

**Bibel-Lehre** soll einer (Frei-)Gemeinde und ihren Mitgliedern helfen, biblische Inhalte aus dem Bibelstudium **nachhaltig zu lernen** — Verse, Strukturen, Fakten, Zusammenhänge.

Drei Leitgedanken:

- **Didaktisch fundiert**: Nicht „Quiz-App mit Bibelverse drüber", sondern bewährte Lernpsychologie (Spaced Repetition, Active Recall, Interleaving, Dual Coding).
- **Schlank betreibbar**: Ein Projekt, das eine Privatperson dauerhaft pflegen und für ein paar Euro im Monat hosten kann. Maximal 3 Docker-Container.
- **DSGVO-konform & geistlich passend**: Hosting in Deutschland/EU, klare Datenhoheit, keine Werbe-Tracking-Drittanbieter, keine US-Cloud-Abhängigkeiten beim Datenkern.

---

## 2. Zielgruppen, Rollen, Berechtigungen

### 2.1 Phase 1 — geschlossene Gruppe

Eigene Gemeinde / Bibelschule. Registrierung per Einladung (Token-Link) oder Beitrittscode.

### 2.2 Phase 2 (optional, später) — Öffnung

Öffentliche Selbstregistrierung möglich, mehr Moderations- und Datenschutzaufwand. Architektur muss das nicht vorbauen, aber blockieren darf sie es auch nicht.

### 2.3 Rollen (MVP-vereinfacht)

| Rolle | Rechte |
|---|---|
| **Admin** | Alles. User verwalten, Rollen vergeben, zentrale Inhalte erstellen/freigeben/löschen, App-Einstellungen. Im MVP ist Samuel der einzige Admin. |
| **Lerner** | Bearbeitet zentrale Kurse im Selbststudium, erstellt eigene private Lerninhalte (Karteikarten, eigene Verse), trackt eigenen Fortschritt, druckt Lektionen. |

> **Bewusst weggelassen im MVP**: separate Rollen wie „Lehrer" und „Mentor". Inhaltspflege macht im MVP nur Samuel als Admin. Mentor-Funktion (Antworten kommentieren etc.) ist explizit nicht Teil des MVP — Treffen finden physisch statt. Falls später nötig, kann eine Lehrer-/Mentor-Rolle additiv eingeführt werden, ohne Datenmodell-Bruch.

### 2.4 Sichtbarkeit von Inhalten

Jeder Lerninhalt hat eine Sichtbarkeit:

- `private` — nur der Ersteller
- `group` — sichtbar für eine bestimmte Gruppe (z. B. „Hauskreis Nord", „Bibelschule 2026")
- `public` — für alle in dieser Bibel-Lehre-Instanz

Eigene Inhalte können nur **Lehrer/Admin** auf `public` setzen oder freigeben. Lerner können ihre Sachen `private` halten oder zur Veröffentlichung *vorschlagen* (Optional-Feature, siehe Roadmap).

---

## 3. Lerninhalte (Domänen)

Die App ist als **Plug-in-System für Lerntypen** gedacht. Jeder Lerntyp hat eigene Eingabe-, Anzeige- und Übungsmodi, teilt sich aber den gemeinsamen Lernfortschritts- und Wiederholungs-Mechanismus.

> **Wichtige Korrektur nach Sichtung des Skripts**: Der **strukturierte Lehrkurs mit Mentor-Begleitung** (siehe 3.0) ist der eigentliche Haupt-Use-Case. Die anderen Domänen (Verse, Bücher, Karten, Quiz) sind seine *Bausteine*: Verse zum Auswendiglernen, Begriffe als Karteikarten und Bücher-Reihenfolge entstehen *aus* den Lehrkursen heraus.

### 3.0 Strukturierte Lehrkurse (Haupt-Use-Case) ✦ NEU

**Inhalt**: Mehrwöchige bis mehrmonatige Kurse mit klarer Hierarchie:

```
Kurs (z.B. „Systematische Theologie")
  └─ Modul / Thema (z.B. „Bibliologie", „Theologie", „Christologie" …)
      └─ Lektion (1–3 pro Modul)
          └─ Sektion (a, b, c, …)
              └─ Aufgaben (verschiedene Typen, siehe Kapitel 4)
```

**Zentrale Eigenschaften**:

- Pro Modul ein **Beschreibungs-Header** mit Zielen, Aufbau, Aufgaben (übergreifend, oft mit Fristen) und Literaturempfehlungen.
- Pro Sektion ein **Lehrtext** (eingeführter Vorspann) + **Bibelstellen-Block** (links, klickbar) + **eine oder mehrere Aufgaben**.
- **Mentor-Begleitung**: 1 Mentor : 2–4 Schüler, Treffen alle ~2 Monate, Selbststudium ist die Hauptarbeit. Siehe Kapitel 5.
- **Frist-Mechanik**: einzelne Aufgaben mit Termin („auswendig bis Lektion 3"), ganze Module mit Abgabefrist.
- **Wahlaufgaben**: „Mache A *oder* B" — XOR-Verzweigung.
- **Reading Assignments**: externe Buchverweise als eigener Aufgabentyp.
- **Theologische Position**: Kurse haben markierbare Ausrichtungen (z. B. „6×24h-Schöpfung", „prätrib. Entrückung"), damit später andere Gemeinden mit anderer Position eigene Kurse einstellen können, ohne sich in die Quere zu kommen.

**Vorbild**: das real existierende Skript *„Biblischer Unterricht für die Gemeinde, 5. Fassung 2013"* mit 10 Modulen (Bibliologie bis Eschatologie). Detailauswertung in `INHALTSANALYSE.md`.

### 3.1 Bibelverse auswendig lernen

**Inhalt**: Einzelvers, Versgruppe oder Versblock (z. B. Joh 3,16 oder Röm 8,28-30).

**Felder**:

- Stelle (Buch, Kapitel, Vers von–bis)
- Übersetzung (Schlachter 2000, Elberfelder, … s. Kapitel 11)
- Volltext
- optionaler Kontext-Block (drei Verse davor/danach, ausblendbar)
- Audio-Datei (optional, vom Lehrer hochgeladen oder per Browser-TTS)
- Tags (Themen wie „Trost", „Heil", „Heiligung"…)
- Notizen (privat)

**Übungsmodi** — siehe Kapitel 4.

### 3.2 Reihenfolge biblischer Bücher

**Inhalt**: Die 66 Bücher (Protestantischer Kanon) — erweiterbar um Apokryphen falls gewünscht.

**Strukturmerkmale**:

- AT/NT
- Gruppen (Pentateuch, Geschichtsbücher, Lehrbücher/Poesie, Große Propheten, Kleine Propheten, Evangelien, Apostelgeschichte, Paulusbriefe, Allgemeine Briefe, Offenbarung)
- Farbcode pro Gruppe
- Anzahl Kapitel, kurze Beschreibung, Hauptthema, Verfasser (soweit bekannt)

**Übungsmodi**: Drag&Drop in richtige Reihenfolge, Gruppen-Zuordnung, Zeitstrahl, Buch-Quiz („Welches Buch kommt nach Hesekiel?").

### 3.3 Karteikarten / Fakten (allgemein)

**Inhalt**: Frage/Antwort-Paare, optional mit Bild oder Audio. Klassische Flashcards für alles, was sich nicht in 3.1/3.2 einsortiert: Personen, Orte, Jahreszahlen, Begriffe, Schlüsselwörter im Urtext.

**Felder**: Vorderseite, Rückseite, Hinweis/Eselsbrücke, Bild, Tags, Deck-Zuordnung.

### 3.4 Quizze / Wissenstests

**Inhalt**: Sammlung von Fragen mit verschiedenen Antwortformaten:

- Single Choice
- Multiple Choice
- Wahr/Falsch
- Lückentext
- Reihenfolge sortieren
- offene Antwort (nicht automatisch bewertbar — entweder Selbsteinschätzung oder Lehrer-Review)

Quizze können als **Lernquiz** (mit Wiederholung) oder als **Test** (einmalig, mit Auswertung) konfiguriert werden.

### 3.5 Aufgabentypen innerhalb von Lehrkurs-Sektionen ✦ NEU

Aus der Skript-Analyse (siehe `INHALTSANALYSE.md` Kapitel 3) ergeben sich folgende Typklassen, die jede Sektion im Lehrkurs vorkommen lassen kann. Sie sind im Datenmodell als Enum gehalten:

**A. Auto-bewertbar** — *System prüft Korrektheit*

- A1 Wahr/Falsch
- A2 Lückentext (Cloze) mit/ohne Wortbank
- A3 Match/Zuordnung (z. B. Bibelstelle ↔ Begriff)
- A4 Tabelle ausfüllen (multi-spaltig, Lehrer hinterlegt Musterantwort)
- A5 Reihenfolge (z. B. biblische Bücher, Heilsgeschichte)
- A6 Multiple/Single Choice

**B. Selbstbewertet** — *Lehrer hinterlegt Erwartung, Schüler vergleicht*

- B1 Kurze offene Frage
- B2 Aufzählung / Liste
- B3 Definition geben
- B4 Bibelstelle-Aussage extrahieren

**C. Mentor-bewertet** — *qualitative Rückmeldung erforderlich*

- C1 Lange offene Antwort / Argumentation
- C2 Auslegung / Essay (mit Längen-Vorgabe, z. B. „2 DIN-A4-Seiten")
- C3 Vergleich / Verbindung herstellen
- C4 Anwendungsfrage / Hypothetisch („Was würdest du jemandem antworten, der …")
- C5 Zusammenfassung in eigenen Worten

**D. Persönliche Reflexion** — *privat, nicht eingereicht* (nur sichtbar für Lerner; optional teilbar mit Mentor)

- D1 Persönliche Bedeutung
- D2 Persönliche Auswirkung
- D3 Persönliche Begeisterung

**E. Verhaltens-/Auswendig-Aufgaben** — *erstrecken sich über mehrere Sitzungen*

- E1 Vers auswendig (1 Vers, mit Frist)
- E2 Längeren Text auswendig (Versblock, Psalm)
- E3 Reihenfolge auswendig (z. B. Bücher der Bibel)
- E4 Reading Assignment (externe Lektüre, Häkchen + Notiz)
- E5 Wahlaufgabe (A *oder* B) — XOR-Logik

**F. Sonstiges**

- F1 Externe Recherche (Wörterbuch, Lexikon)
- F2 Frage zum Nachdenken (offen, kann zur Mentor-Diskussion eskalieren)

### 3.6 Erweiterbar: weitere Lernthemen

Die Datenmodelle und Lernschleifen sind so generisch, dass auch das funktioniert:

- **Glaubensbekenntnis-Texte / Katechismus** — wie Verse-Lernen
- **Lieder / Hymnen** auswendig — wie Verse-Lernen mit längerem Text
- **Hebräisch/Griechisch-Vokabeln** — wie Karteikarten mit Spezialfeldern (Transliteration, Stammwort)
- **Zeitstrahl der Bibel-/Kirchengeschichte** — neue Domäne, eher Phase 2

---

## 4. Lernmethoden — modern, didaktisch fundiert

Das Herz der App. Hier die Bausteine, die wir kombinieren sollten.

### 4.1 Spaced Repetition (SRS) — die Basis

**Was**: Inhalte werden in immer größer werdenden Abständen wiederholt — kurz vor dem Vergessen. Wissenschaftlich der mit Abstand effektivste Weg, etwas dauerhaft zu behalten.

**Wie**: Pro Lernkarte/Vers/Frage merkt sich das System: Wann zuletzt gesehen, wie gut beantwortet, nächster Fälligkeitstermin.

**Algorithmus-Optionen**:

- **SM-2** *(Empfehlung für MVP)* — der Klassiker hinter Anki. Einfach, bewährt, gut dokumentiert. Selber implementiert in ~50 Zeilen.
- **FSRS (Free Spaced Repetition Scheduler)** — moderner, datengetriebener Algorithmus, in Anki seit 2024 Standard. Genauer, aber komplexer und braucht historische Daten. Optionaler Upgrade-Pfad.
- **Leitner-System** — sehr einfach (5-Boxen), eher für Kinder/Einsteiger. Kann als Visualisierung dienen, intern aber SM-2 laufen.

> **Empfehlung**: SM-2 implementieren, FSRS später als Option anbieten.

### 4.2 Active Recall — Erinnern statt Wiedererkennen

Lernen findet beim Abrufen statt, nicht beim Lesen. Übungsformate sollten **Produktion** verlangen, nicht nur Erkennen.

Konkret für Bibelverse:

- **Lückentext** — zufällige Wörter ausgeblendet (steigerbar: 10% → 30% → 50% → 100%)
- **Anfangsbuchstaben-Modus** — nur erste Buchstaben jedes Worts sichtbar („D a G d L s, ..." → „Denn also hat Gott die Welt geliebt, …"). Sehr beliebter Modus in Memory-Verses-Apps.
- **Tipp-Modus** — Vers selbst eintippen, mit Live-Hervorhebung richtig/falsch
- **Diktat (Audio)** — Audio hören, Text tippen oder auswählen
- **Drag & Drop** — Wörter eines Verses in richtiger Reihenfolge anordnen
- **Versanfang → Versende** — Stichwortzeile gegeben, Vers vervollständigen

Für Reihenfolge biblischer Bücher:

- Drag & Drop in richtigen Slot
- „Welches Buch fehlt?" (eines aus Reihe entfernt)
- Gruppen-Sortierung
- Zeitsprint (so viele Bücher wie möglich in 60 Sekunden)

Für Karteikarten/Quiz: klassisch Frage → Antwort, Selbstbewertung (Anki-Style: „Wieder/Schwer/Gut/Einfach").

### 4.3 Interleaving — Mischen statt Blocken

Statt zehn Mal denselben Vers, lieber zehn Verse aus verschiedenen Themen mischen. Anstrengender, aber nachhaltiger. Standardmäßig aktiv im täglichen Lern-Stack.

### 4.4 Dual Coding — Text + Bild + Ton

Mehrere Sinneskanäle aktivieren:

- **Audio** — Verse vorgelesen (eingeprochen vom Lehrer oder Browser-TTS als Fallback)
- **Bild/Symbol** — pro Versgruppe oder pro Bibelbuch ein einprägsames Symbol/Farbcode
- **Bewegung** — Drag&Drop, Tippen, Wischen aktiviert motorisches Gedächtnis

### 4.5 Chunking — sinnvolle Häppchen

Lange Verse/Passagen in Sinneinheiten zerlegen. Lehrer kann Trennstellen im Text markieren (z. B. mit `|`), und Übungen arbeiten dann auf Chunks („Lerne den nächsten Chunk").

### 4.6 Mnemotechniken & Eselsbrücken

- Pro Karte ein optionales Hinweis-Feld (Eselsbrücke)
- Für Bücher-Reihenfolge: Akronyme (z. B. „Genesis-Exodus-Levitikus-Numeri-Deuteronomium" → „GELN-D")
- Loci-Methode (Gedächtnispalast) — eher Phase-2-Feature, wenn überhaupt

### 4.7 Selbsterklärung & Kontext

Beim Lernen eines Verses optional fragen: *„Was bedeutet dieser Vers für dich? Welcher Kontext ist wichtig?"* — kurze freie Notiz, die der Lerner sich selbst speichert. Stärkt semantisches Gedächtnis enorm.

### 4.8 Tagesziele & Streaks

- Tageskarte: „Heute: 12 Karten fällig, 1 neuer Vers"
- Streak-Zähler (X Tage in Folge gelernt)
- Wochenübersicht
- *Aber*: Sanft halten, kein „Suchtdesign". Streaks dürfen pausierbar sein (Urlaub, Krankheit) — siehe Kapitel 6.

### 4.9 Adaptives Schwierigkeitsniveau

Karten/Verse, die regelmäßig falsch beantwortet werden, kommen häufiger und in einfacheren Modi (mehr Hinweise). Karten mit hoher Erfolgsrate werden in Tip-Modus ohne Hinweise hochgestuft.

---

## 5. Lernaufgaben anlegen und verwalten

### 5.1 Begriffs-Hierarchie

```
Lernpfad / Kurs           (z. B. „Bibelschule Modul 1: Pentateuch")
  └─ Lektion / Sammlung   (z. B. „Schlüsselverse Genesis 1-3")
      └─ Lerneinheit      (= eine Karte, ein Vers, eine Frage)
```

- **Lerneinheit**: kleinste Einheit, durchläuft den SRS.
- **Lektion**: thematisch zusammengehörige Einheiten. Hat eigene Reihenfolge, Beschreibung, optional Vorbedingungen.
- **Lernpfad**: mehrere Lektionen mit empfohlener Abfolge, Fortschrittsbalken, optionaler Abschluss-Test.

### 5.2 Editor für Lehrer/Admins

Web-basierter Editor mit:

- **Bulk-Import** — CSV/JSON-Upload für viele Karten oder Verse auf einmal
- **Bibelvers-Quick-Add** — Stelle eingeben („Joh 3,16"), Text wird automatisch aus der hinterlegten Übersetzung gezogen
- **Live-Vorschau** — wie der Lerner es sehen wird, inklusive Übungsmodus
- **Versionierung** — Änderungen an veröffentlichten Lektionen sind nachvollziehbar; Lerner sehen optional „aktualisiert seit deinem letzten Lernen"
- **Sichtbarkeits-Steuerung** — private / group / public, wie in 2.4
- **Veröffentlichungs-Workflow** — Entwurf → Review → Veröffentlicht → Archiviert

### 5.3 Zuweisung an Lerner / Gruppen

- Lehrer kann Lektion einer Gruppe **zuweisen** (mit Frist).
- Lerner sehen zugewiesene Lektionen prominent im Dashboard.
- Optional: Push-/E-Mail-Erinnerung an Frist.

### 5.4 Statistik für Lehrer

Aggregierte (anonyme oder benannte) Sicht:

- Wer hat wie viel der Lektion durchgearbeitet?
- Welche Verse/Karten sind besonders schwer (niedrige Erfolgsrate gruppenweit)?
- Wer hat lange nicht mehr gelernt?

> Datenschutz-Frage offen: granular einstellbar, ob Lerner namentlich oder nur aggregiert sichtbar sind.

### 5.5 Eigene Lerninhalte (Lerner)

Jeder Lerner kann eigene Karten/Verse anlegen:

- gleicher Editor wie Lehrer, aber Sichtbarkeit max. `private` (für Lerner-Rolle)
- Inhalte aus zentralen Lektionen können in eigene Decks **dupliziert** werden — z. B. um eigene Notizen hinzuzufügen, ohne die zentrale Version zu beeinflussen

### 5.6 Selbststudium-Workflow ✦ ÜBERARBEITET

> **Festlegung**: Kein Mentor in der App. Treffen finden physisch statt. Die App ist reines Selbststudium-Werkzeug. Bewertung/Korrektur passiert offline beim Treffen — der Nutzer bringt seine ausgedruckte Lektion mit.

**Schüler-Sicht**

- **Mein Kurs-Dashboard**: aktuelle Lektion, nächster Vers im SRS-Stack, was noch offen ist (nicht im Sinne von „abgegeben", sondern „selbst noch nicht bearbeitet").
- **Lektion bearbeiten**: scrollbare Sektion, Aufgaben werden direkt in der App ausgefüllt und automatisch gespeichert.
- **Auto-Bewertung** für A-Typ-Aufgaben: System sagt „richtig"/„nochmal überlegen", ohne Druck.
- **Selbstbewertung** für B-Typ-Aufgaben: nach dem eigenen Antworten kann der Nutzer eine optional hinterlegte Musterantwort einblenden und sich selbst einschätzen („passt", „teils", „nochmal lesen"). Falls keine Musterantwort hinterlegt ist, bleibt die Stelle leer mit Hinweis „wird beim Treffen besprochen".
- **C-Typ-Aufgaben** (lange Antworten, Auslegungen): Nutzer schreibt sie in den Text-Editor, speichert. Diese Antworten sind **rein privat** und werden im physischen Treffen besprochen.
- **D-Typ (persönliche Reflexion)**: privat, immer sichtbar nur für den Nutzer selbst.
- **E-Typ (Verse, Reading)**: läuft über SRS bzw. Reading-Häkchen.

**Druckfunktion (wichtig)** ✦ NEU

- Pro Lektion: „Diese Lektion drucken" → erzeugt eine PDF/Druckansicht im Layout des Original-Skripts (Bibelstellen links, Aufgaben + meine Antworten rechts).
- Optional: nur ausgefüllte Felder oder leere Vorlage drucken.
- Zweck: Nutzer nimmt die ausgedruckten Bögen zum physischen Treffen mit, sodass der Mentor (offline, ohne App-Zugang) korrigieren/besprechen kann.

**Bewertungs-Modi pro Aufgabentyp** (überarbeitet, ohne Mentor)

| Typ | Auto | Selbstbewertung | Beim Treffen offline |
|---|---|---|---|
| A1–A6 | ✓ | – | – |
| B1–B4 | – | ✓ (falls Musterlösung vorhanden) | sonst hier |
| C1–C5 | – | – | ✓ |
| D1–D3 | – | – | – (bleibt privat) |
| E1–E3 | ✓ (SRS) | – | optional Vers-Aufsagen |
| E4 | – | ✓ (Häkchen + Notiz) | optional |
| E5 (Wahl) | – | je nach Zweig | je nach Zweig |

### 5.7 Frist-Mechanik & Termine ✦ NEU

- Aufgaben können eine `due_at`-Frist haben (Datum oder relative Lektion: „bis zur Besprechung der 3. Lektion").
- Module/Kurse haben einen Gesamt-Zeitrahmen (Default: 1 Lektion pro Woche, ~6–10 Wochen pro Modul).
- **Sanftes Mahnsystem**: bei überschrittener Frist → Hinweis im Dashboard, kein Sperren.
- Mentor kann Fristen **pro Schüler verschieben** (Krankheit, Urlaub).

### 5.8 Wahlaufgaben (XOR) ✦ NEU

Das Skript zeigt: manche Aufgaben sind alternativ („Ps 139 auswendig **oder** Auslegung schreiben"). Im Datenmodell als Aufgaben-Gruppe mit `min_required` / `max_required` darstellbar (für AND/OR-Logik). MVP: nur strikt 1-aus-N.

### 5.9 Reading Assignments (externe Lektüre) ✦ NEU

Aufgaben des Typs E4 verlinken auf externe Bücher (z. B. „Charles C. Ryrie, *Die Bibel verstehen*, S. 106-107"). In der App:

- Buch + Seitenzahl als strukturierte Felder.
- Schüler hakt ab + kann private Notizen festhalten.
- Lehrer kann optional eine Folge-Frage anhängen, die nach dem Lesen auszufüllen ist.

---

## 6. Gamification, Motivation, Soziales (sanft)

Bewusst zurückhaltend dosiert — die App soll geistlich nicht schädlich wirken.

### 6.1 Sinnvolle Elemente

- Tages-Streak mit Pause-Funktion („Sabbat-Modus" — sonntags zählt nicht negativ)
- Fortschrittsbalken pro Lektion / Lernpfad
- Meilensteine („Du hast 50 Verse mindestens 30 Tage stabil im Gedächtnis.")
- Retention-Score pro Vers/Karte: prozentual geschätzte Behaltenswahrscheinlichkeit *jetzt*
- *Mein Verse-Schatz* — Sammlung der dauerhaft gelernten Verse, schön präsentiert

### 6.2 Eher vermeiden

- Punkte/Coins/Lootboxen-Mechaniken
- Öffentliche Bestenlisten (Wettbewerb passt nicht zum Inhalt)
- Aggressive Push-Erinnerungen mit Schamfaktor („Du hast deine Streak verloren!")

### 6.3 Sozial (optional, Phase 2)

- Gruppen-Lerntreffen: gemeinsam dieselbe Lektion bearbeiten
- Fortschritte mit Hauskreisleiter teilen (opt-in)
- Verse-Patenschaften: zwei Personen lernen denselben Vers und erinnern sich gegenseitig

---

## 7. Architektur — angepasst an Sliplane (max 3 Container)

### 7.1 Sliplane-Eigenheiten

- Hosting in Deutschland (DSGVO-freundlich)
- Pro **Service** (= Container) wird abgerechnet
- Persistente Volumes für Datenbanken werden unterstützt
- HTTPS/Domain-Routing wird von Sliplane übernommen → kein eigener Reverse-Proxy nötig
- Gut geeignet für kleine bis mittlere Apps

→ **Konsequenz**: Wir wollen so wenige Container wie möglich, idealerweise 2.

### 7.2 Empfohlene Container-Aufteilung *(Empfehlung)*

```
┌────────────────────────────────────────────┐
│ Container 1: App (Web + API)               │
│   - Next.js (oder SvelteKit) Fullstack     │
│   - eingebaute API-Routes / Endpoints      │
│   - Auth, Business-Logik, SSR              │
│   - Service-Worker / PWA-Build             │
└────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────┐
│ Container 2: PostgreSQL                    │
│   - alle Nutzerdaten + Inhalte             │
│   - persistentes Volume                    │
└────────────────────────────────────────────┘

(Optional)
┌────────────────────────────────────────────┐
│ Container 3: Worker / Backups / Suche      │
│   - z. B. Cron für Reminder-Mails          │
│   - oder Meilisearch für Volltextsuche     │
│   - oder MinIO für Audio-Dateien           │
└────────────────────────────────────────────┘
```

**Audio-Dateien**: Wenn Audio kommt, Optionen:

1. *(Empfehlung)* Im Container 1 als statische Dateien auf einem Volume — solange Volumen klein ist (< 1 GB).
2. Container 3 als MinIO oder direkter S3-kompatibler Storage.
3. Externer Storage (Hetzner Storage Box, Cloudflare R2 EU) — kein zusätzlicher Container, aber externer Anbieter.

**Cron / E-Mail-Reminder**: Sliplane bietet (Stand Recherche) Scheduled Jobs / Cron-Funktionen. Falls ja → kein dritter Container. Falls nein → entweder als Worker-Container oder per externen Cron-Pinger (z. B. cron-job.org auf einen geschützten Endpoint).

### 7.3 Alternative: Single-Container (1 Container)

Sehr leichtgewichtig, aber:

- SQLite als Datenbank (im selben Container, persistentes Volume)
- Kein Worker, alles im Web-Container
- *Vorteil*: ~50% Kosten, einfachstes Setup
- *Nachteil*: weniger robust (Backups manueller, Performance bei großen Daten begrenzt, Lock-Contention bei vielen parallelen Schreibzugriffen)

→ **Sinnvoll als allerersten Prototyp**, nicht für Produktion mit mehreren Usern.

### 7.4 Backups

Egal welche Variante:

- Tägliches DB-Backup automatisch ziehen (pg_dump in S3-/Storage-Box)
- Mindestens 14 Tage Aufbewahrung
- Disaster-Recovery dokumentiert

---

## 8. Tech-Stack-Empfehlung

### 8.1 Empfohlener Stack *(Empfehlung)*

| Schicht | Technologie | Begründung |
|---|---|---|
| Frontend + Backend | **Next.js 15 (App Router)** oder **SvelteKit** | Beides Fullstack, eines reicht für 1 Container. Next.js: größere Community, mehr Beispiele. SvelteKit: schlanker, leichter zu lernen. |
| Sprache | **TypeScript** | Typensicherheit, weniger Bugs |
| Datenbank | **PostgreSQL 16** | Robuster Standard, frei, perfekt für Sliplane |
| ORM | **Drizzle** *(Empfehlung)* oder Prisma | Drizzle ist leichtgewichtiger, SQL-näher, schnellere Migrations. Prisma ist verbreiteter, aber schwerer. |
| Auth | **Auth.js (NextAuth)** oder **Lucia / BetterAuth** | KEIN Supabase Auth. Auth.js bei Next.js, BetterAuth ist moderner und framework-agnostisch. |
| Mailing | **Resend** oder **Postmark** (Transactional, EU-Region wählen) bzw. eigener SMTP | Für Einladungen, Reminder, Passwort-Reset |
| Validierung | **Zod** | Schema-Validierung Client + Server |
| UI | **Tailwind CSS** + **shadcn/ui** oder **Mantine** | shadcn = copy/paste-Komponenten, voll anpassbar |
| PWA | **next-pwa** / SvelteKit Service Worker | Offline-Lesen, Installieren auf Homescreen |
| Tests | **Vitest** + **Playwright** | Standard |
| Container | Docker (multi-stage build, schlank) | Pflicht für Sliplane |

### 8.2 Empfehlung im Detail: Next.js + Drizzle + Auth.js

Begründung:

- Größte Community → meiste Beispiele für Bibel-/Lern-Use-Cases
- App Router + Server Actions = wenig API-Boilerplate
- Drizzle = schnelle Migrations, lesbarer SQL, gut für Solo-Maintainer
- Auth.js = einfacher Magic-Link-Login per E-Mail, später OAuth (Google/Apple) ergänzbar
- Alles self-hosted, keine US-Cloud-Abhängigkeit für Datenkern

### 8.3 Bewusst NICHT empfohlen

| Tool | Warum nicht |
|---|---|
| Supabase | DSGVO-Bedenken (US-Mutter, Datenflüsse), du hast es explizit abgelehnt |
| Firebase | US-Cloud, gleiches Problem |
| MongoDB Atlas | Datenmodell hier eher relational; Atlas ist US-Cloud |
| Vercel als Host | KV/Postgres-Add-ons sind US-basiert, Edge-Funktionen routen über USA |

### 8.4 Sicherheits-Mindeststandards

- HTTPS überall (Sliplane bringt das)
- Passwort-Hashing mit Argon2id (oder Magic-Link-Login → kein Passwort)
- Rate-Limiting auf Login/Registrierung
- CSRF-Schutz, sichere Cookies (HttpOnly, SameSite=Lax/Strict)
- Content-Security-Policy
- DB-Backups verschlüsselt
- Audit-Log für Admin-Aktionen

---

## 9. Datenmodell (grobe Skizze)

Bewusst vereinfacht. Im MVP startklar, erweiterbar.

```
USERS
  id, email, display_name, role (admin/teacher/learner),
  password_hash | magic_link_token, created_at

GROUPS
  id, name, description
USER_GROUPS  (n:m)
  user_id, group_id, role_in_group

CONTENT_ITEMS                    -- generischer Container, polymorph
  id, type (verse/book/flashcard/quiz_question),
  title, body_json,              -- Inhalt typabhängig
  visibility (private/group/public),
  owner_id, group_id?,
  language, translation_id?,
  created_at, updated_at, version

LESSONS
  id, title, description, owner_id, visibility, group_id?, ordered_items_json

PATHS                            -- Lernpfad / Kurs
  id, title, description, ordered_lessons_json

USER_PROGRESS                    -- SRS-Karte
  id, user_id, content_item_id,
  ease_factor, interval_days, repetitions,
  last_reviewed_at, due_at,
  last_grade,                    -- "again/hard/good/easy"
  total_reviews, correct_reviews

SESSIONS                         -- Lerneinheit (eine Sitzung)
  id, user_id, started_at, ended_at, item_count, correct_count

ASSIGNMENTS                      -- Zuweisung Lehrer→Gruppe/User
  id, lesson_id|path_id, target_user_id|group_id, due_at, assigned_by

BIBLE_BOOKS                      -- Stammdaten (seed)
  id, abbr, name_de, testament, group_name,
  group_color, order_index, chapter_count, summary

BIBLE_TRANSLATIONS               -- Stammdaten
  id, name (z.B. "SCH2000"), full_name, license_info, source

BIBLE_VERSES                     -- nur falls Volltext-Bibel hinterlegt wird
  id, translation_id, book_id, chapter, verse, text
  (große Tabelle ~ 31.000 Verse pro Übersetzung)

AUDIT_LOG
  id, user_id, action, target_id, payload_json, ts
```

Wichtige Designentscheidung:

- **`content_items` polymorph** mit `type` und `body_json` — flexibel für neue Lerntypen, ohne Migration.
- **`user_progress` ist getrennt** von `content_items` — der gleiche Vers kann von 100 Lernern unabhängig getrackt werden.

### 9.1 Erweiterung für Lehrkurse ✦ ÜBERARBEITET

Nach den Festlegungen vom 2026-05-05 ist das Schema deutlich schlanker — keine Mentor-/Review-/Meeting-Tabellen.

```
COURSES
  id, slug, title, description, owner_id,
  visibility, group_id?, version, status (draft/published/archived)

COURSE_MODULES                   -- Themen (Bibliologie, Theologie, ...)
  id, course_id, order_index, title,
  description_md,                -- "Kursbeschreibung" mit Zielen, Aufbau...
  goals_json, recommended_literature_json

COURSE_LESSONS
  id, module_id, order_index, title

COURSE_SECTIONS
  id, lesson_id, order_index, title, intro_md,
  references_json               -- sektions-weite Bibelstellen

TASKS
  id, section_id, order_index,
  type (A1..F2 enum),
  prompt_md,
  references_json,              -- Bibelstellen-Liste
  expected_answer_md,           -- für B-Typ: Musterlösung (optional, leer-tolerant)
  config_json,                  -- typabhängig: Lückenpositionen, Match-Paare, etc.

TASK_GROUPS                     -- für Wahlaufgaben (XOR)
  id, section_id, label,
  min_required, max_required

TASK_GROUP_MEMBERS
  task_group_id, task_id

TASK_ANSWERS                    -- nur privat pro Nutzer
  id, task_id, user_id,
  answer_json,                  -- typabhängig
  is_self_graded?,              -- B-Typ: ok/teils/nochmal lesen
  is_auto_graded_correct?,      -- A-Typ
  updated_at

COURSE_ENROLLMENTS              -- "ich bearbeite diesen Kurs gerade"
  id, user_id, course_id, started_at, last_active_at

READING_LOGS                    -- für E4
  id, task_id, user_id, completed_at, note_md
```

**Was rausgeflogen ist** (wegen „kein Mentor im MVP"):

- ~~`MENTOR_RELATIONSHIPS`~~
- ~~`TASK_REVIEWS`~~
- ~~`MEETINGS` / `MEETING_ITEMS`~~
- ~~`status (submitted/reviewed/needs_revision)`~~ — Antworten werden einfach gespeichert, kein Workflow.
- ~~`is_visible_to_mentor`~~ — D-Typ ist eh privat, andere Antworten gibt's nur für mich.

Das bestehende `content_items` und `user_progress` bleibt für Verse/Karten/Quizze unverändert. Eine `task` vom Typ E1/E2/E3 erzeugt automatisch `content_items` im persönlichen SRS-Stack des Nutzers.

### 9.2 Verse als Lerntext (statt Volltext-Bibel) ✦ NEU

Wegen der Lizenzthematik (Schlachter / Elberfelder rev. sind kostenpflichtig) hinterlegt die App **keine Volltext-Bibel**. Stattdessen:

```
VERSE_LEARN_ITEMS               -- ein einzelner Vers oder Versblock zum Auswendiglernen
  id, owner_id (user_id),
  visibility (private/group/public),
  reference (book_id, chapter, verse_from, verse_to),
  translation (e.g. "SCH2000", "ELB-rev", "ELB-1905", "LU1912"),
  text,                         -- der eingetippte Lerntext
  source_attribution            -- z.B. "© Genfer Bibelgesellschaft"
```

- Privater Nutzer tippt eigene Verse ein → unproblematisch (§ 53 UrhG).
- Lehrer/Admin tippt Verse für die geschlossene Gemeindegruppe → praxistauglich, einmal kurze OK-Mail von Verlagen einholen, Quellenangabe verbindlich.
- Übersetzungs-ID ist Pflichtfeld, damit Quellenangabe automatisch angezeigt werden kann.

---

## 10. UX/UI-Konzept

### 10.1 Design-Prinzipien

- **Lesefreundlich**: serifenbetonte Typo für Bibeltext, große Zeilenhöhe, ruhige Hintergründe.
- **Dunkel-Modus** verfügbar (auch für Andachtszeit am Abend).
- **Mobile-first** (PWA, Daumen-Bedienung).
- **Reduziert**: keine bunten Buttons, keine Dauer-Animationen.
- **Tastatur-bedienbar** (Lerner am Laptop wollen schnell durch Karten klicken).

### 10.2 Hauptscreens (MVP)

1. **Dashboard** — heute fällig, Streak, zugewiesene Lektionen, aktuelle Lernpfade
2. **Lernen** — die eigentliche Lernschleife (eine Karte/Vers nach der anderen)
3. **Bibliothek** — alle verfügbaren Inhalte (eigene + zentrale), filterbar
4. **Editor** (Lehrer) — Lektionen bauen
5. **Mein Profil** — Statistiken, Einstellungen, Übersetzung wählen, Sabbat-Modus
6. **Admin** — User, Gruppen, globale Einstellungen, Audit-Log

### 10.3 Zwei UI-Welten ✦ NEU

Aus den unterschiedlichen Inhaltstypen entstehen zwei deutlich verschiedene Bildschirme:

**Welt A — Lehrkurs-Lese/Arbeits-Modus**
- scrollbare Sektion mit Lehrtext (wie ein Arbeitsblatt am Bildschirm)
- Bibelstellen-Block links (klickbar → Vers-Pop-up)
- Aufgaben inline als Eingabefelder/Checkboxes/Drag&Drop
- Status pro Aufgabe sichtbar (offen/eingereicht/korrigiert)
- „Speichern & weiter" / „Einreichen" / „Zur Besprechung markieren"
- Druck-/PDF-Export der eigenen ausgefüllten Lektion (Eltern oder Mentor wollen evtl. Papier)

**Welt B — Lern-Stack (SRS)**
- Karte für Karte, fokussiert
- große Schrift, Daumen-bedienbar
- Schaltfläche „Wieder/Schwer/Gut/Einfach"
- Lernmodus-Slider (siehe 10.4)

Übergang: Im Dashboard sieht der Lerner beides nebeneinander: „Heute zu lernen: 8 Karten" + „Aktuelle Lektion: Bibliologie · Sektion d) Sprachen".

### 10.4 Lern-Modus-Schaltfläche (zentrale UX-Idee)

Beim Lernen eines Verses kann der Lerner per Slider wählen:

```
[ Lesen ] [ Lücken ] [ Anfangsbuchstaben ] [ Tippen ] [ Audio ]
```

Standardmäßig adaptiv (System schlägt nächste Stufe vor), aber jederzeit manuell überschreibbar.

---

## 11. DSGVO, Lizenzen, Bibelübersetzungen

### 11.1 DSGVO-Punkte

- Hosting in DE (Sliplane) ✓
- Datenkern (DB) ebenfalls in DE ✓
- Auftragsverarbeitungsvertrag (AVV) mit Sliplane einholen
- Privacy Policy: welche Daten werden warum gespeichert
- Login per Magic-Link (ohne Passwort) reduziert Sicherheitsrisiko
- Account-Löschung muss möglich sein (kein Soft-Delete, sondern echte Anonymisierung)
- Cookie-Banner: nötig nur falls nicht-essentielle Cookies (würde ich vermeiden → kein Banner)
- Drittanbieter (Mailing, evtl. Audio-Storage) DSGVO-konform wählen, AVV abschließen
- Tracking/Analytics: nur **selbst gehostet**, z. B. Plausible self-hosted oder Umami in Container 3 — oder gar keins für MVP

### 11.2 Lizenz-Themen Bibelübersetzungen — kritisch!

Das ist der wichtigste rechtliche Punkt.

| Übersetzung | Lizenzstatus | Kosten | Hinweise |
|---|---|---|---|
| **Schlachter 2000** | Geschützt (CLV / Genfer Bibelgesellschaft) | Lizenzgebühr / API-Vertrag | **Verlag direkt anfragen.** API: keine offizielle, evtl. Texte als XML lizenzieren. |
| **Elberfelder revidiert** | Geschützt (SCM R. Brockhaus / CSV) | Lizenzgebühr | API: API.bible (Crossway) bietet Elberfelder evtl. an, Vertrag prüfen. |
| **Elberfelder unrevidiert (1905)** | **Public Domain** | kostenlos | Sofort nutzbar, frei verteilbar. Sehr nah an Elberfelder-Stil. |
| **Luther 1912** | Public Domain | kostenlos | „NeueLuther" / Volxbibel etc. eigene Lizenzen prüfen. |
| **Luther 2017** | Geschützt (EKD / Deutsche Bibelgesellschaft) | Lizenzgebühr | Anfrage über Bibelgesellschaft, bei nichtkommerzieller Gemeinde-Nutzung gibt es teilweise reduzierte Kondition. |

**Empfehlung für MVP**:

1. Mit **Elberfelder 1905 (Public Domain)** und **Luther 1912 (Public Domain)** starten — keine Lizenzkosten, sofort live.
2. Parallel **Schlachter 2000** und **Elberfelder revidiert** lizenzieren (Anfrage Verlage). Sobald Verträge da sind, einspielen.
3. Inhalte sind übersetzungs-agnostisch gespeichert (nur Versreferenz). Beim Lernen wird der Volltext zur Laufzeit aus der gewählten Übersetzung gezogen.

### 11.3 API-Quellen für Bibel-Volltext

- **API.bible** (Crossway) — viele deutsche Übersetzungen, kostenlos für non-profit, aber externer Dienst (DSGVO prüfen).
- **Open Bible Data** / **Door43** — freie Datensätze mit PD-Übersetzungen.
- **Eigener Import** — XML/USFM-Dump einmalig importieren, dann komplett offline. *(Empfehlung für Datenhoheit)*.

### 11.4 Audio

- Selbst eingesprochene Audios der Lehrer sind unproblematisch (Urheber = Lehrer).
- Fremde Audio-Bibeln (z. B. Hörbibeln) lizenzpflichtig.
- Browser-TTS (Speech-Synthesis-API) als Fallback ohne Lizenzproblem, klingt aber „mechanisch".

---

## 12. Roadmap / MVP-Vorschlag

### Phase 0 — Fundament (Woche 1–2)

- Repo-Setup (Next.js + TypeScript + Drizzle + Tailwind + shadcn/ui)
- Docker-Build, Sliplane-Deployment „hello world"
- DB-Schema initial, Migrations
- Auth (Magic-Link)
- Bibel-Stammdaten importieren (66 Bücher, 1–2 PD-Übersetzungen)

### Phase 1 — MVP (Woche 3–6) ✦ schlanker geworden

Ohne Mentor-Workflow ist das MVP wieder kompakt:

- User-Verwaltung (Admin-UI), Magic-Link-Login
- **Lehrkurs-Datenmodell** (Course → Module → Lesson → Section → Task)
- **Lehrkurs-Editor** für Samuel als Admin (Markdown-Sektionen, Bibelstellen-Referenzen, Aufgaben anlegen)
- **Aufgabentypen MVP**: A1 (R/F), A2 (Lückentext), A3 (Match), B1 (kurze offene Frage), C1 (lange offene Antwort), E1 (Vers auswendig), E4 (Reading Assignment)
- **Selbststudium-Modus**: Lektion bearbeiten, Antworten privat speichern, Auto-Bewertung für A-Typ, Selbsteinschätzung für B-Typ
- **Druckfunktion** für ausgefüllte Lektion (PDF im Skript-Layout)
- Bibelvers-Lernen mit 3 Modi: Lesen, Lückentext, Anfangsbuchstaben
- SM-2 SRS-Engine (für Verse & Bücher-Reihenfolge)
- Reihenfolge-biblischer-Bücher-Übung (Drag&Drop)
- Dashboard: Tagesfälligkeit + aktuelle Lektion
- PWA-Manifest + Service Worker (Lesen offline)
- **Seed-Daten**: 66 Bibelbücher, ~10 Schlüsselverse aus dem Skript, das erste Modul (Bibliologie) als Pilot-Kurs

→ **Damit kann ein Schüler den biblischen Unterricht im Selbststudium durcharbeiten, lernt Verse, druckt seine Lektion zum Treffen aus.**

### Phase 2 — Erweitert (Monat 2–3)

- Restliche Aufgabentypen: A4 (Tabelle), A5 (Reihenfolge generisch), A6 (Multiple Choice), B2–B4, C2–C5, D1–D3, E2 (Versblock), E3 (Bücher als E-Aufgabe), E5 (Wahlaufgabe), F1/F2
- Restliche Skript-Module (Theologie bis Eschatologie) als Inhalte einpflegen
- Karteikarten-Modul (generisch, eigenständig)
- Quiz-Modul (eigenständig, außerhalb von Kursen)
- Audio-Upload + Diktat-Modus
- Tipp-Modus mit Live-Feedback
- Gruppen-Funktion (mehrere Kurse für mehrere Gruppen)
- Statistik für Admin (welche Aufgabe ist schwer, wer arbeitet aktiv)
- E-Mail-Reminder (sanft)
- Volltextsuche in Inhalten

### Phase 3 — Politur & optionale Mentor-Funktion (Monat 4+)

- FSRS-Algorithmus als Option
- **Optional: Mentor-Modul nachrüsten**, falls sich herausstellt, dass digitale Kommentare am Antworten doch hilfreich wären (in `INHALTSANALYSE.md` Kap. 4 dokumentiert, Datenmodell vorbereitbar)
- Mehr Übersetzungen (sobald Lizenzen geklärt)
- Lernpfade / Kurs-Struktur (mehrere Kurse zu einem Pfad bündeln)
- Optional: Öffnung für Selbstregistrierung (Phase 2 der Zielgruppe)

### Phase 3 — Politur (Monat 4+)

- FSRS-Algorithmus als Option
- Lernpfade / Kurs-Struktur
- Eigene Inhalte zur Veröffentlichung vorschlagen (Workflow)
- Mehr Übersetzungen (sobald Lizenzen geklärt)
- Optional Öffnung für Selbstregistrierung (Phase 2 der Zielgruppe)

### Phase 4 — Optional (später)

- Hebräisch/Griechisch-Vokabel-Modul
- Mobile Native-Apps (React Native, geteiltes Backend)
- Sozial-Features
- Mehrere Bibel-Lehre-Instanzen / Mandantenfähigkeit

---

## 13. Offene Entscheidungen — Stand nach Runde 2026-05-05

### 13.1 ✓ Entschieden

| # | Frage | Entscheidung |
|---|---|---|
| 3 | Auth-Art | **Magic-Link** (einfach, sicher, ohne Passwort-Pflege) |
| 4 | Mailing-Provider | **Resend EU** für MVP |
| 5 | Übersetzungen MVP | **Nur Schlachter 2000 + Elberfelder rev.**, eingetippt als Lerntexte (keine Volltext-Bibel) |
| 6 | Audio im MVP | **Nein**, Phase 2 |
| 7 | Bestenlisten/Punkte | **Nein** |
| 8 | Sabbat-Modus | **Konfigurierbar, default an** |
| 9 | Apokryphen | **Nein** im MVP |
| 10 | Audit-Log | **Nur Admin-Aktionen** |
| 11 | Mehrsprachigkeit | **Nur DE** im MVP, i18n vorbereitet |
| 12 | Domain & Branding | **bib-inside.de**, Name „Bib-Inside" |
| 13 | Mentor-Schüler-Kommunikation | **Nicht Teil des MVP** |
| 14 | Wo finden Treffen statt | **Physisch, außerhalb der App** |
| 16 | „Bestanden"-Konzept | **Nein.** Liebevolle Einschätzung & Ermutigung statt Note |
| 18 | Theologische Position als Tag | **Nein** — eine Position (eure), keine Tags |
| 19 | Musterlösungen für B-Typ | **Optional, leer-tolerant** — Samuel pflegt sie nach und nach |

### 13.2 ✓ Entschieden (Runde 2)

| # | Frage | Entscheidung |
|---|---|---|
| 1 | Frontend-Framework | **Next.js 15** (App Router, TypeScript) |
| 2 | UI-Library | **shadcn/ui** (Tailwind-basiert, copy/paste-Komponenten) |
| 17 | Versionierung von Kursen | **Antworten an Kursversion gepinnt** — Lerner sieht weiterhin die Version, an der er gearbeitet hat. Optional Hinweis bei Update. |
| 21 | Verlags-Mails | **Claude erstellt Vorlagen, Samuel sendet** — siehe `lizenz-anfragen/` |
| 22 | Erste Tester | **Samuel + 1–2 Vertrauenspersonen** aus der Gemeinde |
| 23 | PDF-Druck-Layout | **Eigenes, modernes Layout** — strukturell vertraut, typografisch sauber |
| 24 | Code-Repo | **GitHub privat** — Auto-Deploy nach Sliplane bei Push |
| 25 | Domain-Status | **Noch zu registrieren** (z. B. INWX, Hetzner) — DNS-Anleitung in `docs/dns-setup.md` |
| 26 | Erstlieferung | **Lizenz-Mails + Repo-Skelett + DB-Schema parallel** |

### 13.3 Tatsächlich noch offen — keine

Alle Entscheidungspunkte sind beantwortet. Falls neue Fragen auftauchen, kommen sie hier rein.

---

## 14. Referenzen und Inspiration

**Bibel-Memorier-Apps zum Anschauen**

- *Remember Me — Bible Verses* (sehr saubere Anfangsbuchstaben-Modi)
- *VerseLocker*
- *Bible Memory* (Crossway)
- *Scripture Typer*

**Lern-Apps mit gutem SRS**

- Anki — Goldstandard SRS
- RemNote — verbindet Notizen mit SRS
- Quizlet — gute Drag&Drop-/Match-Übungen
- Memrise — Mehrsinnliches Lernen

**Lernpsychologie-Quellen (für die didaktische Begründung)**

- Roediger & Karpicke 2006 — *Test-enhanced learning*
- Kornell & Bjork 2008 — *Spacing effect*
- Wozniak — Originalpapers zu SM-2
- FSRS-Paper, Open Spaced Repetition (Github)

---

## Nächste Schritte

1. Diese Doku gemeinsam durchgehen, Kapitel 13 abklopfen.
2. Verlage anschreiben für Schlachter 2000 / Elberfelder revidiert.
3. Sliplane-Account einrichten, kleine Test-Deployment-Pipeline.
4. Phase 0 starten.

— Ende des Konzepts —
