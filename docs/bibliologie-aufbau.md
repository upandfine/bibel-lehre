# Bibliologie — Vorbereitung der ersten Lektion als Seed

Notizen aus dem Skript „Biblischer Unterricht für die Gemeinde" (5. Fassung
2013), als Vorbereitung für die Implementierung des ersten Lehrkurs-Moduls
in der App. **Keine Code-Änderungen** in dieser Datei — sie dient nur als
Referenz für die nächste Iteration.

## Gesamtkurs auf einen Blick

Der Kurs umfasst **10 Module** systematischer Theologie:

| # | Modul | Lektionen | Sektionen | PDF-Seiten |
|---|---|---|---|---|
| 1 | **Bibliologie** — Die Lehre über die Bibel | 3 | 9 | 7–18 |
| 2 | Theologie — Die Lehre über Gott | 2 | 6 | 19–26 |
| 3 | Angelologie — Die Lehre über die Engel | 1 | 4 | 27–30 |
| 4 | Satanologie — Die Lehre über Satan | 1 | 3 | 31–34 |
| 5 | Dämonologie — Die Lehre über die Dämonen | 1 | 3 | 35–37 |
| 6 | Anthropologie — Die Lehre über den Menschen | 3 | 6 | 38–45 |
| 7 | Christologie — Die Lehre über Christus | 3 | 5 | 46–53 |
| 8 | Soteriologie — Die Lehre über das Heil | 3 | 6 | 54–62 |
| 9 | Pneumatologie — Die Lehre über den Heiligen Geist | 1 | 3 | 63–67 |
| 10 | Eschatologie — Die Lehre von den Letzten Dingen | 3 | 7 | 68–79 |

## Struktur eines Moduls

Jedes Modul folgt dem gleichen Aufbau:

1. **Kursbeschreibung** — Ziele · Aufbau · Aufgaben · Literatur
2. **Lektionen** (I., II., III.)
3. Pro Lektion: nummerierte **Sektionen** (a, b, c …)
4. Pro Sektion: **Lehrtext** und/oder **Aufgabe**

Das passt 1:1 zu unserem Schema: `courses` → `course_modules` → `course_lessons` → `course_sections` → `tasks`.

## Modul 1 — Bibliologie

### Kursbeschreibung

**Ziele:**
- Aufbau und Gliederung der Bibel kennen
- Inspiration erklären können
- Überblick über die Entstehung des Kanons
- Prinzipien für den Umgang mit der Bibel lernen

