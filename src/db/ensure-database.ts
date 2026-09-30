import postgres from "postgres";

function hasCode(error: unknown, code: string): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

/** Create only the configured database, and only when PostgreSQL says it is missing. */
export async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
    const target = postgres(databaseUrl, { max: 1, fetch_types: false });
    const databaseName = target.options.database;
    try {
        await target`SELECT 1`;
        return;
    } catch (error) {
        // Authentication, connectivity, and permission errors must not trigger creation.
        if (!hasCode(error, "3D000")) throw error;
    } finally {
        await target.end({ timeout: 5 });
    }

    // Preserve credentials, host, port, and SSL options from DATABASE_URL.
    const maintenance = postgres(databaseUrl, { database: "postgres", max: 1, fetch_types: false });
    try {
        const existing = await maintenance`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`;
        if (existing.length > 0) return;

        try {
            // Identifier interpolation safely quotes names; CREATE DATABASE runs outside a transaction.
            await maintenance`CREATE DATABASE ${maintenance(databaseName)}`;
        } catch (error) {
            // A concurrent startup may have created the same database after our check.
            if (hasCode(error, "42P04")) return;
            if (hasCode(error, "42501")) {
                throw new Error("RackChief database is missing and the configured PostgreSQL role cannot create it. Grant CREATEDB to this role or have an administrator create the configured database.");
            }
            throw error;
        }
    } finally {
        await maintenance.end({ timeout: 5 });
    }
}
