import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const assetStatus = pgEnum("asset_status", [
    "planned",
    "active",
    "offline",
    "retired",
    "archived",
]);

export const assets = pgTable("assets", {
    id: uuid("id").primaryKey().defaultRandom(),

    name: text("name").notNull(),

    status: assetStatus("status")
        .notNull()
        .default("active"),

    hostname: text("hostname"),

    notes: text("notes"),

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
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
