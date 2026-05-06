/**
 * Bib-Inside — Datenmodell (Drizzle ORM, PostgreSQL)
 *
 * Aufbau folgt KONZEPT.md Kapitel 9.
 * Wichtige Festlegungen:
 *   - Kein Mentor-Workflow im MVP (keine Reviews, Meetings, Status-Workflow)
 *   - Antworten an Kursversion gepinnt
 *   - Keine Volltext-Bibel — nur eingetippte Lerntexte mit Übersetzungs-Metadaten
 *   - SRS (SM-2) läuft über user_progress, nicht über task_answers
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  smallint,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ====================================================================
// Enums
// ====================================================================

export const userRoleEnum = pgEnum("user_role", ["admin", "learner"]);

export const visibilityEnum = pgEnum("visibility", ["private", "group", "public"]);

export const courseStatusEnum = pgEnum("course_status", [
  "draft",
  "published",
  "archived",
]);

/**
 * Aufgabentypen aus INHALTSANALYSE.md Kap. 3.
 * MVP-Phase 1 implementiert: A1, A2, A3, B1, C1, E1, E4
 */
export const taskTypeEnum = pgEnum("task_type", [
  // A — auto-bewertbar
  "A1_true_false",
  "A2_cloze",
  "A3_match",
  "A4_table",
  "A5_ordering",
  "A6_choice",
  // B — selbstbewertet
  "B1_short_open",
  "B2_list",
  "B3_definition",
  "B4_verse_meaning",
  // C — Mentor-Review (im MVP: nur lokal speichern, beim Treffen besprechen)
  "C1_long_open",
  "C2_essay",
  "C3_compare",
  "C4_application",
  "C5_summary",
  // D — privat
  "D1_personal_meaning",
  "D2_personal_impact",
  "D3_personal_excitement",
  // E — Verhalten
  "E1_verse_memorize",
  "E2_passage_memorize",
  "E3_order_memorize",
  "E4_reading",
  "E5_choice_xor",
  // F — Sonstiges
  "F1_external_research",
  "F2_thinking",
]);

export const testamentEnum = pgEnum("testament", ["AT", "NT"]);

// ====================================================================
// Users & Auth
// ====================================================================

/**
 * Auth.js v5 erwartet bestimmte Felder. Hier minimal gehalten.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: varchar("name", { length: 100 }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("learner"),
  // Sanfte UX-Einstellungen
  preferredTranslation: varchar("preferred_translation", { length: 20 }).default(
    "ELB-1905",
  ),
  sabbathMode: boolean("sabbath_mode").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Auth.js Sessions (Database-Strategy)
 */
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/**
 * Auth.js Verification-Tokens (für Magic-Links)
 */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

