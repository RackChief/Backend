import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { assetService } from "../modules/assets/asset.service.js";
import { assetDetailService } from "../modules/assets/asset-detail.service.js";
import { componentService } from "../modules/components/component.service.js";
import { componentFilterSchema, createComponentSchema, updateComponentSchema } from "../modules/components/component.schema.js";
import { rackService } from "../modules/racks/rack.service.js";
import { createPlacementSchema } from "../modules/racks/rack.schema.js";
import { networkService } from "../modules/networking/network.service.js";
import { createConnectionSchema } from "../modules/networking/network.schema.js";
import { projectService } from "../modules/projects/project.service.js";
import { createProjectItemSchema, createProjectUpdateSchema,
    updateProjectItemSchema } from "../modules/projects/project.schema.js";
import packageInfo from "../../package.json";

const uuid = z.uuid();
type ToolValue = unknown;
async function result(operation: () => Promise<ToolValue>) {
    try {
        const value = await operation();
        return { content: [{ type: "text" as const, text: JSON.stringify(value ?? { success: true }) }] };
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        const message = error instanceof z.ZodError ? `Invalid tool input: ${error.issues.map((issue) => issue.message).join("; ")}`
            : status && status >= 400 && status < 500 && error instanceof Error
                ? error.message : "Operation failed";
        return { isError: true, content: [{ type: "text" as const, text: message }] };
    }
}

const handler = createMcpHandler(() => {
    const server = new McpServer({ name: "RackChief", version: packageInfo.version });
    server.registerTool("assets_list", { description: "List RackChief assets" },
        async () => result(() => assetService.list()));
    server.registerTool("assets_get", { description: "Get a RackChief asset", inputSchema: z.object({ id: uuid }) },
        async ({ id }) => result(() => assetService.get(id)));
    server.registerTool("assets_get_detail", { description: "Get one asset with location, rack placements, hardware components, interfaces, IP addresses, ports, and relationships", inputSchema: z.object({ id: uuid }) },
        async ({ id }) => result(() => assetDetailService.get(id)));
    server.registerTool("components_list", { description: "List installed or spare hardware components, optionally filtered by asset, type, or status", inputSchema: componentFilterSchema },
        async (filter) => result(() => componentService.list(filter)));
    server.registerTool("components_get", { description: "Get one hardware component", inputSchema: z.object({ id: uuid }) },
        async ({ id }) => result(() => componentService.get(id)));
    server.registerTool("components_create", { description: "Create an installed, spare, or planned hardware component", inputSchema: createComponentSchema },
        async (input) => result(() => componentService.create(input)));
    server.registerTool("components_update", { description: "Update an existing hardware component", inputSchema: updateComponentSchema.safeExtend({ id: uuid }) },
        async ({ id, ...input }) => result(() => componentService.update(id, input)));
    server.registerTool("racks_list", { description: "List racks and their capacities" },
        async () => result(() => rackService.list()));
    server.registerTool("racks_get", { description: "Get a rack with placed assets and unit positions", inputSchema: z.object({ id: uuid }) },
        async ({ id }) => result(() => rackService.get(id)));
    server.registerTool("rack_place_asset", { description: "Place an asset in a rack; rejects capacity and overlap conflicts", inputSchema: createPlacementSchema.safeExtend({ rackId: uuid }) },
        async ({ rackId, ...input }) => result(() => rackService.place(rackId, input)));
    server.registerTool("rack_remove_asset", { description: "Remove one rack placement", inputSchema: z.object({ rackId: uuid, placementId: uuid }) },
        async ({ rackId, placementId }) => result(() => rackService.remove(rackId, placementId)));
    server.registerTool("network_ports_list", { description: "List physical network ports, optionally for one asset", inputSchema: z.object({ assetId: uuid.optional() }) },
        async ({ assetId }) => result(() => networkService.ports(assetId)));
    server.registerTool("network_connections_list", { description: "List physical port connections, optionally for an asset or port", inputSchema: z.object({ assetId: uuid.optional(), portId: uuid.optional() }) },
        async ({ assetId, portId }) => result(() => networkService.connections(assetId, portId)));
    server.registerTool("network_connect_ports", { description: "Connect two currently unconnected physical ports", inputSchema: createConnectionSchema },
        async (input) => result(() => networkService.connect(input)));
    server.registerTool("network_disconnect_ports", { description: "Delete one physical port connection", inputSchema: z.object({ id: uuid }) },
        async ({ id }) => result(() => networkService.disconnect(id)));
    server.registerTool("projects_list", { description: "List RackChief projects" },
        async () => result(() => projectService.list()));
    server.registerTool("projects_get", { description: "Get project details, assets, items, and updates", inputSchema: z.object({ id: uuid }) },
        async ({ id }) => result(() => projectService.get(id)));
    server.registerTool("projects_add_update", { description: "Add an update to a project",
        inputSchema: z.object({ projectId: uuid, body: z.string().trim().min(1) }) },
        async ({ projectId, body }) => result(() => projectService.createUpdate(projectId,
            createProjectUpdateSchema.parse({ body }))));
    server.registerTool("projects_add_item", { description: "Add a work or purchase item to a project",
        inputSchema: createProjectItemSchema.extend({ projectId: uuid }) },
        async ({ projectId, ...input }) => result(() => projectService.createItem(projectId,
            createProjectItemSchema.parse(input))));
    server.registerTool("projects_update_item", { description: "Update a project item",
        inputSchema: updateProjectItemSchema.safeExtend({ projectId: uuid, itemId: uuid }) },
        async ({ projectId, itemId, ...input }) => result(() => projectService.updateItem(projectId, itemId,
            updateProjectItemSchema.parse(input))));
    server.registerTool("projects_delete_item", { description: "Delete an item from a project",
        inputSchema: z.object({ projectId: uuid, itemId: uuid }) },
        async ({ projectId, itemId }) => result(() => projectService.deleteItem(projectId, itemId)));
    return server;
});

export const mcpNodeHandler = toNodeHandler(handler);
