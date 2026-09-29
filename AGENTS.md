# RackChief Backend Development Guidance

This file applies specifically to the RackChief backend repository.

The parent workspace may contain additional guidance. For backend work, follow this file when it is more specific.

## Backend stack

RackChief Backend currently uses:

- TypeScript
- Express 5
- Drizzle ORM
- PostgreSQL
- Hosted Supabase PostgreSQL for development
- Supabase Auth
- Zod
- OpenAPI / Swagger

The normal architecture is:

```text
REST / MCP interface
        ↓
service layer
        ↓
repository layer
        ↓
Drizzle
        ↓
Supabase PostgreSQL
```

Keep business logic in services.
Keep database access in repositories.
Keep routes thin and focused on validation/request handling.

---

# Development database policy

The configured `DATABASE_URL` points to the actual RackChief development Supabase PostgreSQL database.

This development database is intentionally disposable.

It is acceptable during development to:

- run migrations against it
- create or alter tables
- add or remove columns
- add or remove indexes
- insert test records
- update test records
- delete test records
- truncate development tables
- drop and recreate development tables when necessary
- reset data to resolve migration conflicts
- destroy development-only data if required by the implementation

Do not treat existing development data as production data.

The user has explicitly accepted potential data loss in the current development Supabase database.

---

# Do not create alternate PostgreSQL environments

Unless explicitly requested by the user:

- DO NOT start PostgreSQL in Docker
- DO NOT start a temporary Postgres container
- DO NOT use Testcontainers for PostgreSQL
- DO NOT create a local PostgreSQL database
- DO NOT install PostgreSQL locally
- DO NOT create a shadow database
- DO NOT create an ephemeral migration database
- DO NOT create a second Supabase project
- DO NOT clone the configured database
- DO NOT start a background database process
- DO NOT create an isolated integration database

Use the existing configured Supabase development database through `DATABASE_URL`.

Do not spend time or tokens constructing a safer disposable database. The configured development database is already considered disposable.

If testing requires database state changes, make those changes in the configured development database.

---

# Database migrations

RackChief uses Drizzle migrations.

Current commands include:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

The Drizzle config uses the repository's configured `DATABASE_URL`.

When changing the database schema:

1. Update `src/db/schema.ts`.
2. Run `npm run db:generate`.
3. Inspect the generated migration.
4. Correct migration ordering or data backfills if required.
5. Run `npm run db:migrate` against the configured development Supabase database when verification is appropriate.
6. Verify the backend against that same database.

Do not rewrite previously committed migrations unless explicitly requested.

Prefer adding a new migration.

Because the database is still development-only, destructive migrations are acceptable when they simplify the design.

If existing development data blocks a schema migration, prefer:

- updating the conflicting rows
- deleting the conflicting rows
- truncating the affected development data
- recreating the affected development table

Do NOT solve the problem by creating another database.

---

# Testing policy

Prefer the shortest useful verification path.

For most backend changes, use:

```bash
npm run build
```

and then, where useful:

- existing API calls with `curl`
- `/health`
- `/openapi.json`
- the configured Supabase development database
- the existing auth helper
- the running backend development server

Do not invent a large automated integration-test environment for a small change.

Do not launch a temporary PostgreSQL database merely to run tests.

Do not create test infrastructure unless:

1. the user explicitly asks for it, or
2. the repository already has an established test framework that clearly applies.

Manual verification against the current development environment is acceptable at this stage.

---

# Development servers and background processes

Avoid unnecessary background processes.

Do not automatically launch:

- PostgreSQL
- Docker Compose
- extra backend servers
- database containers
- database proxies
- frontend servers
- file watchers unrelated to the task

If the backend is already running, use the existing process where practical.

If a backend process must be started for verification:

- start only what is needed
- avoid duplicate instances
- terminate the process when finished if you started it

---

# Repository exploration efficiency

Keep exploration targeted.

Do not recursively inspect the entire repository unless necessary.

When implementing a feature:

1. inspect the relevant module
2. inspect one nearby module for conventions if needed
3. inspect shared infrastructure only when the feature depends on it

Avoid repeatedly reading files that have not changed.

Prefer known paths such as:

```text
src/modules/
src/db/
src/auth/
src/config/
src/openapi/
src/mcp/
```

Do not perform broad searches merely to reconfirm architecture already visible in nearby modules.

---

# Supabase usage

Supabase is currently used for:

- hosted PostgreSQL
- authentication

Application data is accessed through the RackChief backend.

Do not redesign backend features around Supabase Data API/PostgREST.

Do not make application clients query RackChief tables directly through Supabase unless explicitly requested.

Backend database access should continue through Drizzle and the configured PostgreSQL connection.

Normal REST authentication uses Supabase JWT validation.

---

# API conventions

The REST API is versioned under:

```text
/api/v1
```

Treat the current V1 API as the active backend contract.

When adding or changing routes:

- preserve established V1 conventions
- use Zod validation
- keep route handlers thin
- call the service layer
- keep database logic in repositories
- update OpenAPI

Do not silently change existing V1 response shapes unless required by the task.

If a breaking API change is required, call it out explicitly.

---

# OpenAPI

RackChief uses per-module OpenAPI registration.

When changing a REST route or schema:

- update the corresponding Zod schema
- update the module's `*.openapi.ts`
- verify `/openapi.json`
- keep `src/openapi/index.ts` small

Do not put every route definition back into the central OpenAPI file.

The OpenAPI document is part of the backend contract and should stay synchronized with implementation.

---

# MCP

MCP is part of the backend architecture, not a separate application.

MCP should:

- reuse existing services
- not call RackChief's REST API internally
- not duplicate business logic
- not expose raw SQL
- not expose arbitrary Drizzle/database access

MCP transport/protocol endpoints should remain separate from normal REST OpenAPI documentation.

MCP bearer credentials must not be logged or committed.

---

# Authentication

Normal REST endpoints use Supabase Auth.

Do not bypass auth for convenience unless the task explicitly requires a public route.

Do not hard-code Supabase users, passwords, JWTs, or refresh tokens.

When testing authenticated REST routes, prefer the existing development auth helper:

```bash
TOKEN=$(npm run --silent auth:token)
```

Then use:

```bash
-H "Authorization: Bearer $TOKEN"
```

Do not print or commit the resulting token.

---

# Secrets

Never commit or intentionally expose:

- `DATABASE_URL`
- Supabase secret keys
- Supabase access or refresh tokens
- test-user passwords
- MCP raw tokens
- private credentials
- `.env` contents

It is fine to inspect environment variable names and configuration code.

Do not dump the entire environment for debugging.

---

# Git discipline

Do not commit unrelated changes.

Do not rewrite history unless explicitly asked.

Do not modify or delete existing migrations casually.

Before finishing a task:

1. inspect the diff
2. ensure generated files are intentional
3. ensure no secrets were added
4. ensure `npm run build` passes when practical

Do not create release tags unless explicitly requested.

---

# Development priorities

RackChief is pre-production.

Optimize for:

1. correctness
2. simple architecture
3. fast iteration
4. maintainability
5. consistency with existing modules

Do not add production-scale complexity solely to protect disposable development data.

Do not create infrastructure that the user did not ask for.

When a direct migration or data reset on the current Supabase development database is simpler, prefer that.

---

# Hard rule for database-related tasks

If you are considering creating a temporary PostgreSQL instance, container, test database, shadow database, or alternate Supabase project:

**Do not do it.**

Use the configured RackChief development Supabase database instead.

Only create another database environment if the user explicitly asks you to.
