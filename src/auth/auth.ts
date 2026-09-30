import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { env } from "../config/env.js";
import { sql } from "drizzle-orm";
import { APIError } from "better-auth/api";
export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    databaseHooks: { user: { create: { before: async () => {
        const rows = await db.execute<{ count: string }>(sql`select count(*)::text as count from "user"`);
        if (Number(rows[0]?.count ?? 0) > 0) throw new APIError("BAD_REQUEST", { message: "Public registration is disabled" });
    } } } },
});
export type AuthenticatedUser = { id: string; email: string; name?: string | null };
