import { boolean, index, integer, numeric, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const catalogProviders = pgTable("catalog_providers", {
  providerId: text("provider_id").primaryKey(),
  name: text("name").notNull(),
  revision: text("revision").notNull(),
  fingerprint: text("fingerprint").notNull(),
  indexedAt: timestamp("indexed_at", { withTimezone: true }).notNull().defaultNow(),
  entryCount: integer("entry_count").notNull(),
  skippedCount: integer("skipped_count").notNull().default(0),
});

export const catalogManufacturers = pgTable("catalog_manufacturers", {
  providerId: text("provider_id").notNull().references(() => catalogProviders.providerId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  deviceCount: integer("device_count").notNull(),
}, table => [primaryKey({ columns: [table.providerId, table.name] })]);

export const catalogDeviceTypes = pgTable("catalog_device_types", {
  providerId: text("provider_id").notNull(),
  deviceId: text("device_id").notNull(),
  sourceRevision: text("source_revision").notNull(),
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  slug: text("slug").notNull(),
  partNumber: text("part_number"),
  uHeight: numeric("u_height", { precision: 5, scale: 2, mode: "number" }),
  isFullDepth: boolean("is_full_depth"),
  airflow: text("airflow"),
  weight: numeric("weight", { precision: 12, scale: 3, mode: "number" }),
  weightUnit: text("weight_unit"),
  frontImagePath: text("front_image_path"),
  rearImagePath: text("rear_image_path"),
}, table => [
  primaryKey({ columns: [table.providerId, table.deviceId] }),
  index("catalog_device_types_manufacturer_idx").on(table.providerId, table.manufacturer),
]);

export type CatalogProviderRow = typeof catalogProviders.$inferSelect;
export type CatalogDeviceTypeRow = typeof catalogDeviceTypes.$inferSelect;
