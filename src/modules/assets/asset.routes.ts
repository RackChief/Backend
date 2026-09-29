import { Router } from "express";

import {
    createAssetSchema,
    updateAssetSchema,
} from "./asset.schema.js";

import {
    assetService,
} from "./asset.service.js";

export const assetRouter = Router();

assetRouter.get(
    "/",
    async (_req, res, next) => {
        try {
            res.json(
                await assetService.list(),
            );
        } catch (error) {
            next(error);
        }
    },
);

assetRouter.get(
    "/:id",
    async (req, res, next) => {
        try {
            res.json(
                await assetService.get(
                    req.params.id,
                ),
            );
        } catch (error) {
            next(error);
        }
    },
);

assetRouter.post(
    "/",
    async (req, res, next) => {
        try {
            const input =
                createAssetSchema.parse(
                    req.body,
                );

            const asset =
                await assetService.create(
                    input,
                );

            res.status(201).json(asset);
        } catch (error) {
            next(error);
        }
    },
);

assetRouter.patch(
    "/:id",
    async (req, res, next) => {
        try {
            const input =
                updateAssetSchema.parse(
                    req.body,
                );

            res.json(
                await assetService.update(
                    req.params.id,
                    input,
                ),
            );
        } catch (error) {
            next(error);
        }
    },
);

assetRouter.post(
    "/:id/archive",
    async (req, res, next) => {
        try {
            res.json(
                await assetService.archive(
                    req.params.id,
                ),
            );
        } catch (error) {
            next(error);
        }
    },
);

assetRouter.post(
    "/:id/restore",
    async (req, res, next) => {
        try {
            res.json(
                await assetService.restore(
                    req.params.id,
                ),
            );
        } catch (error) {
            next(error);
        }
    },
);

assetRouter.delete(
    "/:id",
    async (req, res, next) => {
        try {
            await assetService.delete(
                req.params.id,
            );

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
);
