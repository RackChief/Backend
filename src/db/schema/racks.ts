import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { assets } from "./assets.js";
import { locations } from "./locations.js";

export const rackOrientation = pgEnum("rack_orientation", ["front", "rear"]);
export const racks = pgTable("racks", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(), description: text("description"),
    totalUnits: integer("total_units").notNull(), startingUnit: integer("starting_unit").notNull().default(1),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "restrict" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("racks_location_id_idx").on(table.locationId)]);
export const rackPlacements = pgTable("rack_placements", {
    id: uuid("id").primaryKey().defaultRandom(),
    rackId: uuid("rack_id").notNull().references(() => racks.id, { onDelete: "restrict" }),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
    startUnit: integer("start_unit").notNull(), heightUnits: integer("height_units").notNull().default(1),
    orientation: rackOrientation("orientation").notNull().default("front"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("rack_placements_rack_id_idx").on(table.rackId), uniqueIndex("rack_placements_asset_orientation_idx").on(table.assetId, table.orientation)]);
export type Rack = typeof racks.$inferSelect;
export type NewRack = typeof racks.$inferInsert;
export type RackPlacement = typeof rackPlacements.$inferSelect;
export type NewRackPlacement = typeof rackPlacements.$inferInsert;
