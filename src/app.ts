import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { requireAuth } from "./auth/middleware.js";
import { errorHandler } from "./middleware/error-handler.js";
import { assetRouter } from "./modules/assets/asset.routes.js";
import { openApiDocument } from "./openapi/index.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
    });
});

app.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
});

app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument),
);

app.use(
    "/api/assets",
    requireAuth,
    assetRouter,
);

app.use(errorHandler);
