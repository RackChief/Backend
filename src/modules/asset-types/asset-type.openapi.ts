import type {
    OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import { z } from "../../openapi/zod.js";

import {
    assetTypeSchema,
} from "./asset-type.schema.js";

export function registerAssetTypeOpenApi(
    registry: OpenAPIRegistry,
) {
    registry.register(
        "AssetType",
        assetTypeSchema,
    );

    registry.registerPath({
        method: "get",
        path: "/api/v1/asset-types",
        tags: ["Asset Types"],
        summary: "List all asset types",
        security: [
            {
                cookieAuth: [],
            },
        ],
        responses: {
            200: {
                description: "List of asset types",
                content: {
                    "application/json": {
                        schema: z.array(assetTypeSchema),
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
        path: "/api/v1/asset-types/{id}",
        tags: ["Asset Types"],
        summary: "Get an asset type by ID",
        security: [
            {
                cookieAuth: [],
            },
        ],
        request: {
            params: z.object({
                id: z.uuid(),
            }),
        },
        responses: {
            200: {
                description: "Asset type",
                content: {
                    "application/json": {
                        schema: assetTypeSchema,
                    },
                },
            },
            401: {
                description: "Authentication required",
            },
            404: {
                description: "Asset type not found",
            },
        },
    });
}
