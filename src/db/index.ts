import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema.js";
import { databaseUrl } from "../config/database-url.js";

export const client = postgres(databaseUrl);

export const db = drizzle(client, {
    schema,
});
