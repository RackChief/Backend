import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
import { registerCrud, registerResourcePath, idParam } from "../../openapi/resource.js";
import { componentSchema, componentTypeSchema, createComponentSchema, updateComponentSchema, componentFilterSchema, createComponentTypeSchema } from "./component.schema.js";
export function registerComponentOpenApi(registry: OpenAPIRegistry) {
    registerResourcePath(registry, { method: "get", path: "/api/v1/component-types", tag: "Components", summary: "List component types", response: z.array(componentTypeSchema) });
    registerResourcePath(registry, { method: "get", path: "/api/v1/component-types/{id}", tag: "Components", summary: "Get component type", response: componentTypeSchema, params: idParam });
    registerResourcePath(registry, { method: "post", path: "/api/v1/component-types", tag: "Components", summary: "Create custom component type", response: componentTypeSchema, body: createComponentTypeSchema });
    registerCrud(registry, { path: "/api/v1/components", tag: "Components", name: "component", response: componentSchema, create: createComponentSchema, update: updateComponentSchema, listQuery: componentFilterSchema });
}
