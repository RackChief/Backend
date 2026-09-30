import { app } from "./app.js";
import { env } from "./config/env.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { client, db } from "./db/index.js";
import { startupState } from "./startup-state.js";
import { buildCatalogIndex } from "./modules/catalog/catalog-index.service.js";


import postgres from 'postgres';

// Extract database name and base connection string from your env variables
const dbName = process.env.PG_DB_NAME;
const connectionString = process.env.BASE_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

async function ensureDatabaseExists() {
    // Connect to the default admin/postgres database first
    const sql = postgres(connectionString);

    try {
        // Check if the database already exists
        const result = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

        if (result.length === 0) {
            console.log(`Database "${dbName}" does not exist. Creating...`);
            // Database names cannot be parameterized traditionally in DD&L statements, 
            // but the postgres library allows safe interpolation using sql.unsafe or raw strings
            await sql.unsafe(`CREATE DATABASE ${dbName}`);
            console.log(`Database "${dbName}" successfully created.`);
        } else {
            console.log(`Database "${dbName}" already exists.`);
        }
    } catch (error) {
        console.error('Error establishing or checking database:', error);
    } finally {
        await sql.end();
    }
}

ensureDatabaseExists();


async function start() {
    const server = app.listen(env.PORT, () => console.log(`RackChief API starting on :${env.PORT}`));
    try {
        startupState.set("migrating", "Applying database migrations");
        console.log("Applying database migrations...");
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("Database migrations complete.");
        startupState.set("indexing_catalog", "Building hardware catalog index");
        try { const result = await buildCatalogIndex(); if (result.entryCount > 0) { startupState.catalog({ status: "ready", revision: result.revision, entryCount: result.entryCount }); console.log(result.unchanged ? `Catalog unchanged at ${result.revision}; ${result.entryCount} database records reused.` : `Catalog imported: ${result.entryCount} devices (${result.skipped} skipped), revision ${result.revision}.`); } else { startupState.catalog({ status: "unavailable", entryCount: 0, message: "Device catalog unavailable; custom assets remain available." }); console.warn("Catalog index is empty."); } } catch (error) { startupState.catalog({ status: "unavailable", message: "Device catalog unavailable; custom assets remain available." }); console.warn("Catalog indexing skipped", error instanceof Error ? error.message : "unknown"); }
        startupState.set("ready", "RackChief is ready");
        console.log(`RackChief API listening on :${env.PORT}.`);
    } catch (error) {
        startupState.set("error", "RackChief startup failed");
        console.error("RackChief startup failed: database migrations could not be applied", error instanceof Error ? error.name : "unknown");
        server.close(() => { void client.end().catch(() => { }).finally(() => { process.exitCode = 1; }); });
    }
}

void start();
