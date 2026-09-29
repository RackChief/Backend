import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
import { registerCrud } from "../../openapi/resource.js";
import { relationshipSchema, createRelationshipSchema, updateRelationshipSchema } from "./relationship.schema.js";
export function registerRelationshipOpenApi(registry: OpenAPIRegistry) {
    registerCrud(registry, { path: "/api/v1/asset-relationships", tag: "Asset Relationships", name: "asset relationship", response: relationshipSchema, create: createRelationshipSchema, update: updateRelationshipSchema, listQuery: z.object({ assetId: z.uuid().optional() }) });
}
