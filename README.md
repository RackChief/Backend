# RackChief Backend

RackChief is fully self-hostable. The backend builds its PostgreSQL connection URL from `PG_USER`, `PG_PASS`, `PG_HOST`, `PG_DB_NAME`, and optional `PG_PORT` (default 5432) and `PG_SSLMODE`. Set `PG_HOST=db` for the optional development Docker database, or use a reachable external host in production. Authentication is provided locally by Better Auth using email/password and HttpOnly session cookies. No Supabase project or other cloud service is required.

From `Backend/`, configure the `PG_*` variables, `BETTER_AUTH_SECRET` (at least 32 random characters), and `BETTER_AUTH_URL`, then run `npm run build` and `npm start`. The backend starts a status-only listener, applies pending Drizzle migrations, then prepares the optional catalog. Poll `/startup/status` while ordinary API routes return 503. Startup closes the listener if migrations fail.

On a new database, `GET /api/v1/setup/status` reports whether setup is required. `POST /api/v1/setup/admin` creates the first administrator; once a user exists, further setup attempts and public registration are rejected.

RackChief REST endpoints live under `/api/v1` and use Better Auth session cookies. Browser clients should send credentials; non-browser scripting should retain the cookie returned by Better Auth. A custom bearer/JWT API is intentionally out of scope for V1. `/health`, `/openapi.json`, `/docs`, and setup status are public. MCP remains separate: it is disabled by default and uses RackChief-owned hashed bearer tokens at `/mcp`.

## Hardware catalog

The optional catalog provider uses the pinned NetBox Community Device Type Library checkout at `vendor/netbox-device-type-library/`. Startup imports the searchable manufacturer/device summary fields into PostgreSQL; catalog search reads those tables, while detailed templates and elevation images continue to come from the checked-out YAML and image files. The database stores both the source Git revision (when available) and a source fingerprint.

Startup compares the fingerprint with the last successful import and skips parsing/rebuilding database records when the catalog source is unchanged. The fingerprint includes catalog file paths, sizes, and modification times, so edits to a working checkout are detected even when the pinned Git commit does not change. To refresh, update the submodule checkout; the next backend startup detects the change and reimports it. `npm run catalog:index` is available for an explicit reindex. No catalog files are fetched from GitHub at runtime.

If the checkout or database index is unavailable, inventory and custom asset creation continue to work and catalog endpoints return no entries.

Catalog data and elevation images are sourced from the NetBox Community Device Type Library. Catalog data helps create RackChief inventory but does not become RackChief's canonical schema. Created assets remain editable and may retain nullable source metadata for provenance; existing assets are never synchronized automatically.

For a same-origin frontend, proxy `/api` to the backend. For a separate frontend origin, add its exact origin to `BETTER_AUTH_TRUSTED_ORIGINS` and send credentialed requests. The default development origins are `http://localhost:5173` and `http://127.0.0.1:5173`.

Rack placement height follows `asset.rackUnits`. A zero-unit asset cannot be placed; a half-unit asset uses one displayed rack unit for overlap and capacity. `heightUnits` in a placement request is optional and must match the asset when supplied. See `docs/backend-guide.md` and `docs/backend-v1-status.md`.