/**
 * Auth.js Accounts (OAuth-Verknüpfungen — im MVP nicht aktiv genutzt, aber Schema hält Platz)
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (a) => ({
    pk: primaryKey({ columns: [a.provider, a.providerAccountId] }),
  }),
);

// ====================================================================
// Gruppen (für visibility=group, später auch Kurs-Zuweisungen)
// ====================================================================

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const userGroups = pgTable(
  "user_groups",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull().defaultNow(),
  },
  (ug) => ({
    pk: primaryKey({ columns: [ug.userId, ug.groupId] }),
  }),
);

// ====================================================================
// Bibel-Stammdaten (66 Bücher, Übersetzungs-Liste — keine Volltext-Bibel)
// ====================================================================

export const bibleBooks = pgTable(
  "bible_books",
  {
    id: smallint("id").primaryKey(), // 1..66
    abbr: varchar("abbr", { length: 10 }).notNull().unique(), // z.B. "1Mo", "Joh"
    nameDe: varchar("name_de", { length: 50 }).notNull(),
    // Originalname (hebräisch für AT, griechisch für NT) in Originalschrift mit Punktierung
    nameOriginal: varchar("name_original", { length: 100 }),
    // Lateinische Umschrift wie sie in deutschsprachiger Theologie üblich ist (z.B. "Bereschit")
    nameOriginalTransliterated: varchar("name_original_transliterated", {
      length: 60,
    }),
    testament: testamentEnum("testament").notNull(),
    groupName: varchar("group_name", { length: 50 }).notNull(), // "Pentateuch", "Evangelien", ...
    groupColor: varchar("group_color", { length: 20 }), // Hex/Tailwind-Token
    orderIndex: smallint("order_index").notNull(), // 1..66 (kanonische Reihenfolge)
    chapterCount: smallint("chapter_count").notNull(),
    summary: text("summary"),
  },
  (t) => ({
    orderIdx: index("bible_books_order_idx").on(t.orderIndex),
  }),
);

export const bibleTranslations = pgTable("bible_translations", {
  id: varchar("id", { length: 20 }).primaryKey(), // "SCH2000", "ELB-rev", "ELB-1905", "LU1912"
  fullName: varchar("full_name", { length: 100 }).notNull(),
  publisher: varchar("publisher", { length: 100 }),
  year: integer("year"),
  isPublicDomain: boolean("is_public_domain").notNull().default(false),
  attribution: text("attribution"), // Pflicht-Quellenangabe pro angezeigtem Vers
  licenseStatus: varchar("license_status", { length: 30 }).default("unknown"),
  // 'public_domain' | 'licensed_ok' | 'licensed_pending' | 'not_allowed'
});

/**
 * Eingetippte Lernverse — KEIN Volltext-Bibel. Pro Vers eine Zeile.
 */
export const verseLearnItems = pgTable(
  "verse_learn_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),

    bookId: smallint("book_id")
      .notNull()
      .references(() => bibleBooks.id),
    chapter: smallint("chapter").notNull(),
    verseFrom: smallint("verse_from").notNull(),
    verseTo: smallint("verse_to").notNull(),

    translationId: varchar("translation_id", { length: 20 })
      .notNull()
      .references(() => bibleTranslations.id),

    text: text("text").notNull(),
    attributionOverride: text("attribution_override"), // Optional: spezielle Quellenangabe

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    refIdx: index("verse_learn_items_ref_idx").on(t.bookId, t.chapter, t.verseFrom),
    ownerIdx: index("verse_learn_items_owner_idx").on(t.ownerId),
  }),
);

// ====================================================================
// Lehrkurse — strukturierte Kurse mit Modulen, Lektionen, Sektionen, Aufgaben
// ====================================================================

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  visibility: visibilityEnum("visibility").notNull().default("group"),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  version: integer("version").notNull().default(1),
  status: courseStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const courseModules = pgTable(
  "course_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    orderIndex: smallint("order_index").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    descriptionMd: text("description_md"),
    /** Lernziele als Array (Punkt-Liste) */
    goals: jsonb("goals").$type<string[]>(),
    /** Empfohlene Literatur als Array von { author, title, publisher? } */
    recommendedLiterature:
      jsonb("recommended_literature").$type<
        { author: string; title: string; publisher?: string }[]
      >(),
  },
  (t) => ({
    orderIdx: index("course_modules_order_idx").on(t.courseId, t.orderIndex),
  }),
);

export const courseLessons = pgTable(
  "course_lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => courseModules.id, { onDelete: "cascade" }),
    orderIndex: smallint("order_index").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
  },
  (t) => ({
    orderIdx: index("course_lessons_order_idx").on(t.moduleId, t.orderIndex),
  }),
);

export const courseSections = pgTable(
  "course_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => courseLessons.id, { onDelete: "cascade" }),
    orderIndex: smallint("order_index").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    introMd: text("intro_md"),
    /** Sektions-weite Bibelstellen-Referenzen (vor den einzelnen Aufgaben) */
    references: jsonb("references").$type<BibleReference[]>(),
  },
  (t) => ({
    orderIdx: index("course_sections_order_idx").on(t.lessonId, t.orderIndex),
  }),
);

/**
 * Strukturierte Bibelstellen-Referenz für JSON-Felder.
 */
