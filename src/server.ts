import { app } from "./app.js";
import { env } from "./config/env.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./db/index.js";

async function start() {
    try {
        console.log("Applying database migrations...");
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("Database migrations complete.");
        app.listen(env.PORT, () => {
            console.log(`RackChief API listening on :${env.PORT}`);
        });
    } catch (error) {
        console.error("RackChief startup failed: database migrations could not be applied", error instanceof Error ? error.name : "unknown");
        process.exitCode = 1;
    }
}

void start();
