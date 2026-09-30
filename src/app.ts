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
import { auth } from "./auth/auth.js";
import { toNodeHandler } from "better-auth/node";
import { setupRouter } from "./modules/setup/setup.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { assetRouter } from "./modules/assets/asset.routes.js";
import { openApiDocument } from "./openapi/index.js";
import { assetTypeRouter } from "./modules/asset-types/asset-type.routes.js";
import { projectRouter } from "./modules/projects/project.routes.js";
import { mcpSettingsRouter, mcpTokenRouter } from "./modules/mcp-admin/mcp-admin.routes.js";
import { mcpAdminService } from "./modules/mcp-admin/mcp-admin.service.js";
import { deviceImageRouter } from "./modules/device-images/device-image.routes.js";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import { deviceLibraryRouter } from "./modules/device-library/device-library.routes.js";
import { catalogRouter } from "./modules/catalog/catalog.routes.js";
import { startupState } from "./startup-state.js";
import { env } from "./config/env.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.BETTER_AUTH_TRUSTED_ORIGINS, credentials: true }));
app.use((req, res, next) => {
    if (startupState.get().phase === "ready" || req.path === "/health" || req.path === "/startup/status" || req.path === "/openapi.json" || req.path.startsWith("/docs")) return next();
    res.status(503).json({ error: "RackChief is starting", ...startupState.get() });
});
app.all("/api/auth/sign-up/email", (_req, res) => {
    res.status(404).json({ error: "Not found" });
});
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

app.get("/health", async (_req, res) => {
    if (startupState.get().phase !== "ready") { res.status(503).json({ status: "starting", ...startupState.get() }); return; }
    try {
        await db.execute(sql`select 1`);
        res.json({ status: "ok" });
    } catch {
        res.status(503).json({ status: "unavailable" });
    }
});

app.get("/startup/status", (_req, res) => { const status = startupState.get(); res.status(status.phase === "ready" ? 200 : status.phase === "error" ? 503 : 202).json(status); });

app.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument);
});

app.use("/api/v1/setup", setupRouter);
app.use("/api/v1/device-library", deviceLibraryRouter);
app.use("/api/v1/catalog", catalogRouter);

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
