import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mcpAdminRepository } from "./mcp-admin.repository.js";
import type { CreateMcpToken, UpdateMcpToken } from "./mcp-admin.schema.js";

const prefix = "rc_mcp_";
const notFound = () => Object.assign(new Error("MCP token not found"), { statusCode: 404 });
export function hashMcpToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}
export const mcpAdminService = {
    async settings() { return { enabled: await mcpAdminRepository.enabled() }; },
    async updateSettings(enabled: boolean) {
        await mcpAdminRepository.setEnabled(enabled);
        return { enabled };
    },
    listTokens() { return mcpAdminRepository.list(); },
    async createToken(input: CreateMcpToken) {
        const token = prefix + randomBytes(32).toString("base64url");
        const row = await mcpAdminRepository.create(input.name, hashMcpToken(token),
            input.expiresAt ? new Date(input.expiresAt) : null);
        return { ...row, token };
    },
    async updateToken(id: string, input: UpdateMcpToken) {
        const row = await mcpAdminRepository.update(id, {
            ...input, expiresAt: input.expiresAt === undefined ? undefined :
                input.expiresAt === null ? null : new Date(input.expiresAt),
        });
        if (!row) throw notFound();
        return row;
    },
    async deleteToken(id: string) {
        if (!await mcpAdminRepository.delete(id)) throw notFound();
    },
    async authenticate(token: string) {
        if (!token.startsWith(prefix) || token.length !== prefix.length + 43) return false;
        const hash = hashMcpToken(token);
        const row = await mcpAdminRepository.findByHash(hash);
        if (!row || !row.enabled || (row.expiresAt && row.expiresAt <= new Date())) return false;
        if (!timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(row.tokenHash, "hex"))) return false;
        return mcpAdminRepository.markUsed(row.id);
    },
};
