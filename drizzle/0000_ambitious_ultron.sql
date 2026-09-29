CREATE TYPE "public"."asset_status" AS ENUM('planned', 'active', 'offline', 'retired', 'archived');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "asset_status" DEFAULT 'active' NOT NULL,
	"hostname" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
