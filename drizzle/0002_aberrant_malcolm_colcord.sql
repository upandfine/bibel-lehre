CREATE TABLE "course_lesson_verses" (
	"lesson_id" uuid NOT NULL,
	"verse_learn_item_id" uuid NOT NULL,
	"order_index" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "course_lesson_verses_lesson_id_verse_learn_item_id_pk" PRIMARY KEY("lesson_id","verse_learn_item_id")
);
--> statement-breakpoint
ALTER TABLE "course_lesson_verses" ADD CONSTRAINT "course_lesson_verses_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lesson_verses" ADD CONSTRAINT "course_lesson_verses_verse_learn_item_id_verse_learn_items_id_fk" FOREIGN KEY ("verse_learn_item_id") REFERENCES "public"."verse_learn_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_lesson_verses_lesson_idx" ON "course_lesson_verses" USING btree ("lesson_id");