**Aufgaben (über das ganze Modul):**
- Arbeitszettel pro Lektion bearbeiten
- **Reihenfolge der biblischen Bücher auswendig lernen** (= unser `E3_order_memorize`, durch die Übung „Bücher der Bibel" schon verfügbar)
- **2. Tim 3,16** und **Hebr 4,12** auswendig lernen (= `E1_verse_memorize`)

**Literatur** (kann als `recommendedLiterature` jsonb-Array im `course_modules` abgelegt werden):
- Charles C. Ryrie, *Die Bibel verstehen, Teil III: Die Bibel: Gottes Wort*, Christliche Verlagsgesellschaft Dillenburg
- *Chicago-Erklärung zur Irrtumslosigkeit der Bibel*, Verlag Bibel + Gemeinde
- Gordon D. Fee / Douglas Stuart, *Effektives Bibelstudium*, ICI
- H. G. Hendricks / W. D. Hendricks, *Bibellesen mit Gewinn*, Christliche Verlagsgesellschaft Dillenburg
- Heinrich Epp, *Hermeneutik: Prinzipien und Methoden der Schriftauslegung*, Christliche Verlagsbuchhandlung Paderborn
- *So entstand die Bibel*, CLV
- Stephan Holthaus / K.-H. Vanheiden, *Die Unfehlbarkeit und Irrtumslosigkeit der Bibel*, Bibelbund-Verlag

### Lektion 1 — Allgemeines + Inspiration

Sektionen:

#### a) Allgemeines zur Bibel
- **Inhalt:** Lese-Text (Bibel = 66 Bücher, 1500 Jahre, 40 Verfasser, Selbstoffenbarung Gottes).
- **Aufgabe:** keine — nur lesen.
- **Schema:** `course_sections.contentMd` ohne zugehörige `tasks`.

#### b) Namen der Bibel
- **Inhalt:** Erklärt Etymologie „Bibel" (gr. „Bücher", lat. „Buch").
- **Aufgabe:** „Nenne mindestens 2 weitere Namen mit Bibelstelle und kurzer Erklärung."
- **Aufgabentyp:** `B1_short_open` — kurze offene Antwort (Tabelle).

#### c) Einteilung der Bibel
- **Inhalt:** AT und NT haben Unterteilungen.
- **Aufgabe:** Tabelle ausfüllen — Bücher den Untergruppen zuordnen.
- **Aufgabentyp:** `A4_table` (oder `A3_match`). **Hinweis:** wir haben dafür schon die Daten im Schema — `bible_books.group_name`. Die App kennt die Antworten also bereits.

#### d) Sprachen der Bibel
- **Inhalt:** Bibel ist mehrsprachig (Hebräisch, Aramäisch, Griechisch).
- **Aufgabe:** Bibelstellen ihrer Grundsprache zuordnen — `1. Mose 1,1-10`, `Dan 2,4 – 7,28`, `Lk 9, 7-9`.
- **Aufgabentyp:** `A3_match`.

#### e) Bedeutung der Bibel
- **Inhalt:** Bibel als Offenbarung; Bilder/Metaphern in der Bibel selbst.
- **Aufgabe:** zu mehreren Bibelstellen das Bild und die Bedeutung angeben (Beispiel im Skript: Ps 119,105 = Licht, erhellt unseren Weg).
- Stellen: Jer 23,29 · Jak 1,22-23 · Mt 4,4 · Lk 8,11
- **Aufgabentyp:** `B1_short_open` als Tabelle, je Stelle ein Eintrag.

#### f) Inspiration der Bibel
Mehrere Sub-Aufgaben:

1. **„Wer ist laut diesen Bibelstellen der Autor der Bibel?"** (2.Tim 3,16; 2.Petr 1,21; Hebr 1,1+2)
   - `B1_short_open`
2. **Diktat-Theorie prüfen** anhand von 5.Mo 9,10; Lk 1,1-4; Hebr 1,1+2; Tit 1,12+13.
   - `C1_long_open` — Argumentation
3. **Eigene Erklärung der Inspiration** anhand der mitgelieferten Definition (Heinz Weber).
   - `B1_short_open`
4. **Vier Richtig/Falsch-Aussagen:**
   - „Die Elberfelder Bibel ist mehr inspirierter als die Lutherbibel."
   - „Meine Bibel zuhause kann Fehler und Ungenauigkeiten enthalten."
   - „Das Lukasevangelium ist menschlich, da Lukas selbst geforscht und aufgeschrieben hat (Lk 1,1-4). Das gleiche gilt für die Apostelgeschichte."
   - „Jeder Schreiber der Bibel hat seine eigene Art zu schreiben."
   - **Aufgabentyp:** `A1_true_false` (4 Items in einer Aufgabe)
5. **„Welche Auswirkungen bringt die Inspiration mit sich (auch für dich persönlich)?"**
   - `D2_personal_impact`
6. **„Eine Frage zum Nachdenken: Gibt es Unwahrheiten in der Bibel?"**
   - `F2_thinking`

### Lektion 2 — Geschichte + Irrtumslosigkeit (PDF S. 13–15)

- g) **Geschichte der Bibel** — als Leseaufgabe (`E4_reading`)
- h) **Die Irrtumslosigkeit der Bibel** — Aufgaben noch nicht analysiert

### Lektion 3 — Auslegung (PDF S. 16–18)

