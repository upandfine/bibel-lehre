# Inhaltsanalyse — Biblischer Unterricht 2013 (Teilnehmer-Skript)

> Auswertung des bereitgestellten PDFs als konkrete Vorlage für das Datenmodell und die Aufgabentypen der Bibel-Lehre-App.
> Quelle: *Biblischer Unterricht für die Gemeinde, 5. Fassung, Jan 2013, Erstfassung Ewald Gerber, Evangeliums-Christengemeinde Paderborn*
> Stand: 2026-05-05

Diese Analyse ist die **didaktische Realität**, an der sich die App messen muss. Wenn die App diesen Kurs sauber abbildet (inklusive Mentor-Workflow), kann sie auch alles andere.

---

## 1. Makrostruktur des Kurses

```
Kurs „Systematische Theologie"
├── Kursbeschreibung (Ziele, Methodik, Aufgaben, Teilnehmer)
└── 10 Themen (Module)
    ├── 01 Bibliologie — Die Lehre über die Bibel
    ├── 02 Theologie — Die Lehre über Gott
    ├── 03 Angelologie — Die Lehre über die Engel
    ├── 04 Satanologie — Die Lehre über Satan
    ├── 05 Dämonologie — Die Lehre über die Dämonen
    ├── 06 Anthropologie — Die Lehre über den Menschen
    ├── 07 Christologie — Die Lehre über Christus
    ├── 08 Soteriologie — Die Lehre über das Heil
    ├── 09 Pneumatologie — Die Lehre über den Heiligen Geist
    └── 10 Eschatologie — Die Lehre von den Letzten Dingen
        └── Pro Thema: Kursbeschreibung + 1–3 Lektionen
            └── Pro Lektion: a, b, c, … Sektionen
                └── Pro Sektion: Einleitungstext + Bibelstellen + 1–N Aufgaben
```

Jedes Thema hat denselben Header:

- **Ziele** (4–5 Stichpunkte, was der Schüler am Ende kann)
- **Aufbau** (welche Lektionen, welche Sektionen darin)
- **Aufgaben** (übergreifende Pflichten: auswendig lernen, Auslegung schreiben, Reihenfolge der Bücher etc., oft mit Frist)
- **Literatur** (echte Buchempfehlungen)

---

## 2. Layout-Muster jeder Sektion

Aus dem Skript wiederholt sich folgendes Layout:

```
┌─────────────────────┬──────────────────────────────────────────┐
│ Linke Spalte        │ Rechte Spalte                            │
├─────────────────────┼──────────────────────────────────────────┤
│ (Sektions-Titel)    │ Einleitungstext / Lehrtext               │
│                     │                                          │
│ 2. Tim 3,16         │ Aufgabe / Frage:                         │
│ 1. Petr 1,21        │ „Wer ist laut diesen Bibelstellen        │
│ Hebr 1,1+2          │  der Autor der Bibel?"                   │
│                     │ ┌──────────────────────────────────────┐ │
│                     │ │ (graue Antwortbox)                   │ │
│                     │ └──────────────────────────────────────┘ │
└─────────────────────┴──────────────────────────────────────────┘
```

Wichtige Beobachtungen:

- Bibelstellen sind **links** als Block neben einer Aufgabe — nicht inline im Text. → Im UI ein eigener „Bibelstellen-Block" links/oben mit Klick-zum-Aufschlagen.
- Eine Aufgabe kann **mehrere Bibelstellen** auf einmal referenzieren.
- Antwortboxen sind **unterschiedlich groß** — Skript signalisiert „kurz" vs. „ausführlich" über Boxenhöhe.
- Innerhalb einer Sektion folgen oft **mehrere Aufgaben hintereinander**, jede mit eigenem Bibelstellen-Block.

---

## 3. Aufgabentypen — Inventar (mit Beispielen aus dem PDF)

### A. Auto-bewertbar (System kann Korrektheit prüfen)

| Typ | Beispiel aus dem PDF | Hinweis |
|---|---|---|
| **A1 Wahr/Falsch (R/F)** | „Die Elberfelder Bibel ist mehr inspirierter als die Lutherbibel." | mehrere Aussagen am Stück |
| **A2 Lückentext (Cloze)** | „Die ___________ ist die wichtigste Offenbarung. Außer ihr gibt es ___ andere ___________ Offenbarungen." | mit Wortbank oder freier Eingabe |
| **A3 Match / Zuordnung** | „Sortiere die nachfolgenden Bibelstellen zu der passenden Offenbarung." (5 Offenbarungen → mehrere Bibelstellen) | Drag&Drop |
| **A4 Tabelle ausfüllen (multi-spalt)** | „Bibelstelle / Eigenschaft / Definition" — 11 Zeilen, Schüler füllt 2 Spalten | Lehrer hinterlegt Musterlösung |
| **A5 Reihenfolge biblischer Bücher** | „Die Reihenfolge der biblischen Bücher ist auswendig zu lernen" (Aufgabe in Bibliologie) | eigener Drag&Drop-Modus |
| **A6 Multiple Choice / Single Choice** | (im PDF selten explizit, aber angedeutet) | für Quizze |

