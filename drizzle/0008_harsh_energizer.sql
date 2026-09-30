ALTER TABLE "assets" ALTER COLUMN "rack_units" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "assets" ALTER COLUMN "rack_units" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "rack_placements" ALTER COLUMN "height_units" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "rack_placements" ALTER COLUMN "height_units" SET DEFAULT 1;