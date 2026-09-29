import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./middleware/error-handler.js";
import { assetRouter } from "./modules/assets/asset.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

app.use("/api/assets", assetRouter);

app.use(errorHandler);
