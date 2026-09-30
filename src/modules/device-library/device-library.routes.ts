import { Router } from "express";
import { z } from "../../openapi/zod.js";
import { requireAuth } from "../../auth/middleware.js";
import { deviceLibraryService } from "./device-library.service.js";
export const deviceLibraryRouter = Router();
deviceLibraryRouter.get("/device-types", requireAuth, async (req, res) => { const query = z.object({ q: z.string().min(2).max(100) }).parse(req.query); res.json(await deviceLibraryService.search(query.q)); });
deviceLibraryRouter.get("/device-types/preview", requireAuth, async (req, res) => { const { path } = z.object({ path: z.string().min(1).max(500) }).parse(req.query); res.json(await deviceLibraryService.preview(path)); });
