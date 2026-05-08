/**
 * Seed-Daten für den Lehrkurs „Biblischer Unterricht für die Gemeinde"
 * — Modul 1 Bibliologie.
 *
 * Quellen-Hinweis: Die Struktur (Modul/Lektion/Sektion/Aufgaben) folgt dem
 * gleichnamigen Skript von Ewald Gerber (Christengemeinde Paderborn-Süd,
 * 5. Fassung 2013). Die Lehrtexte selbst sind paraphrasiert, nicht 1:1
 * übernommen — siehe `docs/bibliologie-aufbau.md` Festlegung 1.
 */

/**
 * Im Seed-Data verwenden wir Buch-Abkürzungen statt der numerischen
 * `BibleReference.bookId` — das Seed-Skript löst die Abkürzung beim Insert
 * gegen `bible_books.abbr` auf. Macht die Daten lesbar und unabhängig von
 * konkreten DB-Ids.
 */
export type SeedBibleRef = {
  bookAbbr: string;
  chapter: number;
  verseFrom: number;
  verseTo?: number;
};

// --------------------------------------------------------------------
// Course
// --------------------------------------------------------------------

export const COURSE_SLUG = "biblischer-unterricht-2013";

export const courseSeed = {
  slug: COURSE_SLUG,
  title: "Biblischer Unterricht für die Gemeinde",
  description:
    "Strukturierte Einführung in die zehn klassischen Lehrgebäude der systematischen Theologie — von der Bibel über Gott und den Menschen bis zur Eschatologie. Aufbau angelehnt an das Skript der Christengemeinde Paderborn-Süd (E. Gerber, 5. Fassung 2013).",
  visibility: "public" as const,
};

// --------------------------------------------------------------------
// Modul 1 — Bibliologie
// --------------------------------------------------------------------

export const bibliologieSeed = {
  orderIndex: 1,
  title: "Bibliologie — Die Lehre über die Bibel",
  descriptionMd:
    "In diesem ersten Modul geht es um die Bibel selbst: ihren Aufbau, ihre Entstehung, ihre Inspiration, ihre Irrtumslosigkeit und die Frage, wie wir sie heute verantwortet auslegen.",
  goals: [
    "Aufbau und Gliederung der Bibel kennen",
    "Inspiration der Bibel erklären können",
    "Überblick über die Entstehung des Kanons gewinnen",
    "Prinzipien für den Umgang mit der Bibel lernen",
  ],
  recommendedLiterature: [
    {
      author: "Charles C. Ryrie",
      title: "Die Bibel verstehen, Teil III: Die Bibel: Gottes Wort",
      publisher: "Christliche Verlagsgesellschaft Dillenburg",
    },
    {
      author: "(Hrsg.)",
      title: "Chicago-Erklärung zur Irrtumslosigkeit der Bibel",
      publisher: "Verlag Bibel + Gemeinde",
    },
    {
      author: "Gordon D. Fee / Douglas Stuart",
      title: "Effektives Bibelstudium",
      publisher: "ICI",
    },
    {
      author: "H. G. Hendricks / W. D. Hendricks",
      title: "Bibellesen mit Gewinn",
      publisher: "Christliche Verlagsgesellschaft Dillenburg",
    },
    {
      author: "Heinrich Epp",
      title: "Hermeneutik: Prinzipien und Methoden der Schriftauslegung",
      publisher: "Christliche Verlagsbuchhandlung Paderborn",
    },
    {
      author: "(Hrsg.)",
      title: "So entstand die Bibel",
      publisher: "CLV",
    },
    {
      author: "Stephan Holthaus / K.-H. Vanheiden",
      title: "Die Unfehlbarkeit und Irrtumslosigkeit der Bibel",
      publisher: "Bibelbund-Verlag",
    },
  ],
};

// --------------------------------------------------------------------
// Aufgaben-Typen — Daten-Schemas in src/lib/task-types.ts
// --------------------------------------------------------------------

export type SeedTask = {
  orderIndex: number;
  type:
    | "A1_true_false"
    | "A3_match"
    | "B1_short_open"
    | "C1_long_open"
    | "D2_personal_impact"
    | "F2_thinking";
  promptMd: string;
  references?: SeedBibleRef[];
  expectedAnswerMd?: string;
  config?: Record<string, unknown>;
};

export type SeedSection = {
  orderIndex: number;
  title: string;
  introMd: string;
  references?: SeedBibleRef[];
  tasks: SeedTask[];
};

