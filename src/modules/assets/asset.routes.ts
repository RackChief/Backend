import { Router } from "express";
import { z } from "zod";

import { assetService } from "./asset.service.js";

export const assetRouter = Router();

assetRouter.get("/", async (_req, res, next) => {
    try {
        const assets = await assetService.list();

        res.json(assets);
    } catch (error) {
        next(error);
    }
});

assetRouter.get("/:id", async (req, res, next) => {
    try {
        const asset = await assetService.get(req.params.id);

        res.json(asset);
    } catch (error) {
        next(error);
    }
});

const createAssetSchema = z.object({
    name: z.string().min(1),
    hostname: z.string().optional(),
    notes: z.string().optional(),
});

assetRouter.post("/", async (req, res, next) => {
    try {
        const input = createAssetSchema.parse(req.body);

        const asset = await assetService.create(input);

        res.status(201).json(asset);
    } catch (error) {
        next(error);
    }
});
