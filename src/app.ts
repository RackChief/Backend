import cors from "cors";
import { relationshipRouter } from "./modules/relationships/relationship.routes.js";
import { networkAssetRouter, interfaceRouter, portRouter, connectionRouter, addressRouter } from "./modules/networking/network.routes.js";
import { rackRouter } from "./modules/racks/rack.routes.js";
import { componentRouter, componentTypeRouter } from "./modules/components/component.routes.js";
import { locationRouter } from "./modules/locations/location.routes.js";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { requireAuth } from "./auth/middleware.js";
import { errorHandler } from "./middleware/error-handler.js";
import { assetRouter } from "./modules/assets/asset.routes.js";
import { openApiDocument } from "./openapi/index.js";
import { assetTypeRouter } from "./modules/asset-types/asset-type.routes.js";
import { projectRouter } from "./modules/projects/project.routes.js";
import { mcpSettingsRouter, mcpTokenRouter } from "./modules/mcp-admin/mcp-admin.routes.js";
import { mcpAdminService } from "./modules/mcp-admin/mcp-admin.service.js";
import { deviceImageRouter } from "./modules/device-images/device-image.routes.js";

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
    "/api/v1/assets",
    requireAuth,
    assetRouter,
);

app.use("/api/v1/device-images", deviceImageRouter);

app.use(
    "/api/v1/asset-types",
    requireAuth,
    assetTypeRouter,
);

app.use("/api/v1/projects", requireAuth, projectRouter);
app.use("/api/v1/component-types", requireAuth, componentTypeRouter);
app.use("/api/v1/components", requireAuth, componentRouter);
app.use("/api/v1/locations", requireAuth, locationRouter);
app.use("/api/v1/racks", requireAuth, rackRouter);
app.use("/api/v1/assets", requireAuth, networkAssetRouter);
app.use("/api/v1/network-interfaces", requireAuth, interfaceRouter);
app.use("/api/v1/network-ports", requireAuth, portRouter);
app.use("/api/v1/network-connections", requireAuth, connectionRouter);
app.use("/api/v1/ip-addresses", requireAuth, addressRouter);
app.use("/api/v1/asset-relationships", requireAuth, relationshipRouter);

app.use("/api/v1/settings/mcp", requireAuth, mcpSettingsRouter);
app.use("/api/v1/mcp-tokens", requireAuth, mcpTokenRouter);

app.all("/mcp", async (req, res, next) => {
    try {
        if (!(await mcpAdminService.settings()).enabled) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const match = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? "");
        if (!match || !await mcpAdminService.authenticate(match[1])) {
            res.status(401).json({ error: "Invalid or missing MCP token" });
            return;
        }
        const { mcpNodeHandler } = await import("./mcp/server.js");
        await mcpNodeHandler(req, res, req.body);
    } catch (error) {
        console.error("MCP request failed", error instanceof Error ? error.name : "unknown");
        if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
    }
});

app.use(errorHandler);
