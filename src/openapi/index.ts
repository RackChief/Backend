import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import { z } from "./zod.js";
import { registerComponentOpenApi } from "../modules/components/component.openapi.js";
import { registerLocationOpenApi } from "../modules/locations/location.openapi.js";
import { registerRackOpenApi } from "../modules/racks/rack.openapi.js";
import { registerNetworkOpenApi } from "../modules/networking/network.openapi.js";
import { registerRelationshipOpenApi } from "../modules/relationships/relationship.openapi.js";

import {
    registerAssetOpenApi,
} from "../modules/assets/asset.openapi.js";

import {
    registerAssetTypeOpenApi,
} from "../modules/asset-types/asset-type.openapi.js";
import { registerMcpAdminOpenApi } from "../modules/mcp-admin/mcp-admin.openapi.js";
import { registerProjectOpenApi } from "../modules/projects/project.openapi.js";
import { registerDeviceImageOpenApi } from "../modules/device-images/device-image.openapi.js";
import { registerSetupOpenApi } from "../modules/setup/setup.openapi.js";
import { registerCatalogOpenApi } from "../modules/catalog/catalog.openapi.js";

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "cookieAuth", { type: "apiKey", in: "cookie", name: "better-auth.session_token", description: "Better Auth session cookie. The browser sends this automatically with credentials." });
registry.registerComponent(
    "securitySchemes",
    "bearerAuth",
    {
        type: "http",
        scheme: "bearer",
        description: "RackChief MCP tokens only. Browser REST authentication uses Better Auth HttpOnly session cookies.",
    },
);

registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["System"],
    summary: "Health check",
    responses: {
        200: {
            description: "RackChief API is healthy",
            content: {
                "application/json": {
                    schema: z.object({
                        status: z.literal("ok"),
                    }),
                },
            },
        },
        503: {
            description: "Starting or PostgreSQL unavailable",
            content: {
                "application/json": {
                    schema: z.union([z.object({ status: z.literal("unavailable") }), z.object({ status: z.literal("starting"), phase: z.string(), message: z.string(), catalog: z.object({ status: z.string(), revision: z.string().optional(), entryCount: z.number().optional(), message: z.string().optional() }) })]),
                },
            },
        },
    },
});

registry.registerPath({ method: "get", path: "/startup/status", tags: ["System"], summary: "Poll startup phase", responses: { 200: { description: "Ready" }, 202: { description: "Startup in progress" }, 503: { description: "Startup failed" } } });
registerAssetOpenApi(registry);
registerAssetTypeOpenApi(registry);
registerProjectOpenApi(registry);
registerMcpAdminOpenApi(registry);
registerComponentOpenApi(registry);
registerLocationOpenApi(registry);
registerRackOpenApi(registry);
registerNetworkOpenApi(registry);
registerRelationshipOpenApi(registry);
registerDeviceImageOpenApi(registry);
registerSetupOpenApi(registry);
registerCatalogOpenApi(registry);
registry.registerPath({ method: "get", path: "/api/v1/device-library/device-types", tags: ["Device library compatibility"], security: [{ cookieAuth: [] }], request: { query: z.object({ q: z.string().min(2).max(100) }) }, responses: { 200: { description: "Matching device paths", content: { "application/json": { schema: z.array(z.object({ path: z.string(), label: z.string() })) } } } } });
registry.registerPath({ method: "get", path: "/api/v1/device-library/device-types/preview", tags: ["Device library compatibility"], security: [{ cookieAuth: [] }], request: { query: z.object({ path: z.string().min(1).max(500) }) }, responses: { 200: { description: "Device preview and source record" }, 404: { description: "Device definition unavailable" } } });

const generator = new OpenApiGeneratorV3(
    registry.definitions,
);

export const openApiDocument =
    generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "RackChief API v1",
            version: "1.0.0",
            description:
                "Backend API for RackChief homelab inventory and project planning.",
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development",
            },
        ],
    });
