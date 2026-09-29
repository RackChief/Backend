import {
    boolean,
    date,
    index,
    inet,
    numeric,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";

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
    ],
);

export type AssetType = typeof assetTypes.$inferSelect;
export type NewAssetType = typeof assetTypes.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export const projectStatus = pgEnum("project_status", [
    "idea", "planned", "committed", "in_progress", "waiting",
    "completed", "cancelled", "archived",
]);

export const projectPriority = pgEnum("project_priority", [
    "low", "normal", "high", "critical",
]);

export const projectItemType = pgEnum("project_item_type", ["work", "purchase"]);

export const projectItemStatus = pgEnum("project_item_status", [
    "planned", "committed", "in_progress", "ordered", "received",
    "completed", "blocked", "cancelled",
]);

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatus("status").notNull().default("idea"),
    priority: projectPriority("priority").notNull().default("normal"),
    targetDate: date("target_date"),
    estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2, mode: "number" }),
    actualCost: numeric("actual_cost", { precision: 12, scale: 2, mode: "number" }),
    notes: text("notes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("projects_status_idx").on(table.status),
    index("projects_target_date_idx").on(table.targetDate),
]);

export const projectAssets = pgTable("project_assets", {
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.projectId, table.assetId] })]);

export const projectItems = pgTable("project_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    type: projectItemType("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: projectItemStatus("status").notNull().default("planned"),
    targetDate: date("target_date"),
    vendor: text("vendor"),
    url: text("url"),
    estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2, mode: "number" }),
    actualCost: numeric("actual_cost", { precision: 12, scale: 2, mode: "number" }),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2, mode: "number" }),
    orderedAt: timestamp("ordered_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    sortOrder: numeric("sort_order", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("project_items_project_id_idx").on(table.projectId),
    index("project_items_status_idx").on(table.status),
    index("project_items_target_date_idx").on(table.targetDate),
]);

export const projectUpdates = pgTable("project_updates", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("project_updates_project_id_idx").on(table.projectId)]);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectItem = typeof projectItems.$inferSelect;
export type NewProjectItem = typeof projectItems.$inferInsert;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
