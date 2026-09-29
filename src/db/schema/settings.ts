import { boolean, date, index, inet, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
export const appSettings = pgTable("app_settings", {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mcpTokens = pgTable("mcp_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    enabled: boolean("enabled").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("mcp_tokens_enabled_idx").on(table.enabled),
    index("mcp_tokens_expires_at_idx").on(table.expiresAt),
]);

export type AppSetting = typeof appSettings.$inferSelect;
export type McpToken = typeof mcpTokens.$inferSelect;
export type NewMcpToken = typeof mcpTokens.$inferInsert;