### B. Halbautomatisch / Selbstbewertet (Musterlösung anzeigbar)

| Typ | Beispiel aus dem PDF | Hinweis |
|---|---|---|
| **B1 Kurze offene Frage** | „Was ist die Septuaginta (auch LXX genannt)?" | Lehrer hinterlegt Erwartung; Schüler vergleicht selbst |
| **B2 Aufzählung / Liste** | „Welche Bibelübersetzungen entstanden in den ersten Jahrhunderten?" | Stichwortliste; Schnittmenge prüfbar |
| **B3 Definition geben** | „Versuche mit eigenen Worten die Definition wiederzugeben." (Sünde, Inspiration) | Lehrer-Musterantwort als Vergleich |
| **B4 Bibelstelle → Aussage extrahieren** | „Was sagt Joh 10,30 über die Gottheit Jesu?" | Vers + Erwartungs-Skizze hinterlegen |

### C. Mentor-bewertet (qualitativ, nicht binär richtig/falsch)

| Typ | Beispiel aus dem PDF | Hinweis |
|---|---|---|
| **C1 Lange offene Antwort / Argumentation** | „Versuche so viele Argumente für eine 6-Tage-Schöpfung zu nennen." | Lehrer kommentiert |
| **C2 Auslegung / Essay** | „Eine Auslegung zu dem ganzen Psalm schreiben (2 DIN-A4-Seiten)" | Datei-Upload oder Editor |
| **C3 Vergleichen / Verbindung herstellen** | „Wenn du 1. Joh 3,4 und Garten Eden in Verbindung siehst, was bewirkt die Sünde…?" | Lehrer-Review |
| **C4 Anwendungsfrage / Hypothetisch** | „Stell dir vor, ein Kollege fragt: ‚Warum glaubst du, dass die Bibel wahr ist?' Was würdest du antworten?" | Lehrer-Review |
| **C5 Zusammenfassung** | „Fasse in kurzen Sätzen zusammen, was du über den Fall des Menschen gelernt hast." | Lehrer-Review |

### D. Persönliche Reflexion (privat, nicht eingereicht)

| Typ | Beispiel aus dem PDF | Hinweis |
|---|---|---|
| **D1 Persönliche Bedeutung** | „Welche Eigenschaft Gottes fasziniert dich am meisten und warum?" | wie ein privates Tagebuch |
| **D2 Persönliche Auswirkung** | „Welche Auswirkungen bringt die Inspiration für dich persönlich?" | nur sichtbar für den Lerner selbst |
| **D3 Persönliche Begeisterung** | „Was begeistert dich am meisten, wenn du über Christus nachdenkst?" | optional teilbar mit Mentor |

### E. Verhaltens-/Auswendig-Aufgaben (über mehrere Sitzungen)

| Typ | Beispiel aus dem PDF | Hinweis |
|---|---|---|
| **E1 Vers auswendig** | „2. Tim 3,16 und Hebr 4,12 sind auswendig zu lernen. Termin: bei Besprechung der 3. Lektion." | nutzt SRS + Übungsmodi |
| **E2 Längeren Text auswendig** | „Phil 2,5–11 sind auswendig zu lernen." / „Ps 139,1–18 auswendig" | mehrere Verse als Block |
| **E3 Reihenfolge auswendig** | „Die Reihenfolge der biblischen Bücher" | eigener Übungsmodus |
| **E4 Reading Assignment (extern)** | „Lies Seiten 13–18 und 38–49 aus dem Buch ‚So entstand die Bibel'" | Buch nicht in App; Häkchen + Notizen |
| **E5 Wahlaufgabe** | „Eine der beiden folgenden Aufgaben muss bis Lektion 3 erledigt sein: a) Ps 139 auswendig **ODER** b) Auslegung schreiben" | XOR-Zweig |

### F. Sonstiges

