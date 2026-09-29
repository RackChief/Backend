import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { assetService } from "../modules/assets/asset.service.js";
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
