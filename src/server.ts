import { app } from "./app.js";
import { env } from "./config/env.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./db/index.js";
import { ensureDatabaseExists } from "./db/ensure-database.js";
import { startupState } from "./startup-state.js";
import { buildCatalogIndex } from "./modules/catalog/catalog-index.service.js";
import { databaseUrl } from "./config/database-url.js"




async function start() {
    const server = app.listen(env.PORT, () => console.log(`RackChief API starting on :${env.PORT}`));
    try {
        startupState.set("migrating", "Ensuring database exists");
        await ensureDatabaseExists(databaseUrl);
        startupState.set("migrating", "Applying database migrations");
        console.log("Applying database migrations...");
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("Database migrations complete.");
        startupState.set("indexing_catalog", "Building hardware catalog index");
        try { const result = await buildCatalogIndex(); if (result.entryCount > 0) { startupState.catalog({ status: "ready", revision: result.revision, entryCount: result.entryCount }); console.log(result.unchanged ? `Catalog unchanged at ${result.revision}; ${result.entryCount} database records reused.` : `Catalog imported: ${result.entryCount} devices (${result.skipped} skipped), revision ${result.revision}.`); } else { startupState.catalog({ status: "unavailable", entryCount: 0, message: "Device catalog unavailable; custom assets remain available." }); console.warn("Catalog index is empty."); } } catch (error) { startupState.catalog({ status: "unavailable", message: "Device catalog unavailable; custom assets remain available." }); console.warn("Catalog indexing skipped", error instanceof Error ? error.message : "unknown"); }
        startupState.set("ready", "RackChief is ready");
        console.log(`RackChief API listening on :${env.PORT}.`);
    } catch (error) {
        startupState.set("error", "RackChief startup failed", error instanceof Error ? error.message : "unknown");
        console.error("RackChief startup failed: database initialization could not be completed");
        server.close(() => { process.exitCode = 1; });
    }
}

void start();
