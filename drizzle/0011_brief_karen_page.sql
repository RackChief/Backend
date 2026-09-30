CREATE TABLE "catalog_device_types" (
	"provider_id" text NOT NULL,
	"device_id" text NOT NULL,
	"source_revision" text NOT NULL,
	"manufacturer" text NOT NULL,
	"model" text NOT NULL,
	"slug" text NOT NULL,
	"part_number" text,
	"u_height" numeric(5, 2),
	"is_full_depth" boolean,
	"airflow" text,
	"weight" numeric(12, 3),
	"weight_unit" text,
	"front_image_path" text,
	"rear_image_path" text,
	CONSTRAINT "catalog_device_types_provider_id_device_id_pk" PRIMARY KEY("provider_id","device_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_manufacturers" (
	"provider_id" text NOT NULL,
	"name" text NOT NULL,
	"device_count" integer NOT NULL,
	CONSTRAINT "catalog_manufacturers_provider_id_name_pk" PRIMARY KEY("provider_id","name")
);
--> statement-breakpoint
CREATE TABLE "catalog_providers" (
	"provider_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"revision" text NOT NULL,
	"fingerprint" text NOT NULL,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entry_count" integer NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalog_manufacturers" ADD CONSTRAINT "catalog_manufacturers_provider_id_catalog_providers_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."catalog_providers"("provider_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_device_types_manufacturer_idx" ON "catalog_device_types" USING btree ("provider_id","manufacturer");