| Typ | Beispiel aus dem PDF | Hinweis |
|---|---|---|
| **F1 Externe Recherche** | „Versuche mit Hilfe von Wörterbüchern/Lexika zu erklären, was Traduzianismus über den Ursprung der Seele sagt." | App verlinkt nicht, aber Lerner kann Quelle nennen |
| **F2 Zentrale Frage zum Nachdenken** | „Eine Frage zum Nachdenken! Gibt es Unwahrheiten in der Bibel?" | offen, kann zu Mentor-Gespräch eskaliert werden |

---

## 4. Mentor-/Schüler-Workflow

Aus der Kursbeschreibung im PDF:

- **1 Mentor : 2–4 Schüler** (entweder einzeln oder in Kleingruppen)
- **Selbststudium ist Hauptarbeit** — der Schüler arbeitet die Arbeitsblätter alleine durch
- **Treffen alle ~2 Monate** zum Austausch
- **Auswertungstreffen** nach Abschluss jedes Kurses
- **Zeitrahmen**: 1–2 Stunden Arbeit pro Woche, ungefähr 1 Lektion pro Woche
- **Frist-Mechanik**: einzelne Aufgaben („auswendig bis Lektion 3", „Auslegung bis Lektion 3")
- **Mentor kann zusätzliche Lektionen einfügen**, andere Lehrer einladen
- **Vor-Voraussetzung**: bei Neubekehrten Glaubensgrundkurs + DLM-Kurs

→ **Konsequenzen für die App**:

- Eine **Mentor-Beziehung** zwischen User und User (1:n), unabhängig von der Gruppen-Struktur.
- Mentor sieht **Bearbeitungsstand** seiner Schüler pro Sektion (nicht angefangen / in Arbeit / eingereicht / korrigiert).
- Mentor kann **Kommentare an Antworten** hängen.
- Schüler kann eine Antwort **als „bereit zum Besprechen" markieren** → erscheint in Mentors Inbox.
- **Treffen vorbereiten**-Ansicht: „Diese Antworten/Fragen wollen wir beim nächsten Treffen besprechen." Liste, druckbar.
- **Kurs-Auswertung** als eigene Aufgabe am Kursende (Fragebogen).
- **Frist pro Aufgabe** (`due_at`) und **Frist pro Kurs/Lektion**.

---

## 5. Bibelstellen — Verschachtelung mit Aufgaben

Im PDF stehen Bibelstellen *neben* Aufgaben, nicht im Fließtext. In der App heißt das:

- Eine `Aufgabe` hat **0..N Bibelstellen-Referenzen** als strukturiertes Feld (Buch, Kapitel, Versanfang, Versende).
- UI: Bibelstellen werden als Chips links/oben dargestellt. Klick öffnet einen Lesepane mit dem Vers in der gewählten Übersetzung.
- Die Sektion selbst kann auch eigene Bibelstellen haben (Sektions-Vorspann), unabhängig von einzelnen Aufgaben.
- Falls eine Aufgabe das **Auswendiglernen** dieser Stelle vorgibt → Verknüpfung zu E1/E2 (siehe oben).

---

## 6. Was das für die zentrale App-Architektur bedeutet

### 6.1 Inhaltstyp „Lehrkurs" als First-Class-Citizen

Im ersten Konzept hatte ich „Karteikarten / Quiz / Verse" als Lerntypen. Die PDF-Realität zeigt: das reicht nicht. Wir brauchen einen **strukturierten Lehrkurs-Inhaltstyp**, der genau so aussieht:

```
Course
  └─ Modules (Themen, z.B. „Bibliologie")
      ├─ Course Description (Ziele, Aufbau, Aufgaben, Literatur)
      └─ Lessons
          └─ Sections (a, b, c, …)
              ├─ Intro Text
              ├─ References (Bibelstellen optional)
              └─ Tasks
                  ├─ Task Type (A1…F2)
                  ├─ Prompt
                  ├─ References (Bibelstellen)
                  ├─ Expected Answer / Rubric (für Lehrer)
                  ├─ Due Date / Termin (optional)
                  └─ Visibility / Bewertungs-Modus
```

### 6.2 Generische SRS bleibt — aber nur für E1/E2/E3

Spaced Repetition macht für Verse, Reihenfolge, Vokabeln, Begriffe Sinn. **Nicht** für Auslegungen oder Reflexionsfragen. Die SRS-Engine läuft also nur über:

- Verse (E1/E2)
- Reihenfolge biblischer Bücher (E3)
- Karteikarten / Begriffe / Definitionen (separates Modul)
- Optional: A1/A2/A6-Quizfragen, wenn der Lerner sie für Wiederholung markiert

