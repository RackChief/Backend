import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "./zod.js";
type Schema = z.ZodType;
export function registerResourcePath(registry: OpenAPIRegistry, spec: {
    method: "get" | "post" | "patch" | "delete";
    path: string; tag: string; summary: string;
    response?: Schema; body?: Schema; query?: Schema; params?: Schema;
    status?: 200 | 201 | 204;
}) {
    const status = spec.status ?? (spec.method === "post" ? 201 : spec.method === "delete" ? 204 : 200);
    registry.registerPath({
        method: spec.method, path: spec.path, tags: [spec.tag], summary: spec.summary,
        security: [{ bearerAuth: [] }],
        request: {
            ...(spec.params ? { params: spec.params } : {}),
            ...(spec.query ? { query: spec.query } : {}),
            ...(spec.body ? { body: { required: true, content: { "application/json": { schema: spec.body } } } } : {}),
        } as Parameters<OpenAPIRegistry["registerPath"]>[0]["request"],
        responses: {
            [status]: { description: spec.summary, ...(spec.response ? { content: { "application/json": { schema: spec.response } } } : {}) },
            400: { description: "Invalid request" },
            401: { description: "Authentication required" },
            404: { description: "Resource not found" },
            409: { description: "Conflict with existing inventory" },
        },
    });
}
export const idParam = z.object({ id: z.uuid() });
export const assetIdParam = z.object({ assetId: z.uuid() });
export const interfaceIdParam = z.object({ interfaceId: z.uuid() });
export const rackIdParam = z.object({ rackId: z.uuid() });
export const placementParam = z.object({ rackId: z.uuid(), placementId: z.uuid() });
export function registerCrud(registry: OpenAPIRegistry, spec: {
    path: string; tag: string; name: string; response: Schema; create: Schema; update: Schema; listQuery?: Schema;
}) {
    const { path, tag, name, response, create, update, listQuery } = spec;
    registerResourcePath(registry, { method: "get", path, tag, summary: `List ${name}`, response: z.array(response), query: listQuery });
    registerResourcePath(registry, { method: "get", path: `${path}/{id}`, tag, summary: `Get ${name}`, response, params: idParam });
    registerResourcePath(registry, { method: "post", path, tag, summary: `Create ${name}`, response, body: create });
    registerResourcePath(registry, { method: "patch", path: `${path}/{id}`, tag, summary: `Update ${name}`, response, body: update, params: idParam });
    registerResourcePath(registry, { method: "delete", path: `${path}/{id}`, tag, summary: `Delete ${name}`, params: idParam });
}
