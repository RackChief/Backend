import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { appSettings, mcpTokens } from "../../db/schema.js";

const metadata = {
    id: mcpTokens.id, name: mcpTokens.name, enabled: mcpTokens.enabled,
    lastUsedAt: mcpTokens.lastUsedAt, expiresAt: mcpTokens.expiresAt,
    createdAt: mcpTokens.createdAt, updatedAt: mcpTokens.updatedAt,
};

export const mcpAdminRepository = {
    async enabled() {
        const [row] = await db.select({ value: appSettings.value }).from(appSettings)
            .where(eq(appSettings.key, "mcp.enabled")).limit(1);
        return row?.value === true;
    },
    async setEnabled(enabled: boolean) {
        await db.insert(appSettings).values({ key: "mcp.enabled", value: enabled })
            .onConflictDoUpdate({ target: appSettings.key, set: { value: enabled, updatedAt: new Date() } });
    },
    list() {
        return db.select(metadata).from(mcpTokens).orderBy(mcpTokens.createdAt);
    },
    async create(name: string, tokenHash: string, expiresAt: Date | null) {
        const [row] = await db.insert(mcpTokens).values({ name, tokenHash, expiresAt }).returning(metadata);
        return row;
    },
    async update(id: string, input: { name?: string; enabled?: boolean; expiresAt?: Date | null }) {
        const [row] = await db.update(mcpTokens).set({ ...input, updatedAt: new Date() })
            .where(eq(mcpTokens.id, id)).returning(metadata);
        return row;
    },
    async delete(id: string) {
        const rows = await db.delete(mcpTokens).where(eq(mcpTokens.id, id)).returning({ id: mcpTokens.id });
        return rows.length > 0;
    },
    async findByHash(tokenHash: string) {
        const [row] = await db.select({ id: mcpTokens.id, tokenHash: mcpTokens.tokenHash,
            enabled: mcpTokens.enabled, expiresAt: mcpTokens.expiresAt })
            .from(mcpTokens).where(eq(mcpTokens.tokenHash, tokenHash)).limit(1);
        return row;
    },
    async markUsed(id: string) {
        // Recheck state in the update so a concurrent revoke cannot be followed by a successful use.
        const [row] = await db.update(mcpTokens).set({ lastUsedAt: new Date() })
            .where(and(eq(mcpTokens.id, id), eq(mcpTokens.enabled, true),
                or(isNull(mcpTokens.expiresAt), gt(mcpTokens.expiresAt, new Date()))))
            .returning({ id: mcpTokens.id });
        return !!row;
    },
};
