ALTER TABLE "assets" ADD COLUMN "rack_units" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE "assets" SET "rack_units" = GREATEST(1, COALESCE((SELECT MAX("height_units") FROM "rack_placements" WHERE "rack_placements"."asset_id" = "assets"."id"), 1));
--> statement-breakpoint
UPDATE "rack_placements" SET "height_units" = "assets"."rack_units" FROM "assets" WHERE "rack_placements"."asset_id" = "assets"."id";
