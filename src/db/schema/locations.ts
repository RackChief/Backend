import { index, pgTable, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("locations_parent_id_idx").on(table.parentId)]);
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