export type SeedLesson = {
  orderIndex: number;
  title: string;
  /** Bibelstellen-Referenzen, die zu dieser Lektion auswendig gelernt werden. */
  memorizeVerses: { bookAbbr: string; chapter: number; verseFrom: number; verseTo: number }[];
  sections: SeedSection[];
};

// Buch-Abkürzungen für Referenzen (werden im Seed zur ID aufgelöst)
const REF = (
  bookAbbr: string,
  chapter: number,
  verseFrom: number,
  verseTo?: number,
): SeedBibleRef => ({
  bookAbbr,
  chapter,
  verseFrom,
  ...(verseTo !== undefined ? { verseTo } : {}),
});

// --------------------------------------------------------------------
// Lektion 1 — Allgemeines + Inspiration
// --------------------------------------------------------------------

export const lesson1Seed: SeedLesson = {
  orderIndex: 1,
  title: "Allgemeines + Inspiration",
  memorizeVerses: [
    { bookAbbr: "2Tim", chapter: 3, verseFrom: 16, verseTo: 16 },
    { bookAbbr: "Hebr", chapter: 4, verseFrom: 12, verseTo: 12 },
  ],
  sections: [
    // --- a) Allgemeines zur Bibel ---
    {
      orderIndex: 1,
      title: "a) Allgemeines zur Bibel",
      introMd: `Die Bibel ist nicht ein einzelnes Buch, sondern eine Sammlung von 66 einzelnen Schriften. Sie ist über einen Zeitraum von rund 1500 Jahren auf drei Kontinenten von etwa 40 verschiedenen Autoren niedergeschrieben worden — Hirten, Königen, Fischern, Ärzten, Steuereinnehmern, Gelehrten.

Trotz dieser Vielfalt der Verfasser, Lebensumstände und Sprachen ist die Bibel inhaltlich eine geschlossene Einheit. Das ist erstaunlich — und es liegt daran, dass hinter jedem menschlichen Verfasser derselbe göttliche Urheber steht, der sich uns offenbaren möchte.`,
      tasks: [],
    },

    // --- b) Namen der Bibel ---
    {
      orderIndex: 2,
      title: "b) Namen der Bibel",
      introMd: `Das Wort *Bibel* selbst leitet sich vom griechischen *biblía* ab — Plural von *biblíon*, „Buch". Im Lateinischen wurde daraus *biblia* als Singular: „das Buch". In dem einen Wort steckt also schon beides: viele Schriften und doch eine einzige zusammengehörige Botschaft.

Die Bibel hat aber noch weitere Bezeichnungen, die sich aus ihren eigenen Aussagen ableiten lassen.`,
      tasks: [
        {
          orderIndex: 1,
          type: "B1_short_open",
          promptMd:
            'Nenne mindestens **zwei weitere Bezeichnungen** für die Bibel — jeweils mit Bibelstelle und einer kurzen Erklärung. (Beispiel: „Heilige Schrift" — 2.Tim 3,15 — die Schrift, die zum Heil unterweisen kann.)',
        },
      ],
    },

    // --- c) Einteilung der Bibel ---
    {
      orderIndex: 3,
      title: "c) Einteilung der Bibel",
      introMd: `Die Bibel teilt sich in zwei Hauptteile: das **Alte Testament** mit 39 Büchern und das **Neue Testament** mit 27 Büchern. Beide Teile lassen sich inhaltlich noch einmal in Gruppen unterteilen.

Im Alten Testament sind das z.B. die fünf Bücher Mose (Tora/Gesetz), die Geschichtsbücher, die Lehrbücher (Hiob bis Hoheslied) und die Propheten. Im Neuen Testament sind es die Evangelien, das Geschichtsbuch (Apostelgeschichte), die Briefe und schließlich die Offenbarung als prophetisches Buch.`,
      tasks: [
        {
          orderIndex: 1,
          type: "A3_match",
          promptMd:
            "Ordne die folgenden Bücher der jeweils richtigen Untergruppe zu. (Wenn du dir unsicher bist: Du kannst dir die Reihenfolge in der Bücher-Übung anschauen.)",
          // Stub-Config — wird durch das richtige Match-Schema in der UI-Iteration ersetzt
          config: {
            kind: "match",
            pairs: [
              { left: "1. Mose", right: "Gesetz (Pentateuch)" },
              { left: "Josua", right: "Geschichtsbücher AT" },
              { left: "Psalmen", right: "Lehrbücher AT" },
              { left: "Jesaja", right: "Propheten AT" },
              { left: "Matthäus", right: "Evangelien" },
              { left: "Apostelgeschichte", right: "Geschichtsbuch NT" },
              { left: "Römer", right: "Briefe NT" },
              { left: "Offenbarung", right: "Prophetie NT" },
            ],
          },
        },
      ],
    },

    // --- d) Sprachen der Bibel ---
    {
      orderIndex: 4,
      title: "d) Sprachen der Bibel",
      introMd: `Die Bibel ist mehrsprachig entstanden:

- Das **Alte Testament** wurde überwiegend in **Hebräisch** geschrieben — der Sprache des Volkes Israel.
- Einige Abschnitte (besonders in **Daniel** und **Esra**) sind in **Aramäisch** verfasst, der internationalen Verkehrssprache des Vorderen Orients zur Zeit der babylonischen Gefangenschaft.
- Das **Neue Testament** ist komplett in **Koine-Griechisch** geschrieben, der Umgangssprache des östlichen Mittelmeerraums in römischer Zeit.

Gott hat sich also in den jeweils verständlichen Alltagssprachen seiner Empfänger ausgedrückt — nicht in einer abgehobenen Geheimsprache.`,
      tasks: [
        {
          orderIndex: 1,
          type: "A3_match",
          promptMd:
            "Ordne die folgenden Bibelstellen ihrer **Grundsprache** zu.",
          references: [
            REF("1Mo", 1, 1, 10),
            REF("Dan", 2, 4),
            REF("Lk", 9, 7, 9),
          ],
          config: {
            kind: "match",
            pairs: [
              { left: "1. Mose 1,1-10", right: "Hebräisch" },
              { left: "Daniel 2,4 – 7,28", right: "Aramäisch" },
              { left: "Lukas 9,7-9", right: "Griechisch" },
            ],
          },
        },
      ],
    },

    // --- e) Bedeutung der Bibel ---
    {
      orderIndex: 5,
      title: "e) Bedeutung der Bibel",
      introMd: `Die Bibel beschreibt sich selbst nicht in einem einzigen Bild, sondern mit vielen — und jedes Bild zeigt einen anderen Aspekt davon, was Gottes Wort für uns ist und tut.

Beispiel: In Psalm 119,105 wird Gottes Wort eine **Lampe** für meinen Fuß und ein **Licht** auf meinem Wege genannt. Das Bild ist: Die Bibel macht hell, wo es dunkel ist — sie zeigt mir den nächsten Schritt und die Richtung im Leben.

Schau dir die folgenden Stellen an und überlege: Welches Bild wird hier verwendet, und was sagt das Bild über Gottes Wort aus?`,
      references: [
        REF("Jer", 23, 29),
        REF("Jak", 1, 22, 23),
        REF("Mt", 4, 4),
        REF("Lk", 8, 11),
      ],
      tasks: [
        {
          orderIndex: 1,
          type: "B1_short_open",
          promptMd:
            "**Jeremia 23,29** — Welches Bild wird hier für Gottes Wort verwendet? Was bedeutet es?",
          references: [REF("Jer", 23, 29)],
        },
        {
          orderIndex: 2,
          type: "B1_short_open",
          promptMd:
            "**Jakobus 1,22-23** — Welches Bild wird hier verwendet? Was bedeutet es?",
          references: [REF("Jak", 1, 22, 23)],
        },
        {
          orderIndex: 3,
          type: "B1_short_open",
          promptMd:
            "**Matthäus 4,4** — Welches Bild wird hier verwendet? Was bedeutet es?",
          references: [REF("Mt", 4, 4)],
        },
        {
          orderIndex: 4,
          type: "B1_short_open",
          promptMd:
            "**Lukas 8,11** — Welches Bild wird hier verwendet? Was bedeutet es?",
          references: [REF("Lk", 8, 11)],
        },
      ],
    },

    // --- f) Inspiration der Bibel ---
    {
      orderIndex: 6,
      title: "f) Inspiration der Bibel",
      introMd: `Wenn wir sagen, die Bibel ist „inspiriert", meinen wir: der Heilige Geist hat die menschlichen Verfasser so geführt, dass das, was sie aufgeschrieben haben, **das Wort Gottes** ist — verbindlich und zuverlässig.

Das ist keine *Diktat-Theorie*: Die Schreiber waren keine willenlosen Schreibgeräte. Jeder behielt seinen eigenen Stil, sein eigenes Vokabular, seine eigene Persönlichkeit — Lukas schreibt anders als Paulus, Johannes anders als Petrus. Und doch ist das Ergebnis nicht „Mensch über Gott", sondern „Gott durch Menschen".

Eine hilfreiche Definition (nach Heinz Weber, paraphrasiert):

> *Inspiration ist das Wirken des Heiligen Geistes auf die Verfasser der biblischen Schriften, durch das ihre Aussagen das verbindliche, irrtumslose Wort Gottes geworden sind.*

Die folgenden Aufgaben helfen dir, diesen Gedanken Schritt für Schritt zu prüfen.`,
      references: [
        REF("2Tim", 3, 16),
        REF("2Petr", 1, 21),
        REF("Hebr", 1, 1, 2),
      ],
      tasks: [
        {
          orderIndex: 1,
          type: "B1_short_open",
          promptMd:
            "Lies **2.Tim 3,16**, **2.Petr 1,21** und **Hebr 1,1-2**. Wer ist laut diesen Stellen der eigentliche Autor der Bibel?",
          references: [
            REF("2Tim", 3, 16),
            REF("2Petr", 1, 21),
            REF("Hebr", 1, 1, 2),
          ],
        },
        {
          orderIndex: 2,
          type: "C1_long_open",
          promptMd:
            "**Diktat-Theorie prüfen.** Wenn die Bibel rein diktiert worden wäre, müssten alle Bibelteile sprachlich gleich klingen. Lies **5.Mo 9,10**, **Lk 1,1-4**, **Hebr 1,1-2** und **Tit 1,12-13** — und begründe in zwei bis vier Sätzen, warum die Diktat-Theorie nicht zutreffen kann.",
          references: [
            REF("5Mo", 9, 10),
            REF("Lk", 1, 1, 4),
            REF("Hebr", 1, 1, 2),
            REF("Tit", 1, 12, 13),
          ],
        },
        {
          orderIndex: 3,
          type: "B1_short_open",
          promptMd:
            "Erkläre die Inspiration **in deinen eigenen Worten** — orientiere dich an der Definition oben, aber formuliere selbst.",
        },
        {
          orderIndex: 4,
          type: "A1_true_false",
          promptMd:
            "Sind die folgenden Aussagen richtig oder falsch?",
          config: {
            kind: "true_false",
            statements: [
              {
                id: "tf1",
                text: "Die Elberfelder Bibel ist mehr inspiriert als die Lutherbibel.",
                answer: false,
                explanation:
                  'Inspiriert sind die ursprünglichen Schriften (Urtexte). Übersetzungen geben den inspirierten Text mehr oder weniger genau wieder, sind aber nicht selbst „mehr" oder „weniger" inspiriert.',
              },
              {
                id: "tf2",
                text: "Meine Bibel zuhause kann Fehler und Ungenauigkeiten enthalten.",
                answer: true,
                explanation:
                  "Übersetzungen, Druck und Textkritik sind menschliche Arbeiten — Fehler in Auflagen oder ungenaue Wiedergaben sind möglich. Die Aussagen des Urtextes sind unverändert; die Übertragung kann Schwächen haben.",
              },
              {
                id: "tf3",
                text: "Das Lukasevangelium ist menschlich, da Lukas selbst geforscht und aufgeschrieben hat (Lk 1,1-4). Das gleiche gilt für die Apostelgeschichte.",
                answer: false,
                explanation:
                  'Lukas hat sorgfältig recherchiert — und genau diese menschliche Forschung war das Werkzeug, das der Heilige Geist benutzt hat, um das Evangelium und die Apostelgeschichte als inspiriertes Wort Gottes hervorzubringen. „Mensch und Gott" schließen sich nicht aus.',
              },
              {
                id: "tf4",
                text: "Jeder Schreiber der Bibel hat seine eigene Art zu schreiben.",
                answer: true,
                explanation:
                  "Genau das ist der Punkt der Inspiration: Stil, Wortschatz und Persönlichkeit der Verfasser bleiben erhalten — und doch ist das Ergebnis Gottes Wort.",
              },
            ],
          },
        },
        {
          orderIndex: 5,
          type: "D2_personal_impact",
          promptMd:
            "**Persönliche Reflexion.** Welche Auswirkungen hat es ganz konkret für dich, wenn die Bibel wirklich Gottes Wort ist? Notiere zwei bis drei Gedanken — diese Antwort bleibt **privat**, sie wird nicht eingereicht oder mit anderen geteilt.",
        },
        {
          orderIndex: 6,
          type: "F2_thinking",
          promptMd:
            "**Frage zum Nachdenken** (keine Eingabe nötig): Gibt es Unwahrheiten in der Bibel? Wenn ja, in welchem Sinn — und wenn nein, wie erklärst du dann Stellen, in denen Lügen oder fehlerhafte Aussagen *wiedergegeben* werden (z.B. die Worte Satans in 1.Mo 3 oder die Argumente von Hiobs Freunden)?",
        },
      ],
    },
  ],
};

export const bibliologieLessons: SeedLesson[] = [lesson1Seed];
