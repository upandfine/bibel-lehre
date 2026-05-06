/**
 * 66 Bücher der Bibel in kanonischer (protestantischer) Reihenfolge.
 *
 * Gruppen-Farben sind als Hex-Codes hinterlegt — werden im UI z. B.
 * für die Bücher-Reihenfolge-Übung als Hintergrund verwendet.
 *
 * Quelle für Kapitelzahlen: standardisierte Daten der Deutschen Bibelgesellschaft.
 */

export type SeedBibleBook = {
  id: number; // 1..66
  abbr: string; // gebräuchliche deutsche Abkürzung
  nameDe: string;
  testament: "AT" | "NT";
  groupName: string;
  groupColor: string; // Hex
  orderIndex: number; // 1..66
  chapterCount: number;
  summary: string | null;
};

const PENTATEUCH = "#d97706"; // amber-600
const GESCHICHTE = "#ca8a04"; // yellow-600
const POESIE = "#16a34a"; // green-600
const GROSSE_PROPH = "#0284c7"; // sky-600
const KLEINE_PROPH = "#06b6d4"; // cyan-500
const EVANGELIEN = "#dc2626"; // red-600
const APG = "#9333ea"; // purple-600
const PAULUS = "#0891b2"; // cyan-700
const ALLG_BRIEFE = "#64748b"; // slate-500
const OFFENBARUNG = "#e11d48"; // rose-600

