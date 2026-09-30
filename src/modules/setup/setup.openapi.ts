import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";

export function registerSetupOpenApi(registry: OpenAPIRegistry) {
    registry.registerPath({ method: "get", path: "/api/v1/setup/status", tags: ["Setup"], summary: "Check whether first-run setup is required", responses: { 200: { description: "Setup state", content: { "application/json": { schema: z.object({ setupRequired: z.boolean() }) } } } } });
    registry.registerPath({ method: "post", path: "/api/v1/setup/admin", tags: ["Setup"], summary: "Create the first administrator", request: { body: { required: true, content: { "application/json": { schema: z.object({ email: z.email(), password: z.string().min(8), name: z.string().min(1) }) } } } }, responses: { 201: { description: "Administrator created" }, 400: { description: "Invalid setup data" }, 409: { description: "Setup is already complete or in progress" } } });
}
