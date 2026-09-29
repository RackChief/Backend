import { locations } from "./locations.js";
import { boolean, date, index, inet, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
export const assetStatus = pgEnum("asset_status", [
    "planned",
    "active",
    "offline",
    "retired",
    "archived",
]);

export const assetTypes = pgTable(
    "asset_types",
    {
        id: uuid("id")
            .primaryKey()
            .defaultRandom(),

        name: text("name")
            .notNull(),

        slug: text("slug")
            .notNull(),

        description: text("description"),

        builtIn: boolean("built_in")
            .notNull()
            .default(false),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        uniqueIndex("asset_types_slug_idx").on(table.slug),
    ],
);

export const assets = pgTable(
    "assets",
    {
        id: uuid("id")
            .primaryKey()
            .defaultRandom(),

        assetTypeId: uuid("asset_type_id")
            .notNull()
            .references(() => assetTypes.id, {
                onDelete: "restrict",
            }),

        name: text("name")
            .notNull(),

        status: assetStatus("status")
            .notNull()
            .default("active"),

        locationId: uuid("location_id").references(() => locations.id, { onDelete: "restrict" }),

        hostname: text("hostname"),

        ipAddress: inet("ip_address"),

        manufacturer: text("manufacturer"),
        model: text("model"),
        serialNumber: text("serial_number"),

        notes: text("notes"),

        archivedAt: timestamp("archived_at", {
            withTimezone: true,
        }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("assets_asset_type_idx").on(table.assetTypeId),
        index("assets_status_idx").on(table.status),
        index("assets_location_id_idx").on(table.locationId),
    ],
);

export type AssetType = typeof assetTypes.$inferSelect;
export type NewAssetType = typeof assetTypes.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
