import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "./zod.js";

import {
    assetSchema,
    createAssetSchema,
} from "../modules/assets/asset.schema.js";



const registry = new OpenAPIRegistry();

registry.registerComponent(
    "securitySchemes",
    "bearerAuth",
    {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
    },
);

registry.register("Asset", assetSchema);
registry.register("CreateAsset", createAssetSchema);

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
    },
});

registry.registerPath({
    method: "get",
    path: "/api/assets",
    tags: ["Assets"],
    summary: "List all assets",
    security: [
        {
            bearerAuth: [],
        },
    ],
    responses: {
        200: {
            description: "List of RackChief assets",
            content: {
                "application/json": {
                    schema: z.array(assetSchema),
                },
            },
        },
        401: {
            description: "Authentication required",
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/api/assets/{id}",
    tags: ["Assets"],
    summary: "Get an asset by ID",
    security: [
        {
            bearerAuth: [],
        },
    ],
    request: {
        params: z.object({
            id: z.uuid(),
        }),
    },
    responses: {
        200: {
            description: "Asset",
            content: {
                "application/json": {
                    schema: assetSchema,
                },
            },
        },
        401: {
            description: "Authentication required",
        },
        404: {
            description: "Asset not found",
        },
    },
});

registry.registerPath({
    method: "post",
    path: "/api/assets",
    tags: ["Assets"],
    summary: "Create an asset",
    security: [
        {
            bearerAuth: [],
        },
    ],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: createAssetSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: "Asset created",
            content: {
                "application/json": {
                    schema: assetSchema,
                },
            },
        },
        400: {
            description: "Invalid request",
        },
        401: {
            description: "Authentication required",
        },
    },
});

const generator = new OpenApiGeneratorV3(
    registry.definitions,
);

export const openApiDocument =
    generator.generateDocument({
        openapi: "3.0.3",
        info: {
            title: "RackChief API",
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
