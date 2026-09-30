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

const registry = new OpenAPIRegistry();

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
            description: "PostgreSQL is unavailable",
            content: {
                "application/json": {
                    schema: z.object({
                        status: z.literal("unavailable"),
                    }),
                },
            },
        },
    },
});

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
