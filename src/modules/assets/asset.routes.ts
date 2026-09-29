import { Router } from "express";

import { assetService } from "./asset.service.js";
import { createAssetSchema } from "./asset.schema.js";

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

assetRouter.post("/", async (req, res, next) => {
    try {
        const input = createAssetSchema.parse(req.body);

        const asset = await assetService.create(input);

        res.status(201).json(asset);
    } catch (error) {
        next(error);
    }
});
