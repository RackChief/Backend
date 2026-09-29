import type {
    OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import { z } from "../../openapi/zod.js";

import {
    assetSchema,
    createAssetSchema,
    updateAssetSchema,
} from "./asset.schema.js";

export function registerAssetOpenApi(
    registry: OpenAPIRegistry,
) {
    registry.register("Asset", assetSchema);
    registry.register("CreateAsset", createAssetSchema);

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
}
