import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
import { registerResourcePath, idParam, rackIdParam, placementParam } from "../../openapi/resource.js";
import { rackSchema, rackDetailSchema, placementSchema, createRackSchema, updateRackSchema, createPlacementSchema, updatePlacementSchema } from "./rack.schema.js";
export function registerRackOpenApi(registry: OpenAPIRegistry) {
    const path = "/api/v1/racks", tag = "Racks";
    registerResourcePath(registry, { method: "get", path, tag, summary: "List racks", response: z.array(rackSchema) });
    registerResourcePath(registry, { method: "get", path: `${path}/{id}`, tag, summary: "Get rack with placements", response: rackDetailSchema, params: idParam });
    registerResourcePath(registry, { method: "post", path, tag, summary: "Create rack", response: rackSchema, body: createRackSchema });
    registerResourcePath(registry, { method: "patch", path: `${path}/{id}`, tag, summary: "Update rack", response: rackSchema, body: updateRackSchema, params: idParam });
    registerResourcePath(registry, { method: "delete", path: `${path}/{id}`, tag, summary: "Delete empty rack", params: idParam });
    const placements = `${path}/{rackId}/placements`;
    registerResourcePath(registry, { method: "get", path: placements, tag, summary: "List rack placements", response: z.array(placementSchema), params: rackIdParam });
    registerResourcePath(registry, { method: "post", path: placements, tag, summary: "Place asset in rack", response: placementSchema.omit({ asset: true }), body: createPlacementSchema, params: rackIdParam });
    registerResourcePath(registry, { method: "patch", path: `${placements}/{placementId}`, tag, summary: "Update rack placement", response: placementSchema.omit({ asset: true }), body: updatePlacementSchema, params: placementParam });
    registerResourcePath(registry, { method: "delete", path: `${placements}/{placementId}`, tag, summary: "Remove rack placement", params: placementParam });
}
