CREATE TABLE "asset_types" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "description" text,
    "built_in" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX "asset_types_slug_idx"
ON "asset_types" USING btree ("slug");
--> statement-breakpoint


ALTER TABLE "assets"
ADD COLUMN "asset_type_id" uuid;
--> statement-breakpoint

ALTER TABLE "assets"
ADD COLUMN "ip_address" inet;
--> statement-breakpoint

ALTER TABLE "assets"
ADD COLUMN "manufacturer" text;
--> statement-breakpoint

ALTER TABLE "assets"
ADD COLUMN "model" text;
--> statement-breakpoint

ALTER TABLE "assets"
ADD COLUMN "serial_number" text;
--> statement-breakpoint

ALTER TABLE "assets"
ADD COLUMN "archived_at" timestamp with time zone;
--> statement-breakpoint


INSERT INTO "asset_types"
    ("name", "slug", "description", "built_in")
VALUES
    (
        'Server',
        'server',
        'Physical server or compute host',
        true
    ),
    (
        'Switch',
        'switch',
        'Network switch',
        true
    ),
    (
        'Router / Firewall',
        'router-firewall',
        'Router, firewall, or gateway',
        true
    ),
    (
        'Wireless AP',
        'wireless-ap',
        'Wireless access point',
        true
    ),
    (
        'Storage',
        'storage',
        'NAS, SAN, or other storage appliance',
        true
    ),
    (
        'UPS',
        'ups',
        'Uninterruptible power supply',
        true
    ),
    (
        'Rack',
        'rack',
        'Equipment rack or cabinet',
        true
    ),
    (
        'Generic',
        'generic',
        'Generic infrastructure asset',
        true
    );
--> statement-breakpoint


UPDATE "assets"
SET "asset_type_id" = (
    SELECT "id"
    FROM "asset_types"
    WHERE "slug" = 'server'
)
WHERE "asset_type_id" IS NULL;
--> statement-breakpoint


ALTER TABLE "assets"
ALTER COLUMN "asset_type_id" SET NOT NULL;
--> statement-breakpoint


ALTER TABLE "assets"
ADD CONSTRAINT "assets_asset_type_id_asset_types_id_fk"
FOREIGN KEY ("asset_type_id")
REFERENCES "public"."asset_types"("id")
ON DELETE restrict
ON UPDATE no action;
--> statement-breakpoint


CREATE INDEX "assets_asset_type_idx"
ON "assets" USING btree ("asset_type_id");
--> statement-breakpoint

CREATE INDEX "assets_status_idx"
ON "assets" USING btree ("status");
