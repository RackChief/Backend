import "dotenv/config";
import { z } from "zod";

const databaseConfig = z.object({
    PG_USER: z.string().min(1),
    PG_PASS: z.string().min(1),
    PG_HOST: z.string().min(1),
    PG_DB_NAME: z.string().min(1),
    PG_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    PG_SSLMODE: z.preprocess(value => value === "" ? undefined : value, z.enum(["prefer", "require", "verify-full"]).optional()),
}).parse(process.env);

const url = new URL("postgres://localhost");
url.username = databaseConfig.PG_USER;
url.password = databaseConfig.PG_PASS;
url.hostname = databaseConfig.PG_HOST;
if (url.hostname.toLowerCase() !== databaseConfig.PG_HOST.toLowerCase()) {
    throw new Error("PG_HOST must be a host name or bracketed IPv6 address without a port");
}
url.port = String(databaseConfig.PG_PORT);
url.pathname = `/${encodeURIComponent(databaseConfig.PG_DB_NAME)}`;
if (databaseConfig.PG_SSLMODE) url.searchParams.set("sslmode", databaseConfig.PG_SSLMODE);

export const databaseUrl = url.toString();
