# RackChief Backend Development Guidance

RackChief uses Express 5, TypeScript, Drizzle ORM, PostgreSQL, Better Auth, Zod, OpenAPI, and MCP.

Use the configured `DATABASE_URL`; PostgreSQL may be local, Docker-hosted, NAS-hosted, or managed. Do not create extra databases, containers, or infrastructure unless explicitly requested. Migrations target the configured development database and should be additive; do not rewrite committed migrations.

Keep business logic in services, database access in repositories, and routes thin. Normal REST authentication uses Better Auth server-side sessions and HttpOnly cookies. The first-run setup endpoints create the only initial administrator; public registration remains disabled afterward. Do not implement custom password hashing, JWTs, refresh tokens, or cryptography.

MCP authentication is intentionally separate from browser authentication. MCP remains disabled by default, uses RackChief-owned hashed bearer tokens, and its settings/token-management APIs require a normal authenticated RackChief session.

Never commit `.env` files, credentials, session values, password hashes, or MCP token secrets. Verify backend changes with `npm run build`; run `npm run typecheck` and relevant migration checks when schemas change.
