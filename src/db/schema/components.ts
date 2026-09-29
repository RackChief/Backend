import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, integer } from "drizzle-orm/pg-core";
import { assets } from "./assets.js";
import { locations } from "./locations.js";

export const componentStatus = pgEnum("component_status", ["installed", "spare", "planned", "retired", "failed"]);
export const componentTypes = pgTable("component_types", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    builtIn: boolean("built_in").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("component_types_slug_idx").on(table.slug)]);
export const components = pgTable("components", {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "restrict" }),
    componentTypeId: uuid("component_type_id").notNull().references(() => componentTypes.id, { onDelete: "restrict" }),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    manufacturer: text("manufacturer"), model: text("model"), partNumber: text("part_number"), serialNumber: text("serial_number"),
    quantity: integer("quantity").notNull().default(1),
    status: componentStatus("status").notNull(),
    attributes: jsonb("attributes").$type<Record<string, unknown>>().notNull().default({}),
    storageLocation: text("storage_location"),
    installedAt: timestamp("installed_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("components_asset_id_idx").on(table.assetId), index("components_type_id_idx").on(table.componentTypeId), index("components_location_id_idx").on(table.locationId)]);
export type Component = typeof components.$inferSelect;
export type NewComponent = typeof components.$inferInsert;
