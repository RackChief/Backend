import { Router } from "express";
import { sql } from "drizzle-orm";
import { auth } from "../../auth/auth.js";
import { client, db } from "../../db/index.js";
import { z } from "zod";

const router = Router();
const setupSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().trim().min(1).max(120),
}).strict();

router.get("/status", async (_req, res, next) => {
    try {
        const rows = await db.execute<{ count: string }>(sql`select count(*)::text as count from "user"`);
        res.json({ setupRequired: Number(rows[0]?.count ?? 0) === 0 });
    } catch (error) { next(error); }
});

router.post("/admin", async (req, res, next) => {
    let connection: Awaited<ReturnType<typeof client.reserve>> | undefined;
    try {
        const input = setupSchema.parse(req.body);
        connection = await client.reserve();
        await connection`select pg_advisory_lock(418327);`;
        const rows = await db.execute<{ count: string }>(sql`select count(*)::text as count from "user"`);
        if (Number(rows[0]?.count ?? 0) > 0) {
            res.status(409).json({ error: "Initial setup is already complete" });
            return;
        }
        const result = await auth.api.signUpEmail({ body: input });
        res.status(201).json({ user: { id: result.user.id, email: result.user.email, name: result.user.name } });
    } catch (error) { next(error); }
    finally {
        if (connection) {
            try { await connection`select pg_advisory_unlock(418327);`; }
            finally { connection.release(); }
        }
    }
});

export { router as setupRouter };
