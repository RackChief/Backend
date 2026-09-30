import { Router } from "express";
import { requireAuth } from "../../auth/middleware.js";
import { catalogService } from "./catalog.service.js";
import { z } from "../../openapi/zod.js";
export const catalogRouter = Router();
catalogRouter.use(requireAuth);
catalogRouter.get("/providers", async (_req, res) => res.json(await catalogService.providers()));
catalogRouter.get("/manufacturers", async (_req, res) => res.json(await catalogService.manufacturers()));
catalogRouter.get("/device-types", async (req, res) => {
  const query = z.object({ q: z.string().max(100).optional(), manufacturer: z.string().max(100).optional(), uHeight: z.coerce.number().min(0).max(100).optional(), hasFrontImage: z.coerce.boolean().optional(), hasRearImage: z.coerce.boolean().optional(), limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).default(0) }).parse(req.query);
  res.json(await catalogService.search(query));
});
catalogRouter.get("/device-types/:id", async (req, res) => { const result = await catalogService.get(req.params.id); if (!result) { res.status(404).json({ error: "Catalog device not found" }); return; } res.json(result); });
