import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
import { createMcpTokenResponseSchema, createMcpTokenSchema, mcpSettingsSchema,
    mcpTokenIdParamsSchema, mcpTokenSchema, updateMcpSettingsSchema,
    updateMcpTokenSchema } from "./mcp-admin.schema.js";

const security = [{ cookieAuth: [] }];
const response = (schema: z.ZodType, description: string) => ({
    description, content: { "application/json": { schema } },
});
const body = (schema: z.ZodType) => ({
    required: true, content: { "application/json": { schema } },
});
const errors = { 400: { description: "Invalid request" },
    401: { description: "Authentication required" },
    404: { description: "MCP token not found" } };

export function registerMcpAdminOpenApi(registry: OpenAPIRegistry) {
    registry.register("McpSettings", mcpSettingsSchema);
    registry.register("UpdateMcpSettings", updateMcpSettingsSchema);
    registry.register("McpToken", mcpTokenSchema);
    registry.register("CreateMcpToken", createMcpTokenSchema);
    registry.register("CreateMcpTokenResponse", createMcpTokenResponseSchema);
    registry.register("UpdateMcpToken", updateMcpTokenSchema);
    registry.registerPath({ method: "get", path: "/api/v1/settings/mcp", tags: ["MCP Administration"],
        summary: "Get MCP enablement", security,
        responses: { 200: response(mcpSettingsSchema, "Current setting"), 401: errors[401] } });
    registry.registerPath({ method: "patch", path: "/api/v1/settings/mcp", tags: ["MCP Administration"],
        summary: "Enable or disable MCP", security, request: { body: body(updateMcpSettingsSchema) },
        responses: { 200: response(mcpSettingsSchema, "Updated setting"), 400: errors[400], 401: errors[401] } });
    registry.registerPath({ method: "get", path: "/api/v1/mcp-tokens", tags: ["MCP Administration"],
        summary: "List MCP token metadata", security,
        responses: { 200: response(z.array(mcpTokenSchema), "Tokens without secrets"), 401: errors[401] } });
    registry.registerPath({ method: "post", path: "/api/v1/mcp-tokens", tags: ["MCP Administration"],
        summary: "Create an MCP token; raw token returned once", security,
        request: { body: body(createMcpTokenSchema) },
        responses: { 201: response(createMcpTokenResponseSchema, "Created token"), 400: errors[400], 401: errors[401] } });
    registry.registerPath({ method: "patch", path: "/api/v1/mcp-tokens/{id}", tags: ["MCP Administration"],
        summary: "Update MCP token metadata", security,
        request: { params: mcpTokenIdParamsSchema, body: body(updateMcpTokenSchema) },
        responses: { 200: response(mcpTokenSchema, "Updated token"), ...errors } });
    registry.registerPath({ method: "delete", path: "/api/v1/mcp-tokens/{id}", tags: ["MCP Administration"],
        summary: "Permanently revoke an MCP token", security,
        request: { params: mcpTokenIdParamsSchema },
        responses: { 204: { description: "Token deleted" }, ...errors } });
}
