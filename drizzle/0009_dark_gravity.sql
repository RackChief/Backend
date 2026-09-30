ALTER TABLE "assets" ADD COLUMN "device_type_source" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "device_type_path" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "device_type_data" jsonb;