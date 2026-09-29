CREATE TYPE "public"."project_item_status" AS ENUM('planned', 'committed', 'in_progress', 'ordered', 'received', 'completed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."project_item_type" AS ENUM('work', 'purchase');--> statement-breakpoint
CREATE TYPE "public"."project_priority" AS ENUM('low', 'normal', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('idea', 'planned', 'committed', 'in_progress', 'waiting', 'completed', 'cancelled', 'archived');--> statement-breakpoint
CREATE TABLE "project_assets" (
	"project_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	CONSTRAINT "project_assets_project_id_asset_id_pk" PRIMARY KEY("project_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "project_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" "project_item_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "project_item_status" DEFAULT 'planned' NOT NULL,
	"target_date" date,
	"vendor" text,
	"url" text,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"shipping_cost" numeric(12, 2),
	"ordered_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"sort_order" numeric(10, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'idea' NOT NULL,
	"priority" "project_priority" DEFAULT 'normal' NOT NULL,
	"target_date" date,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"notes" text,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_items_project_id_idx" ON "project_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_items_status_idx" ON "project_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_items_target_date_idx" ON "project_items" USING btree ("target_date");--> statement-breakpoint
CREATE INDEX "project_updates_project_id_idx" ON "project_updates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_target_date_idx" ON "projects" USING btree ("target_date");