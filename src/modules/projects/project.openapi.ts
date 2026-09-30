import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
import {
    createProjectItemSchema, createProjectSchema, createProjectUpdateSchema,
    projectIdParamsSchema, projectItemParamsSchema, projectItemSchema,
    projectParamsSchema, projectSchema, projectSummarySchema,
    projectUpdateParamsSchema, projectUpdateSchema, updateProjectItemSchema,
    updateProjectSchema,
} from "./project.schema.js";

const security = [{ cookieAuth: [] }];
const response = (schema: z.ZodType, description: string) => ({
    description,
    content: { "application/json": { schema } },
});
const body = (schema: z.ZodType) => ({
    required: true,
    content: { "application/json": { schema } },
});
const errors = {
    400: { description: "Invalid request or missing referenced asset" },
    401: { description: "Authentication required" },
    404: { description: "Resource not found" },
};

export function registerProjectOpenApi(registry: OpenAPIRegistry) {
    registry.register("Project", projectSchema);
    registry.register("ProjectSummary", projectSummarySchema);
    registry.register("CreateProject", createProjectSchema);
    registry.register("UpdateProject", updateProjectSchema);
    registry.register("ProjectItem", projectItemSchema);
    registry.register("CreateProjectItem", createProjectItemSchema);
    registry.register("UpdateProjectItem", updateProjectItemSchema);
    registry.register("ProjectUpdate", projectUpdateSchema);
    registry.register("CreateProjectUpdate", createProjectUpdateSchema);

    registry.registerPath({
        method: "get", path: "/api/v1/projects", tags: ["Projects"],
        summary: "List projects by name and ID", security,
        responses: { 200: response(z.array(projectSummarySchema), "Project summaries"), 401: errors[401] },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/projects/{id}", tags: ["Projects"],
        summary: "Get project details", security,
        request: { params: projectIdParamsSchema },
        responses: { 200: response(projectSchema, "Project with assets, items, and updates"), 400: errors[400], 401: errors[401], 404: errors[404] },
    });
    registry.registerPath({
        method: "post", path: "/api/v1/projects", tags: ["Projects"],
        summary: "Create a project", security,
        request: { body: body(createProjectSchema) },
        responses: { 201: response(projectSchema, "Created project"), 400: errors[400], 401: errors[401] },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/projects/{id}", tags: ["Projects"],
        summary: "Update a project and optionally replace its affected assets", security,
        request: { params: projectIdParamsSchema, body: body(updateProjectSchema) },
        responses: { 200: response(projectSchema, "Updated project"), ...errors },
    });
    registry.registerPath({
        method: "post", path: "/api/v1/projects/{id}/archive", tags: ["Projects"],
        summary: "Archive a project", security,
        request: { params: projectIdParamsSchema },
        responses: { 200: response(projectSchema, "Archived project"), ...errors },
    });
    registry.registerPath({
        method: "post", path: "/api/v1/projects/{id}/restore", tags: ["Projects"],
        summary: "Restore a project to planned", security,
        request: { params: projectIdParamsSchema },
        responses: { 200: response(projectSchema, "Restored project"), ...errors },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/projects/{id}", tags: ["Projects"],
        summary: "Permanently delete an archived project", security,
        request: { params: projectIdParamsSchema },
        responses: { 204: { description: "Project deleted" }, ...errors, 409: { description: "Project must be archived before deletion" } },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/projects/{projectId}/items", tags: ["Project Items"],
        summary: "List project items by sort order and creation time", security,
        request: { params: projectParamsSchema },
        responses: { 200: response(z.array(projectItemSchema), "Project items"), ...errors },
    });
    registry.registerPath({
        method: "post", path: "/api/v1/projects/{projectId}/items", tags: ["Project Items"],
        summary: "Create a project item", security,
        request: { params: projectParamsSchema, body: body(createProjectItemSchema) },
        responses: { 201: response(projectItemSchema, "Created project item"), ...errors },
    });
    registry.registerPath({
        method: "patch", path: "/api/v1/projects/{projectId}/items/{itemId}", tags: ["Project Items"],
        summary: "Update an item in this project", security,
        request: { params: projectItemParamsSchema, body: body(updateProjectItemSchema) },
        responses: { 200: response(projectItemSchema, "Updated project item"), ...errors },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/projects/{projectId}/items/{itemId}", tags: ["Project Items"],
        summary: "Delete an item from this project", security,
        request: { params: projectItemParamsSchema },
        responses: { 204: { description: "Project item deleted" }, ...errors },
    });
    registry.registerPath({
        method: "get", path: "/api/v1/projects/{projectId}/updates", tags: ["Project Updates"],
        summary: "List project updates newest first", security,
        request: { params: projectParamsSchema },
        responses: { 200: response(z.array(projectUpdateSchema), "Project updates"), ...errors },
    });
    registry.registerPath({
        method: "post", path: "/api/v1/projects/{projectId}/updates", tags: ["Project Updates"],
        summary: "Add a project update", security,
        request: { params: projectParamsSchema, body: body(createProjectUpdateSchema) },
        responses: { 201: response(projectUpdateSchema, "Created project update"), ...errors },
    });
    registry.registerPath({
        method: "delete", path: "/api/v1/projects/{projectId}/updates/{updateId}", tags: ["Project Updates"],
        summary: "Delete an update from this project", security,
        request: { params: projectUpdateParamsSchema },
        responses: { 204: { description: "Project update deleted" }, ...errors },
    });
}