export type BibleReference = {
  bookId: number;
  chapter: number;
  verseFrom: number;
  verseTo?: number;
  /** Optional: Anmerkung wie "ff" für "und folgende" */
  note?: string;
};

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => courseSections.id, { onDelete: "cascade" }),
    orderIndex: smallint("order_index").notNull(),

    type: taskTypeEnum("type").notNull(),
    promptMd: text("prompt_md").notNull(),
    references: jsonb("references").$type<BibleReference[]>(),

    /** Musterantwort für B-Typ (optional, leer-tolerant — Samuel pflegt nach und nach) */
    expectedAnswerMd: text("expected_answer_md"),

    /**
     * Typ-spezifische Konfiguration (Lückenpositionen, Match-Paare,
     * Multiple-Choice-Optionen, Reihenfolge-Items, …)
     * Schema je Typ ist in src/lib/task-types.ts dokumentiert.
     */
    config: jsonb("config").$type<Record<string, unknown>>(),

    /** Frist relativ zur Lektion oder als Datum, optional */
    dueRule: jsonb("due_rule").$type<DueRule | null>(),
  },
  (t) => ({
    orderIdx: index("tasks_order_idx").on(t.sectionId, t.orderIndex),
  }),
);

export type DueRule =
  | { kind: "date"; iso: string }
  | { kind: "by_lesson"; lessonOrder: number };

/**
 * Wahlaufgaben (XOR / N-aus-M): mehrere Tasks gehören in eine Gruppe,
 * der Lerner muss eine bestimmte Anzahl davon erfüllen.
 */
export const taskGroups = pgTable("task_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => courseSections.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 200 }),
  minRequired: smallint("min_required").notNull().default(1),
  maxRequired: smallint("max_required").notNull().default(1),
});

export const taskGroupMembers = pgTable(
  "task_group_members",
  {
    taskGroupId: uuid("task_group_id")
      .notNull()
      .references(() => taskGroups.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskGroupId, t.taskId] }),
  }),
);

// ====================================================================
// Lerner-Antworten (rein privat, kein Workflow-Status)
// ====================================================================

export const taskAnswers = pgTable(
  "task_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /**
     * Antwort typabhängig:
     *   A1: { value: boolean }
     *   A2: { fills: string[] }
     *   A3: { matches: Record<string, string> }
     *   B1/C1/...: { text: string }
     *   E1: -> wird automatisch zu user_progress
     */
    answer: jsonb("answer").$type<Record<string, unknown>>().notNull(),

    /** Auto-bewertbar (A-Typ): true/false/null bei "noch nicht geprüft" */
    isAutoCorrect: boolean("is_auto_correct"),

    /** Selbstbewertung (B-Typ): "ok" | "partial" | "needs_review" | null */
    selfGrade: varchar("self_grade", { length: 20 }),

    /** Kursversion zum Zeitpunkt des Antwortens — für Versionierungs-Pinning */
    courseVersion: integer("course_version").notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    /** Ein User hat pro Aufgabe genau eine Antwort */
    uniqueUserTask: uniqueIndex("task_answers_user_task_idx").on(t.taskId, t.userId),
    userIdx: index("task_answers_user_idx").on(t.userId),
  }),
);

// ====================================================================
// Einschreibungen + Reading-Logs
// ====================================================================

export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    /** Version, an der der Lerner aktuell arbeitet — bleibt fix bis zur manuellen Migration */
    pinnedVersion: integer("pinned_version").notNull(),
    startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
    lastActiveAt: timestamp("last_active_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (t) => ({
    uniqueUserCourse: uniqueIndex("course_enrollments_user_course_idx").on(
      t.userId,
      t.courseId,
    ),
  }),
);

export const readingLogs = pgTable(
  "reading_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { mode: "date" }).notNull().defaultNow(),
    noteMd: text("note_md"),
  },
  (t) => ({
    uniqueUserTask: uniqueIndex("reading_logs_user_task_idx").on(t.taskId, t.userId),
  }),
);

// ====================================================================
// SRS — Spaced Repetition für Verse, Reihenfolge, Karten
// ====================================================================

