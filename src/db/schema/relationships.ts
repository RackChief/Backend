import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { assets } from "./assets.js";

export const assetRelationshipType = pgEnum("asset_relationship_type", ["hosts", "runs_on", "depends_on", "backs_up_to", "managed_by", "powered_by", "connected_to", "other"]);
export const assetRelationships = pgTable("asset_relationships", {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceAssetId: uuid("source_asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
    targetAssetId: uuid("target_asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
    relationshipType: assetRelationshipType("relationship_type").notNull(), notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("asset_relationships_unique_idx").on(table.sourceAssetId, table.targetAssetId, table.relationshipType), index("asset_relationships_target_idx").on(table.targetAssetId)]);
export type AssetRelationship = typeof assetRelationships.$inferSelect;
