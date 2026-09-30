import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
const summary = z.object({ provider: z.string(), id: z.string(), sourceRevision: z.string(), manufacturer: z.string(), model: z.string(), slug: z.string(), partNumber: z.string().nullable(), uHeight: z.number().nullable(), frontImageAvailable: z.boolean(), rearImageAvailable: z.boolean() });
export function registerCatalogOpenApi(registry: OpenAPIRegistry) {
  registry.registerPath({ method: "get", path: "/api/v1/catalog/device-types", tags: ["Catalog"], security: [{ cookieAuth: [] }], request: { query: z.object({ q: z.string().optional(), manufacturer: z.string().optional(), uHeight: z.coerce.number().optional(), hasFrontImage: z.coerce.boolean().optional(), hasRearImage: z.coerce.boolean().optional(), limit: z.coerce.number().optional(), offset: z.coerce.number().optional() }) }, responses: { 200: { description: "Catalog device summaries", content: { "application/json": { schema: z.array(summary) } } } } });
  registry.registerPath({ method: "get", path: "/api/v1/catalog/manufacturers", tags: ["Catalog"], security: [{ cookieAuth: [] }], responses: { 200: { description: "Catalog manufacturers", content: { "application/json": { schema: z.array(z.object({ name: z.string(), deviceCount: z.number() })) } } } } });
}
