import { Router } from "express";

import { assetTypeService } from "./asset-type.service.js";

export const assetTypeRouter = Router();

assetTypeRouter.get("/", async (_req, res, next) => {
    try {
        res.json(await assetTypeService.list());
    } catch (error) {
        next(error);
    }
});

assetTypeRouter.get("/:id", async (req, res, next) => {
    try {
        res.json(
            await assetTypeService.get(req.params.id),
        );
    } catch (error) {
        next(error);
    }
});