/**
 * Generischer SRS-Eintrag (SM-2). Verknüpft entweder mit:
 *   - einem verseLearnItem (für E1/E2)
 *   - einem bibleBook (für E3 — Reihenfolge)
 *   - später: einer Karteikarte (Phase 2)
 *
 * Wir verwenden ein Polymorph-Muster: source_type + source_id.
 */
export const userProgress = pgTable(
  "user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    sourceType: varchar("source_type", { length: 30 }).notNull(),
    // 'verse' | 'book_order' | 'flashcard'
    sourceId: varchar("source_id", { length: 100 }).notNull(),
    // verseLearnItem.id (UUID als string) | bibleBook.id (numeric als string) | flashcard.id

    /** SM-2 Felder */
    easeFactor: integer("ease_factor").notNull().default(250), // *0.01 → 2.5
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),

    lastReviewedAt: timestamp("last_reviewed_at", { mode: "date" }),
    dueAt: timestamp("due_at", { mode: "date" }).notNull().defaultNow(),

    lastGrade: varchar("last_grade", { length: 10 }),
    // 'again' | 'hard' | 'good' | 'easy'
    totalReviews: integer("total_reviews").notNull().default(0),
    correctReviews: integer("correct_reviews").notNull().default(0),
  },
  (t) => ({
    uniqueUserSource: uniqueIndex("user_progress_user_source_idx").on(
      t.userId,
      t.sourceType,
      t.sourceId,
    ),
    dueIdx: index("user_progress_due_idx").on(t.userId, t.dueAt),
  }),
);

// ====================================================================
// Audit-Log (nur Admin-Aktionen)
// ====================================================================

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    targetType: varchar("target_type", { length: 50 }),
    targetId: varchar("target_id", { length: 100 }),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    ts: timestamp("ts", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("audit_log_user_idx").on(t.userId, t.ts),
  }),
);

// ====================================================================
// Relations (für Drizzle Query API)
// ====================================================================

export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(courseEnrollments),
  answers: many(taskAnswers),
  progress: many(userProgress),
  ownedCourses: many(courses),
  ownedVerses: many(verseLearnItems),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  owner: one(users, { fields: [courses.ownerId], references: [users.id] }),
  group: one(groups, { fields: [courses.groupId], references: [groups.id] }),
  modules: many(courseModules),
  enrollments: many(courseEnrollments),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, {
    fields: [courseLessons.moduleId],
    references: [courseModules.id],
  }),
  sections: many(courseSections),
}));

export const courseSectionsRelations = relations(
  courseSections,
  ({ one, many }) => ({
    lesson: one(courseLessons, {
      fields: [courseSections.lessonId],
      references: [courseLessons.id],
    }),
    tasks: many(tasks),
    taskGroups: many(taskGroups),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  section: one(courseSections, {
    fields: [tasks.sectionId],
    references: [courseSections.id],
  }),
  answers: many(taskAnswers),
}));

export const taskAnswersRelations = relations(taskAnswers, ({ one }) => ({
  task: one(tasks, { fields: [taskAnswers.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAnswers.userId], references: [users.id] }),
}));

export const verseLearnItemsRelations = relations(verseLearnItems, ({ one }) => ({
  owner: one(users, {
    fields: [verseLearnItems.ownerId],
    references: [users.id],
  }),
  book: one(bibleBooks, {
    fields: [verseLearnItems.bookId],
    references: [bibleBooks.id],
  }),
  translation: one(bibleTranslations, {
    fields: [verseLearnItems.translationId],
    references: [bibleTranslations.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
}));

// ====================================================================
// Type-Exports für die App
// ====================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type CourseModule = typeof courseModules.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type CourseSection = typeof courseSections.$inferSelect;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskAnswer = typeof taskAnswers.$inferSelect;

export type VerseLearnItem = typeof verseLearnItems.$inferSelect;
export type BibleBook = typeof bibleBooks.$inferSelect;
export type BibleTranslation = typeof bibleTranslations.$inferSelect;

export type UserProgress = typeof userProgress.$inferSelect;
