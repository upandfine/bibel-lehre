/**
 * Bibelübersetzungen + initiale Lernverse aus dem Skript
 * "Biblischer Unterricht 2013".
 *
 * Strategie:
 *   - Schlachter 2000 + Elberfelder revidiert sind als "licensed_pending"
 *     eingetragen — Texte werden erst nach OK der Verlage hinzugefügt.
 *   - Elberfelder 1905 und Luther 1912 sind Public Domain — Sample-Verse
 *     daraus, damit das System sofort echte Inhalte hat.
 *
 * Sample-Verse aus dem Skript:
 *   - 2.Tim 3,16   (Pflicht-Auswendig-Vers in Modul 1 Bibliologie)
 *   - Hebr 4,12    (Pflicht-Auswendig-Vers in Modul 1 Bibliologie)
 *   - Joh 3,16     (Klassiker, Heilsbotschaft)
 *   - Phil 2,5-11  (Auswendig-Aufgabe in Modul 7 Christologie — als Block)
 */

export type SeedTranslation = {
  id: string;
  fullName: string;
  publisher: string | null;
  year: number | null;
  isPublicDomain: boolean;
  attribution: string;
  licenseStatus: "public_domain" | "licensed_ok" | "licensed_pending" | "not_allowed";
};

export const translationsSeed: SeedTranslation[] = [
  {
    id: "SCH2000",
    fullName: "Schlachter 2000",
    publisher: "Genfer Bibelgesellschaft, Genf",
    year: 2000,
    isPublicDomain: false,
    attribution:
      "Schlachter 2000 © Genfer Bibelgesellschaft, Genf. Verwendet mit freundlicher Genehmigung.",
    licenseStatus: "licensed_pending",
  },
  {
    id: "ELB-rev",
    fullName: "Elberfelder Bibel (revidierte Fassung)",
    publisher: "SCM R. Brockhaus / CSV",
    year: 2006,
    isPublicDomain: false,
    attribution:
      "Elberfelder Bibel, revidierte Fassung © SCM R. Brockhaus im SCM-Verlag, Witten. Verwendet mit freundlicher Genehmigung.",
    licenseStatus: "licensed_pending",
  },
  {
    id: "ELB-1905",
    fullName: "Elberfelder Bibel 1905 (unrevidiert)",
    publisher: "Public Domain",
    year: 1905,
    isPublicDomain: true,
    attribution: "Elberfelder Bibel 1905 — Public Domain.",
    licenseStatus: "public_domain",
  },
  {
    id: "LU1912",
    fullName: "Lutherbibel 1912",
    publisher: "Public Domain",
    year: 1912,
    isPublicDomain: true,
    attribution: "Lutherbibel 1912 — Public Domain.",
    licenseStatus: "public_domain",
  },
];

export type SeedVerse = {
  bookAbbr: string;
  chapter: number;
  verseFrom: number;
  verseTo: number;
  translationId: string;
  text: string;
  visibility: "public" | "group" | "private";
};

/**
 * Initiale Lernverse — alle in Public-Domain-Übersetzungen,
 * damit ohne Verlagslizenz sofort gelernt werden kann.
 *
 * Sobald Schlachter/Elberfelder rev. genehmigt sind, parallele Einträge ergänzen.
 */
export const initialVersesSeed: SeedVerse[] = [
  // 2. Timotheus 3,16 — Pflicht-Vers Modul 1
  {
    bookAbbr: "2Tim",
    chapter: 3,
    verseFrom: 16,
    verseTo: 16,
    translationId: "ELB-1905",
    text: "Alle Schrift ist von Gott eingegeben und nütze zur Lehre, zur Überführung, zur Zurechtweisung, zur Unterweisung in der Gerechtigkeit,",
    visibility: "public",
  },
  {
    bookAbbr: "2Tim",
    chapter: 3,
    verseFrom: 16,
    verseTo: 16,
    translationId: "LU1912",
    text: "Denn alle Schrift, von Gott eingegeben, ist nütze zur Lehre, zur Strafe, zur Besserung, zur Züchtigung in der Gerechtigkeit,",
    visibility: "public",
  },

  // Hebräer 4,12 — Pflicht-Vers Modul 1
  {
    bookAbbr: "Hebr",
    chapter: 4,
    verseFrom: 12,
    verseTo: 12,
    translationId: "ELB-1905",
    text: "Denn das Wort Gottes ist lebendig und wirksam und schärfer als jedes zweischneidige Schwert, und durchdringend bis zur Scheidung von Seele und Geist, sowohl der Gelenke als auch des Markes, und ein Beurteiler der Gedanken und Gesinnungen des Herzens;",
    visibility: "public",
  },
  {
    bookAbbr: "Hebr",
    chapter: 4,
    verseFrom: 12,
    verseTo: 12,
    translationId: "LU1912",
    text: "Denn das Wort Gottes ist lebendig und kräftig und schärfer denn kein zweischneidig Schwert, und dringt durch, bis daß es scheidet Seele und Geist, auch Mark und Bein, und ist ein Richter der Gedanken und Sinne des Herzens.",
    visibility: "public",
  },

  // Johannes 3,16 — Heilsbotschaft, Klassiker
  {
    bookAbbr: "Joh",
    chapter: 3,
    verseFrom: 16,
    verseTo: 16,
    translationId: "ELB-1905",
    text: "Denn also hat Gott die Welt geliebt, daß er seinen eingeborenen Sohn gab, auf daß jeder, der an ihn glaubt, nicht verloren gehe, sondern ewiges Leben habe.",
    visibility: "public",
  },
  {
    bookAbbr: "Joh",
    chapter: 3,
    verseFrom: 16,
    verseTo: 16,
    translationId: "LU1912",
    text: "Also hat Gott die Welt geliebt, daß er seinen eingeborenen Sohn gab, auf daß alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.",
    visibility: "public",
  },

  // Philipper 2,5-11 — Auswendig-Aufgabe in Modul 7 Christologie (als Block)
  {
    bookAbbr: "Phil",
    chapter: 2,
    verseFrom: 5,
    verseTo: 11,
    translationId: "ELB-1905",
    text: "Denn diese Gesinnung sei in euch, die auch in Christo Jesu war, welcher, da er in Gestalt Gottes war, es nicht für einen Raub achtete, Gott gleich zu sein, sondern sich selbst zu nichts machte und Knechtsgestalt annahm, indem er in Gleichheit der Menschen geworden ist, und, in seiner Gestalt wie ein Mensch erfunden, sich selbst erniedrigte, indem er gehorsam wurde bis zum Tode, ja, zum Tode am Kreuze. Darum hat Gott ihn auch hoch erhoben und ihm einen Namen gegeben, der über jeden Namen ist, auf daß in dem Namen Jesu jedes Knie sich beuge, der Himmlischen und Irdischen und Unterirdischen, und jede Zunge bekenne, daß Jesus Christus Herr ist, zur Verherrlichung Gottes, des Vaters.",
    visibility: "public",
  },
];
