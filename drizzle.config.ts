import { defineConfig } from "drizzle-kit";
import { databaseUrl } from "./src/config/database-url.js";

export default defineConfig({
    schema: "./src/db/schema/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
    },
});
