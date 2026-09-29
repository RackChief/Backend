import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerCrud } from "../../openapi/resource.js";
import { locationSchema, createLocationSchema, updateLocationSchema } from "./location.schema.js";
export function registerLocationOpenApi(registry: OpenAPIRegistry) {
    registerCrud(registry, { path: "/api/v1/locations", tag: "Locations", name: "location", response: locationSchema, create: createLocationSchema, update: updateLocationSchema });
}