Lehrkurs-Aufgaben (B–D) laufen **linear** entlang der Sektionen, nicht im Wiederholungs-Stack.

### 6.3 Zwei verschiedene UI-Welten

- **Lehrkurs-Modus**: scrollbare Sektion, Aufgaben werden bearbeitet, Antworten gespeichert, irgendwann eingereicht/besprochen.
- **Lern-Modus** (SRS): Karte für Karte, kurz, fokussiert, Daumen-bedienbar.

Der Lehrkurs *speist* den Lern-Modus mit neuen Karten (Verse zum Auswendiglernen, ggf. Begriffe).

---

## 7. Konkrete Beispiel-Items für die App (Seed-Daten)

Wenn wir den PDF-Kurs digital abbilden, fallen aus dem ersten Drittel allein heraus:

- **66 Bibelbücher** (für Reihenfolge-Übung) — Stammdaten
- **Verse zum Auswendiglernen**: 2. Tim 3,16; Hebr 4,12; Ps 139,1–18; Phil 2,5–11; Röm 3,23 + 1 Wahlvers (Hiob 7,17 / Ps 8,4 / Ps 144,3)
- **Begriffs-Karteikarten**: Septuaginta, Wulfila, Erbsünde, Traduzianismus, Stellvertretung, Versöhnung, Sühneopfer, Erlösung
- **Theologische Eigenschaften Gottes** (~12 Begriffe + Definition + Bibelstelle): Allmacht, Allgegenwart, Allwissenheit, Ewigkeit, Einheit, Gerechtigkeit, Heiligkeit, Liebe, Unveränderlichkeit, Wahrhaftigkeit, Barmherzigkeit, Treue
- **5 allgemeine Offenbarungen Gottes** (Sortier-/Match-Aufgabe)
- **3 Hauptnamen Gottes im AT** (El, Jahwe, Adonai) + Erweiterungen (~7 weitere)

→ Diese Inhalte können als „Seed-Set" gleich zum App-Start mitgeliefert werden.

---

## 8. Lücken / unklare Punkte aus dem PDF

Was die PDF nicht auflöst (und wir entscheiden müssen):

1. **Lösungen** sind im Teilnehmer-Skript bewusst nicht enthalten. Wir bräuchten das **Mentor-/Lehrer-Skript** (oder eigene Musterlösungen) für B-Typ-Aufgaben.
2. **Wie sehen Treffen ab?** — Findet der Austausch in der App statt (Chat, Kommentar) oder bleibt er physisch/Zoom?
3. **Anonymität** — Sieht der Mentor andere Mentoren? Sehen sich Schüler untereinander?
4. **Notenvergabe / Bestehen** — gibt es ein „Bestanden" pro Modul oder rein qualitative Rückmeldung?
5. **Versionierung des Kurs-PDFs** — die Datei ist „5. Fassung". Wenn der Inhalt fortgeschrieben wird, müssen Schüler-Antworten an alten Versionen erhalten bleiben.
6. **Dispensation/Theologische Position** — der Kurs hat klar erkennbare theologische Positionen (Schöpfung in 6×24h, Erbsünde, Entrückung+Tausendjähriges Reich). Diese müssen als Inhalts-Eigenschaft hinterlegt sein, weil die App theoretisch auch andere Gemeinden bedienen könnte.

→ Diese Punkte landen in der **offenen Entscheidungen**-Liste der Hauptdoku.

---

## 9. Was die Konzept-Doku jetzt anpassen muss

In `KONZEPT.md` ergänzen / korrigieren:

- **Kapitel 3** (Lerninhalte): zusätzlich „Strukturierte Lehrkurse" als 5. Domäne, prominent als **Haupt-Use-Case**.
- **Kapitel 4** (Lernmethoden): Aufgabentypen-Inventar (A–F) übernehmen.
- **Kapitel 5** (Lernaufgaben verwalten): Mentor-Workflow, Frist-Mechanik, Wahlaufgaben, Reading Assignments.
- **Kapitel 9** (Datenmodell): `courses`, `modules`, `sections`, `tasks`, `task_answers`, `mentor_relationships`, `references`, `assignments_choices` (Wahl).
- **Kapitel 10** (UX/UI): Zwei UI-Welten (Lehrkurs-Lese-Modus vs. Lern-Stack).
- **Kapitel 12** (Roadmap): Phase 1 muss mindestens A1, B1, C1 + E1 abdecken — sonst lässt sich der Beispiel-Kurs nicht digital nachfahren.
- **Kapitel 13** (offene Entscheidungen): Punkte 1–6 aus Abschnitt 8 oben.
