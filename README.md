# RackChief Backend

RackChief is fully self-hostable. The backend requires PostgreSQL through `DATABASE_URL`; managed PostgreSQL is optional. Authentication is provided locally by Better Auth using email/password and HttpOnly session cookies. No Supabase project or other cloud service is required.

From `Backend/`, configure `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 random characters), and `BETTER_AUTH_URL`, then run `npm run build` and `npm start`. The backend applies pending Drizzle migrations before it starts listening; startup fails if PostgreSQL is unavailable or migrations cannot be applied.

On a new database, `GET /api/v1/setup/status` reports whether setup is required. `POST /api/v1/setup/admin` creates the first administrator; once a user exists, further setup attempts and public registration are rejected.

RackChief REST endpoints live under `/api/v1` and use Better Auth session cookies. Browser clients should send credentials; non-browser scripting should retain the cookie returned by Better Auth. A custom bearer/JWT API is intentionally out of scope for V1. `/health`, `/openapi.json`, `/docs`, and setup status are public. MCP remains separate: it is disabled by default and uses RackChief-owned hashed bearer tokens at `/mcp`.

## Hardware catalog

The optional catalog provider uses the pinned NetBox Community Device Type Library checkout at `vendor/netbox-device-type-library/`. Startup imports the searchable manufacturer/device summary fields into PostgreSQL; catalog search reads those tables, while detailed templates and elevation images continue to come from the checked-out YAML and image files. The database stores both the source Git revision (when available) and a source fingerprint.

Startup compares the fingerprint with the last successful import and skips parsing/rebuilding database records when the catalog source is unchanged. The fingerprint includes catalog file paths, sizes, and modification times, so edits to a working checkout are detected even when the pinned Git commit does not change. To refresh, update the submodule checkout; the next backend startup detects the change and reimports it. `npm run catalog:index` is available for an explicit reindex. No catalog files are fetched from GitHub at runtime.

If the checkout or database index is unavailable, inventory and custom asset creation continue to work and catalog endpoints return no entries.

Catalog data and elevation images are sourced from the NetBox Community Device Type Library. Catalog data helps create RackChief inventory but does not become RackChief's canonical schema. Created assets remain editable and may retain nullable source metadata for provenance; existing assets are never synchronized automatically.
