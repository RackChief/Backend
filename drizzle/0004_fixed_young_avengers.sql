CREATE TYPE "public"."component_status" AS ENUM('installed', 'spare', 'planned', 'retired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."rack_orientation" AS ENUM('front', 'rear');--> statement-breakpoint
CREATE TYPE "public"."network_connection_type" AS ENUM('copper', 'fiber', 'dac', 'other');--> statement-breakpoint
CREATE TYPE "public"."network_interface_type" AS ENUM('ethernet', 'wireless', 'virtual', 'bridge', 'bond', 'loopback', 'other');--> statement-breakpoint
CREATE TYPE "public"."network_port_type" AS ENUM('rj45', 'sfp', 'sfp_plus', 'sfp28', 'qsfp', 'qsfp28', 'fiber', 'other');--> statement-breakpoint
CREATE TYPE "public"."asset_relationship_type" AS ENUM('hosts', 'runs_on', 'depends_on', 'backs_up_to', 'managed_by', 'powered_by', 'connected_to', 'other');--> statement-breakpoint
CREATE TABLE "component_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid,
	"component_type_id" uuid NOT NULL,
	"location_id" uuid,
	"name" text NOT NULL,
	"manufacturer" text,
	"model" text,
	"part_number" text,
	"serial_number" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" "component_status" NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"storage_location" text,
	"installed_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rack_placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rack_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"start_unit" integer NOT NULL,
	"height_units" integer DEFAULT 1 NOT NULL,
	"orientation" "rack_orientation" DEFAULT 'front' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "racks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_units" integer NOT NULL,
	"starting_unit" integer DEFAULT 1 NOT NULL,
	"location_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"network_interface_id" uuid NOT NULL,
	"address" "inet" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"port_a_id" uuid NOT NULL,
	"port_b_id" uuid NOT NULL,
	"connection_type" "network_connection_type",
	"label" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_interfaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"mac_address" text,
	"speed_mbps" integer,
	"interface_type" "network_interface_type" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "network_ports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"interface_id" uuid,
	"name" text NOT NULL,
	"port_number" integer,
	"port_type" "network_port_type" NOT NULL,
	"speed_mbps" integer,
	"poe_capable" boolean DEFAULT false NOT NULL,
	"poe_enabled" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"description" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_asset_id" uuid NOT NULL,
	"target_asset_id" uuid NOT NULL,
	"relationship_type" "asset_relationship_type" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_component_type_id_component_types_id_fk" FOREIGN KEY ("component_type_id") REFERENCES "public"."component_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rack_placements" ADD CONSTRAINT "rack_placements_rack_id_racks_id_fk" FOREIGN KEY ("rack_id") REFERENCES "public"."racks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rack_placements" ADD CONSTRAINT "rack_placements_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racks" ADD CONSTRAINT "racks_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ip_addresses" ADD CONSTRAINT "ip_addresses_network_interface_id_network_interfaces_id_fk" FOREIGN KEY ("network_interface_id") REFERENCES "public"."network_interfaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_connections" ADD CONSTRAINT "network_connections_port_a_id_network_ports_id_fk" FOREIGN KEY ("port_a_id") REFERENCES "public"."network_ports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_connections" ADD CONSTRAINT "network_connections_port_b_id_network_ports_id_fk" FOREIGN KEY ("port_b_id") REFERENCES "public"."network_ports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_interfaces" ADD CONSTRAINT "network_interfaces_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_ports" ADD CONSTRAINT "network_ports_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "network_ports" ADD CONSTRAINT "network_ports_interface_id_network_interfaces_id_fk" FOREIGN KEY ("interface_id") REFERENCES "public"."network_interfaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_source_asset_id_assets_id_fk" FOREIGN KEY ("source_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_target_asset_id_assets_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "component_types_slug_idx" ON "component_types" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "components_asset_id_idx" ON "components" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "components_type_id_idx" ON "components" USING btree ("component_type_id");--> statement-breakpoint
CREATE INDEX "components_location_id_idx" ON "components" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "locations_parent_id_idx" ON "locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "rack_placements_rack_id_idx" ON "rack_placements" USING btree ("rack_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rack_placements_asset_orientation_idx" ON "rack_placements" USING btree ("asset_id","orientation");--> statement-breakpoint
CREATE INDEX "racks_location_id_idx" ON "racks" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "ip_addresses_interface_id_idx" ON "ip_addresses" USING btree ("network_interface_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ip_addresses_interface_address_idx" ON "ip_addresses" USING btree ("network_interface_id","address");--> statement-breakpoint
CREATE UNIQUE INDEX "network_connections_port_a_idx" ON "network_connections" USING btree ("port_a_id");--> statement-breakpoint
CREATE UNIQUE INDEX "network_connections_port_b_idx" ON "network_connections" USING btree ("port_b_id");--> statement-breakpoint
CREATE INDEX "network_interfaces_asset_id_idx" ON "network_interfaces" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "network_interfaces_asset_name_idx" ON "network_interfaces" USING btree ("asset_id","name");--> statement-breakpoint
CREATE INDEX "network_ports_asset_id_idx" ON "network_ports" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "network_ports_interface_id_idx" ON "network_ports" USING btree ("interface_id");--> statement-breakpoint
CREATE UNIQUE INDEX "network_ports_asset_name_idx" ON "network_ports" USING btree ("asset_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_relationships_unique_idx" ON "asset_relationships" USING btree ("source_asset_id","target_asset_id","relationship_type");--> statement-breakpoint
CREATE INDEX "asset_relationships_target_idx" ON "asset_relationships" USING btree ("target_asset_id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_location_id_idx" ON "assets" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "project_assets_asset_id_idx" ON "project_assets" USING btree ("asset_id");--> statement-breakpoint
ALTER TABLE "components" ADD CONSTRAINT "components_quantity_positive" CHECK ("quantity" >= 1);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_not_self_parent" CHECK ("parent_id" IS NULL OR "parent_id" <> "id");
--> statement-breakpoint
ALTER TABLE "racks" ADD CONSTRAINT "racks_valid_units" CHECK ("total_units" BETWEEN 1 AND 100 AND "starting_unit" >= 1);
--> statement-breakpoint
ALTER TABLE "rack_placements" ADD CONSTRAINT "rack_placements_valid_units" CHECK ("start_unit" >= 1 AND "height_units" >= 1);
--> statement-breakpoint
ALTER TABLE "network_connections" ADD CONSTRAINT "network_connections_different_ports" CHECK ("port_a_id" <> "port_b_id");
--> statement-breakpoint
ALTER TABLE "asset_relationships" ADD CONSTRAINT "asset_relationships_different_assets" CHECK ("source_asset_id" <> "target_asset_id");
--> statement-breakpoint
INSERT INTO "component_types" ("name", "slug", "built_in") VALUES
('CPU', 'cpu', true), ('Memory', 'memory', true), ('Disk', 'disk', true), ('SSD', 'ssd', true),
('GPU', 'gpu', true), ('Network Adapter', 'network-adapter', true), ('HBA', 'hba', true),
('RAID Controller', 'raid-controller', true), ('Power Supply', 'power-supply', true),
('Fan', 'fan', true), ('Optical Drive', 'optical-drive', true), ('Other', 'other', true)
ON CONFLICT ("slug") DO NOTHING;