export const bibleBooksSeed: SeedBibleBook[] = [
  // === Pentateuch ===
  { id: 1, abbr: "1Mo", nameDe: "1. Mose", testament: "AT", groupName: "Pentateuch", groupColor: PENTATEUCH, orderIndex: 1, chapterCount: 50, summary: "Genesis — Anfang von Schöpfung, Sünde und Erwählung" },
  { id: 2, abbr: "2Mo", nameDe: "2. Mose", testament: "AT", groupName: "Pentateuch", groupColor: PENTATEUCH, orderIndex: 2, chapterCount: 40, summary: "Exodus — Befreiung Israels und Sinai-Bund" },
  { id: 3, abbr: "3Mo", nameDe: "3. Mose", testament: "AT", groupName: "Pentateuch", groupColor: PENTATEUCH, orderIndex: 3, chapterCount: 27, summary: "Levitikus — Heiligkeit und Opferdienst" },
  { id: 4, abbr: "4Mo", nameDe: "4. Mose", testament: "AT", groupName: "Pentateuch", groupColor: PENTATEUCH, orderIndex: 4, chapterCount: 36, summary: "Numeri — Wüstenwanderung Israels" },
  { id: 5, abbr: "5Mo", nameDe: "5. Mose", testament: "AT", groupName: "Pentateuch", groupColor: PENTATEUCH, orderIndex: 5, chapterCount: 34, summary: "Deuteronomium — Bundesreden vor dem Land" },

  // === Geschichtsbücher ===
  { id: 6, abbr: "Jos", nameDe: "Josua", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 6, chapterCount: 24, summary: "Landnahme Kanaans" },
  { id: 7, abbr: "Ri", nameDe: "Richter", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 7, chapterCount: 21, summary: "Zeit der Richter Israels" },
  { id: 8, abbr: "Ru", nameDe: "Rut", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 8, chapterCount: 4, summary: "Treue und Erlösung in der Familie Davids" },
  { id: 9, abbr: "1Sam", nameDe: "1. Samuel", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 9, chapterCount: 31, summary: "Samuel, Saul, Aufstieg Davids" },
  { id: 10, abbr: "2Sam", nameDe: "2. Samuel", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 10, chapterCount: 24, summary: "Königtum Davids" },
  { id: 11, abbr: "1Kö", nameDe: "1. Könige", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 11, chapterCount: 22, summary: "Salomo bis zur Reichsteilung" },
  { id: 12, abbr: "2Kö", nameDe: "2. Könige", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 12, chapterCount: 25, summary: "Bis zum Exil von Juda" },
  { id: 13, abbr: "1Chr", nameDe: "1. Chronik", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 13, chapterCount: 29, summary: "Genealogien und David" },
  { id: 14, abbr: "2Chr", nameDe: "2. Chronik", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 14, chapterCount: 36, summary: "Salomo bis Exil aus priesterlicher Sicht" },
  { id: 15, abbr: "Esr", nameDe: "Esra", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 15, chapterCount: 10, summary: "Rückkehr aus dem Exil und Tempelbau" },
  { id: 16, abbr: "Neh", nameDe: "Nehemia", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 16, chapterCount: 13, summary: "Wiederaufbau der Mauern Jerusalems" },
  { id: 17, abbr: "Est", nameDe: "Ester", testament: "AT", groupName: "Geschichtsbücher", groupColor: GESCHICHTE, orderIndex: 17, chapterCount: 10, summary: "Bewahrung Israels in der Diaspora" },

  // === Lehrbücher / Poesie ===
  { id: 18, abbr: "Hi", nameDe: "Hiob", testament: "AT", groupName: "Lehrbücher", groupColor: POESIE, orderIndex: 18, chapterCount: 42, summary: "Leid und Souveränität Gottes" },
  { id: 19, abbr: "Ps", nameDe: "Psalmen", testament: "AT", groupName: "Lehrbücher", groupColor: POESIE, orderIndex: 19, chapterCount: 150, summary: "Gebete und Lieder Israels" },
  { id: 20, abbr: "Spr", nameDe: "Sprüche", testament: "AT", groupName: "Lehrbücher", groupColor: POESIE, orderIndex: 20, chapterCount: 31, summary: "Weisheit für den Alltag" },
  { id: 21, abbr: "Pred", nameDe: "Prediger", testament: "AT", groupName: "Lehrbücher", groupColor: POESIE, orderIndex: 21, chapterCount: 12, summary: "Sinnsuche unter der Sonne" },
  { id: 22, abbr: "Hl", nameDe: "Hohelied", testament: "AT", groupName: "Lehrbücher", groupColor: POESIE, orderIndex: 22, chapterCount: 8, summary: "Liebeslied Salomos" },

  // === Große Propheten ===
  { id: 23, abbr: "Jes", nameDe: "Jesaja", testament: "AT", groupName: "Große Propheten", groupColor: GROSSE_PROPH, orderIndex: 23, chapterCount: 66, summary: "Gericht und Heil — Knecht Gottes" },
  { id: 24, abbr: "Jer", nameDe: "Jeremia", testament: "AT", groupName: "Große Propheten", groupColor: GROSSE_PROPH, orderIndex: 24, chapterCount: 52, summary: "Der weinende Prophet vor dem Exil" },
  { id: 25, abbr: "Kla", nameDe: "Klagelieder", testament: "AT", groupName: "Große Propheten", groupColor: GROSSE_PROPH, orderIndex: 25, chapterCount: 5, summary: "Klage über das gefallene Jerusalem" },
  { id: 26, abbr: "Hes", nameDe: "Hesekiel", testament: "AT", groupName: "Große Propheten", groupColor: GROSSE_PROPH, orderIndex: 26, chapterCount: 48, summary: "Visionen im Exil" },
  { id: 27, abbr: "Dan", nameDe: "Daniel", testament: "AT", groupName: "Große Propheten", groupColor: GROSSE_PROPH, orderIndex: 27, chapterCount: 12, summary: "Treue in Babylon und prophetische Visionen" },

  // === Kleine Propheten ===
  { id: 28, abbr: "Hos", nameDe: "Hosea", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 28, chapterCount: 14, summary: "Untreue Israels und Liebe Gottes" },
  { id: 29, abbr: "Joel", nameDe: "Joel", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 29, chapterCount: 3, summary: "Tag des Herrn und Geist-Ausgießung" },
  { id: 30, abbr: "Am", nameDe: "Amos", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 30, chapterCount: 9, summary: "Soziale Gerechtigkeit gefordert" },
  { id: 31, abbr: "Ob", nameDe: "Obadja", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 31, chapterCount: 1, summary: "Gericht über Edom" },
  { id: 32, abbr: "Jon", nameDe: "Jona", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 32, chapterCount: 4, summary: "Mission an Ninive" },
  { id: 33, abbr: "Mi", nameDe: "Micha", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 33, chapterCount: 7, summary: "Recht, Liebe und Demut" },
  { id: 34, abbr: "Nah", nameDe: "Nahum", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 34, chapterCount: 3, summary: "Gericht über Ninive" },
  { id: 35, abbr: "Hab", nameDe: "Habakuk", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 35, chapterCount: 3, summary: "Glauben angesichts des Bösen" },
  { id: 36, abbr: "Zef", nameDe: "Zefanja", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 36, chapterCount: 3, summary: "Tag des Herrn und Bewahrung" },
  { id: 37, abbr: "Hag", nameDe: "Haggai", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 37, chapterCount: 2, summary: "Aufruf zum Tempelbau" },
  { id: 38, abbr: "Sach", nameDe: "Sacharja", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 38, chapterCount: 14, summary: "Visionen vom kommenden Messias" },
  { id: 39, abbr: "Mal", nameDe: "Maleachi", testament: "AT", groupName: "Kleine Propheten", groupColor: KLEINE_PROPH, orderIndex: 39, chapterCount: 4, summary: "Letzter AT-Prophet" },

  // === Evangelien ===
  { id: 40, abbr: "Mt", nameDe: "Matthäus", testament: "NT", groupName: "Evangelien", groupColor: EVANGELIEN, orderIndex: 40, chapterCount: 28, summary: "Jesus als verheißener Messias" },
  { id: 41, abbr: "Mk", nameDe: "Markus", testament: "NT", groupName: "Evangelien", groupColor: EVANGELIEN, orderIndex: 41, chapterCount: 16, summary: "Jesus als handelnder Knecht" },
  { id: 42, abbr: "Lk", nameDe: "Lukas", testament: "NT", groupName: "Evangelien", groupColor: EVANGELIEN, orderIndex: 42, chapterCount: 24, summary: "Jesus als Retter aller Menschen" },
  { id: 43, abbr: "Joh", nameDe: "Johannes", testament: "NT", groupName: "Evangelien", groupColor: EVANGELIEN, orderIndex: 43, chapterCount: 21, summary: "Jesus als ewiger Sohn Gottes" },

  // === Apostelgeschichte ===
  { id: 44, abbr: "Apg", nameDe: "Apostelgeschichte", testament: "NT", groupName: "Apostelgeschichte", groupColor: APG, orderIndex: 44, chapterCount: 28, summary: "Wirken des Heiligen Geistes in der jungen Gemeinde" },

  // === Paulusbriefe ===
  { id: 45, abbr: "Röm", nameDe: "Römer", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 45, chapterCount: 16, summary: "Rechtfertigung aus Glauben" },
  { id: 46, abbr: "1Kor", nameDe: "1. Korinther", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 46, chapterCount: 16, summary: "Gemeindeordnung in Korinth" },
  { id: 47, abbr: "2Kor", nameDe: "2. Korinther", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 47, chapterCount: 13, summary: "Aposteldienst und Versöhnung" },
  { id: 48, abbr: "Gal", nameDe: "Galater", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 48, chapterCount: 6, summary: "Freiheit vom Gesetz" },
  { id: 49, abbr: "Eph", nameDe: "Epheser", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 49, chapterCount: 6, summary: "Einheit in Christus" },
  { id: 50, abbr: "Phil", nameDe: "Philipper", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 50, chapterCount: 4, summary: "Freude in jeder Lage" },
  { id: 51, abbr: "Kol", nameDe: "Kolosser", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 51, chapterCount: 4, summary: "Vorrang Christi vor allem" },
  { id: 52, abbr: "1Thess", nameDe: "1. Thessalonicher", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 52, chapterCount: 5, summary: "Wiederkunft Christi" },
  { id: 53, abbr: "2Thess", nameDe: "2. Thessalonicher", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 53, chapterCount: 3, summary: "Ermutigung in Verfolgung" },
  { id: 54, abbr: "1Tim", nameDe: "1. Timotheus", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 54, chapterCount: 6, summary: "Gemeindeleitung" },
  { id: 55, abbr: "2Tim", nameDe: "2. Timotheus", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 55, chapterCount: 4, summary: "Vermächtnis des Paulus" },
  { id: 56, abbr: "Tit", nameDe: "Titus", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 56, chapterCount: 3, summary: "Ältesten und gute Werke" },
  { id: 57, abbr: "Phlm", nameDe: "Philemon", testament: "NT", groupName: "Paulusbriefe", groupColor: PAULUS, orderIndex: 57, chapterCount: 1, summary: "Vergebung und Versöhnung" },

  // === Allgemeine Briefe ===
  { id: 58, abbr: "Hebr", nameDe: "Hebräer", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 58, chapterCount: 13, summary: "Christus, der bessere Hohepriester" },
  { id: 59, abbr: "Jak", nameDe: "Jakobus", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 59, chapterCount: 5, summary: "Glaube und Werke" },
  { id: 60, abbr: "1Petr", nameDe: "1. Petrus", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 60, chapterCount: 5, summary: "Hoffnung im Leiden" },
  { id: 61, abbr: "2Petr", nameDe: "2. Petrus", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 61, chapterCount: 3, summary: "Warnung vor Irrlehrern" },
  { id: 62, abbr: "1Joh", nameDe: "1. Johannes", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 62, chapterCount: 5, summary: "Liebe und Wahrheit" },
  { id: 63, abbr: "2Joh", nameDe: "2. Johannes", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 63, chapterCount: 1, summary: "Wahrheit und Liebe in der Praxis" },
  { id: 64, abbr: "3Joh", nameDe: "3. Johannes", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 64, chapterCount: 1, summary: "Gastfreundschaft und Treue" },
  { id: 65, abbr: "Jud", nameDe: "Judas", testament: "NT", groupName: "Allgemeine Briefe", groupColor: ALLG_BRIEFE, orderIndex: 65, chapterCount: 1, summary: "Aufruf zum Glaubenskampf" },

  // === Offenbarung ===
  { id: 66, abbr: "Off", nameDe: "Offenbarung", testament: "NT", groupName: "Offenbarung", groupColor: OFFENBARUNG, orderIndex: 66, chapterCount: 22, summary: "Vollendung aller Dinge in Christus" },
];
