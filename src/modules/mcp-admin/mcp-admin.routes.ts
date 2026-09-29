import { Router } from "express";
import { mcpAdminService } from "./mcp-admin.service.js";
import { createMcpTokenSchema, mcpTokenIdParamsSchema, updateMcpSettingsSchema,
    updateMcpTokenSchema } from "./mcp-admin.schema.js";

export const mcpSettingsRouter = Router();
mcpSettingsRouter.get("/", async (_req, res) => { res.json(await mcpAdminService.settings()); });
mcpSettingsRouter.patch("/", async (req, res) => {
    const { enabled } = updateMcpSettingsSchema.parse(req.body);
    res.json(await mcpAdminService.updateSettings(enabled));
});

export const mcpTokenRouter = Router();
mcpTokenRouter.get("/", async (_req, res) => { res.json(await mcpAdminService.listTokens()); });
mcpTokenRouter.post("/", async (req, res) => {
    res.status(201).json(await mcpAdminService.createToken(createMcpTokenSchema.parse(req.body)));
});
mcpTokenRouter.patch("/:id", async (req, res) => {
    const { id } = mcpTokenIdParamsSchema.parse(req.params);
    res.json(await mcpAdminService.updateToken(id, updateMcpTokenSchema.parse(req.body)));
});
mcpTokenRouter.delete("/:id", async (req, res) => {
    const { id } = mcpTokenIdParamsSchema.parse(req.params);
    await mcpAdminService.deleteToken(id);
    res.status(204).send();
});
