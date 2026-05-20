CREATE TABLE "verse_audio" (
	"verse_id" uuid PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"filename" varchar(255),
	"size_bytes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verse_audio" ADD CONSTRAINT "verse_audio_verse_id_verse_learn_items_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verse_learn_items"("id") ON DELETE cascade ON UPDATE no action;