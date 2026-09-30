import type {
    OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";

import { z } from "../../openapi/zod.js";
import { registerResourcePath, idParam } from "../../openapi/resource.js";
import { componentSchema } from "../components/component.schema.js";
import { interfaceSchema, addressSchema, portSchema } from "../networking/network.schema.js";
import { relationshipSchema } from "../relationships/relationship.schema.js";

import {
    assetSchema,
    createAssetSchema,
    updateAssetSchema,
} from "./asset.schema.js";

export function registerAssetOpenApi(
    registry: OpenAPIRegistry,
) {
    registry.register("Asset", assetSchema);
    registerResourcePath(registry, { method: "get", path: "/api/v1/assets/{id}/detail", tag: "Assets", summary: "Get asset inventory detail", params: idParam, response: assetSchema.extend({
        location: z.object({ id: z.uuid(), name: z.string(), parentId: z.uuid().nullable() }).nullable(),
        rackPlacements: z.array(z.object({ id: z.uuid(), rackId: z.uuid(), assetId: z.uuid(), startUnit: z.number().int(), heightUnits: z.number(), orientation: z.enum(["front", "rear"]), notes: z.string().nullable(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), rack: z.object({ id: z.uuid(), name: z.string() }) })),
        components: z.array(componentSchema), interfaces: z.array(interfaceSchema.extend({ ipAddresses: z.array(addressSchema) })), ports: z.array(portSchema), relationships: z.array(relationshipSchema),
    }) });
    registry.register("CreateAsset", createAssetSchema);
    registry.register("UpdateAsset", updateAssetSchema);

    registry.registerPath({
        method: "get",
        path: "/api/v1/assets",
        tags: ["Assets"],
        summary: "List all assets",
        security: [
            {
                cookieAuth: [],
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
        path: "/api/v1/assets/{id}",
        tags: ["Assets"],
        summary: "Get an asset by ID",
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
        path: "/api/v1/assets",
        tags: ["Assets"],
        summary: "Create an asset",
        security: [
            {
                cookieAuth: [],
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

    registry.registerPath({
        method: "patch",
        path: "/api/v1/assets/{id}",
        tags: ["Assets"],
        summary: "Update an asset",
        security: [
            {
                cookieAuth: [],
            },
        ],
        request: {
            params: z.object({
                id: z.uuid(),
            }),
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: updateAssetSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Asset updated",
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
            404: {
                description: "Asset not found",
            },
        },
    });

    registry.registerPath({
        method: "post",
        path: "/api/v1/assets/{id}/archive",
        tags: ["Assets"],
        summary: "Archive an asset",
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
                description: "Asset archived",
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
        path: "/api/v1/assets/{id}/restore",
        tags: ["Assets"],
        summary: "Restore an archived asset",
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
                description: "Asset restored",
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
        method: "delete",
        path: "/api/v1/assets/{id}",
        tags: ["Assets"],
        summary: "Permanently delete an archived asset",
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
            204: {
                description: "Asset permanently deleted",
            },
            401: {
                description: "Authentication required",
            },
            404: {
                description: "Asset not found",
            },
            409: {
                description:
                    "Asset must be archived before permanent deletion",
            },
        },
    });
}
