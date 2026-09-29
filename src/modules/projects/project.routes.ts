import { Router } from "express";
import {
    createProjectItemSchema, createProjectSchema, createProjectUpdateSchema,
    projectIdParamsSchema, projectItemParamsSchema, projectParamsSchema,
    projectUpdateParamsSchema, updateProjectItemSchema, updateProjectSchema,
} from "./project.schema.js";
import { projectService } from "./project.service.js";

export const projectRouter = Router();

projectRouter.get("/", async (_req, res) => {
    res.json(await projectService.list());
});

projectRouter.get("/:id", async (req, res) => {
    const { id } = projectIdParamsSchema.parse(req.params);
    res.json(await projectService.get(id));
});

projectRouter.post("/", async (req, res) => {
    const input = createProjectSchema.parse(req.body);
    res.status(201).json(await projectService.create(input));
});

projectRouter.patch("/:id", async (req, res) => {
    const { id } = projectIdParamsSchema.parse(req.params);
    const input = updateProjectSchema.parse(req.body);
    res.json(await projectService.update(id, input));
});

projectRouter.post("/:id/archive", async (req, res) => {
    const { id } = projectIdParamsSchema.parse(req.params);
    res.json(await projectService.archive(id));
});

projectRouter.post("/:id/restore", async (req, res) => {
    const { id } = projectIdParamsSchema.parse(req.params);
    res.json(await projectService.restore(id));
});

projectRouter.delete("/:id", async (req, res) => {
    const { id } = projectIdParamsSchema.parse(req.params);
    await projectService.delete(id);
    res.status(204).send();
});

projectRouter.get("/:projectId/items", async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);
    res.json(await projectService.items(projectId));
});

projectRouter.post("/:projectId/items", async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);
    const input = createProjectItemSchema.parse(req.body);
    res.status(201).json(await projectService.createItem(projectId, input));
});

projectRouter.patch("/:projectId/items/:itemId", async (req, res) => {
    const { projectId, itemId } = projectItemParamsSchema.parse(req.params);
    const input = updateProjectItemSchema.parse(req.body);
    res.json(await projectService.updateItem(projectId, itemId, input));
});

projectRouter.delete("/:projectId/items/:itemId", async (req, res) => {
    const { projectId, itemId } = projectItemParamsSchema.parse(req.params);
    await projectService.deleteItem(projectId, itemId);
    res.status(204).send();
});

projectRouter.get("/:projectId/updates", async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);
    res.json(await projectService.updates(projectId));
});

projectRouter.post("/:projectId/updates", async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);
    const input = createProjectUpdateSchema.parse(req.body);
    res.status(201).json(await projectService.createUpdate(projectId, input));
});

projectRouter.delete("/:projectId/updates/:updateId", async (req, res) => {
    const { projectId, updateId } = projectUpdateParamsSchema.parse(req.params);
    await projectService.deleteUpdate(projectId, updateId);
    res.status(204).send();
});
