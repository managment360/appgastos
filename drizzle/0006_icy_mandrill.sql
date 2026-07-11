CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"type" text NOT NULL,
	"actor_name" text,
	"message" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "claimed_by" text;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;