- i) **Auslegung der Bibel** — Aufgaben noch nicht analysiert

## Aufgabentypen-Inventar nach Skript-Realität

Für die ersten 11 Sektionen kommen nur diese Typen vor — daraus lässt sich die MVP-Implementierungs-Reihenfolge ableiten:

| Typ | Sektionen | Priorität |
|---|---|---|
| `A1_true_false` | 1f-4 | **Hoch** |
| `A3_match` | 1c, 1d | **Hoch** |
| `A4_table` | 1c (alternativ zu A3) | mittel |
| `B1_short_open` | 1b, 1e, 1f-1, 1f-3 | **Hoch** |
| `C1_long_open` | 1f-2 | mittel |
| `D2_personal_impact` | 1f-5 | später (privat, nie eingereicht) |
| `E1_verse_memorize` | Modul-Aufgabe (2.Tim 3,16, Hebr 4,12) | bereits indirekt durch SRS-Vers-Lernen abgedeckt |
| `E3_order_memorize` | Modul-Aufgabe | **erledigt** durch Übung „Bücher der Bibel" |
| `E4_reading` | 2g | mittel — nur eine Bestätigungs-Checkbox + Quelle |
| `F2_thinking` | 1f-6 | später |

## Implementierungs-Plan für die nächste Iteration

Schritt 1: Seed-Daten anlegen
- Course „Biblischer Unterricht für die Gemeinde", `slug: "biblischer-unterricht-2013"`
- Module 1 Bibliologie
- Lektion 1 mit allen 6 Sektionen
- Tasks für jede Sektion mit den oben aufgeführten Typen
- Vorerst nur Lektion 1 — Lektionen 2 und 3 später

Schritt 2: Selbststudium-UI unter `/lehrkurs/[course-slug]/[module]/[lesson]`
- Sektionsweise Anzeige, Lese-Text als Markdown
- Pro Sektion mit Aufgabe: passende Renderkomponente nach `task.type`

Schritt 3: Aufgabentyp-Renderer
- `A1_true_false`: Liste von Aussagen, je drei Buttons (R/F/?)
- `B1_short_open`: einzelnes Textarea
- `A3_match`: Drag&Drop oder Dropdown-Match
- `E4_reading`: Checkbox „gelesen"

Schritt 4: Antworten persistieren in `task_answers`
- Polymorphes Datenmodell — JSON-Payload pro Aufgabentyp
- Auto-Bewertung wo möglich (A1/A3), sonst Selbstbewertung

Schritt 5: Lehrkurs-Übersicht unter `/lehrkurs`
- Liste der Module
- Pro Modul: Fortschritt (X von Y Lektionen abgeschlossen)
- Klick → Lektionsliste → Sektionen

## Festlegungen (Samuel, 2026-05-08)

1. **Urheberrecht sauber**: Lese-Texte werden **paraphrasiert**, nicht 1:1
   abgetippt. Quelle wird im Lehrtext mit Hinweis auf das Original-Skript
   erwähnt, aber der Wortlaut stammt aus eigener Feder.
2. **Verse sind separat**: keine Modul-Aufgaben-Entities. Die Verse zu einer
   Lektion (z.B. „2.Tim 3,16 auswendig") werden über eine Junction-Tabelle
   `course_lesson_verses (lessonId, verseLearnItemId)` an die Lektion
   gehängt. Beim Lehrkurs-UI taucht dann pro Lektion ein Block „Verse zu
   dieser Lektion" auf, der ins reguläre SRS-Vers-Lernen verlinkt.
3. **D2 Persönliche Reflexion**: **beides** — Eingabefeld vorhanden, mit
   deutlichem Hinweis „nur für dich, wird nie eingereicht oder geteilt".
4. **Keine Lehrer-Lösungen jetzt**: B1/C1 → Selbstbewertung durch den
   Lerner. Optional später nachpflegen, wenn die Älteste die Lösungen
   freigeben.
