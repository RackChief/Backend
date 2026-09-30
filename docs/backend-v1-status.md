# Backend V1 stabilization status

Status as of 2026-09-30: **not yet verified stable**. The checkout has `PG_*` settings, but no development database connection or session has been verified, so no migration, live API, auth, MCP, or concurrency check has run. Do not treat compilation as release acceptance.

## Frozen scope

V1 consists of first-run setup and Better Auth sessions; asset types, assets, components, locations, racks, placements, networking, relationships, projects and journal entries; the pinned optional device catalog and images; health/startup; and optional token-authenticated MCP. The frontend is a consumer of these contracts. New product workflows are outside this stabilization pass.

## Prioritized checklist

1. **Startup and integrity:** status-only startup gating, credentialed CORS, migration failure cleanup, rack footprint/capacity checks, and port exclusivity are implemented. Database behavior is awaiting live verification.
2. **Existing contract defects:** catalog boolean parsing, per-query image search cache, traversal validation, rack height agreement, archive/delete lifecycle, and database error mapping are corrected. OpenAPI and the rack UI were aligned where affected.
3. **Catalog and existing workflows:** the catalog self-test now reads the actual PostgreSQL index and checked-out YAML. Catalog refresh/failure, image upload/signing, setup/session, project, and MCP workflows still need live checks.

## Changes made

- `/health`, `/startup/status`, `/openapi.json`, and `/docs` remain available during startup; database-backed routes return 503 until ready. Migration failure closes the listener and database pool. CORS accepts configured trusted origins with credentials.
- Rack placement height is the asset's `rackUnits`. Explicit placement height must agree. Zero-unit assets cannot occupy a rack. Half-unit assets consume one whole displayed unit for overlap/capacity. A placement update uses the new asset's height. Rack placement, rack capacity, and asset resize writes use a PostgreSQL transaction and the same advisory transaction lock. Resizing updates the stored placement height.
- Connection create and update use a PostgreSQL transaction and advisory lock, then recheck both endpoint ports across both columns before writing. This coordinates concurrent requests through this API; direct SQL writers are outside that guarantee.
- Creating an already archived asset or project sets `archivedAt`, and archived records use their restore endpoint for status changes. Permanent deletion tests `archivedAt` in its DELETE statement, so a concurrent restore cannot turn a previous check into an unconditional delete.
- Catalog filters parse the literal query values `true` and `false`. Device ID syntax is checked before database lookup. Image search caches each query separately; catalog image selection looks up the specified device directly. The provider caps search at 100, so image search is not a complete enumeration of a large catalog.
- OpenAPI records cookie authentication on REST routes, startup polling, the starting health response, catalog filters, and fractional placement heights. The existing demo script no longer sends independent placement heights.

No schema migration was needed for these code-level fixes. Existing placement rows have not been inspected or reconciled with asset heights; that requires the configured database before a release claim.

## Evidence

| Check | Result |
| --- | --- |
| `cd Backend && npm run build` | Passed after changes. |
| `cd Backend && npm run typecheck` | Passed after changes. |
| `cd Frontend/nuxt && npm run typecheck` | Passed after the rack page change. |
| `cd Backend && npm run catalog:test` | Not run against a verified development database. The test now uses the `PG_*` connection settings. |
| `cd Backend && npx drizzle-kit check --config=drizzle.config.ts` | Passed with test `PG_*` settings; this checks migration metadata without connecting to a database. |
| Migrations, API/session/MCP, catalog refresh, image routes, rack/port concurrency | Not run: development database and authenticated server unavailable. |
| `scripts/verify-v1.mjs` | Not run: it writes persistent demo records and requires `RACKCHIEF_TEST_COOKIE`. |

## Required verification before V1 acceptance

With the intended development database configured, review existing rack placement heights and overlapping/cross-column connection records before release. Run migrations, then run the commands below against that same target. Exercise first-admin setup on an empty database, login/session/logout, registration rejection, 401 REST access, setup race, and startup failure. Test representative happy and invalid/conflict paths for assets/types, components, locations, racks, networking and IPs, relationships, projects/items/updates, catalog/images, and MCP disabled/token modes. Send concurrent placement, rack resize, asset resize, and connection POST/PATCH requests; confirm one succeeds where they conflict. Compare actual JSON with `/openapi.json`. Run `scripts/check-integrity.mjs` for uniquely named rack and port conflict fixtures; it attempts to remove only its own records. The opt-in demo script is not a cleanup-safe integration test and should only be run when persistent demo records are wanted.

```sh
cd Backend && npm ci && npm run build && npm run typecheck
cd ..
PG_HOST=db docker compose -f docker-compose.yml -f docker.postgres.yml up -d db --wait
PG_HOST=db docker compose -f docker-compose.yml -f docker.postgres.yml up -d --build backend
PG_HOST=db docker compose -f docker-compose.yml -f docker.postgres.yml exec backend npm run catalog:test
# Poll /startup/status, then exercise API with a session cookie.
cd Backend
# Against the same development API with an authenticated session:
RACKCHIEF_TEST_COOKIE='<session cookie>' node scripts/check-integrity.mjs
# Only where persistent demo data is acceptable:
RACKCHIEF_TEST_COOKIE='<session cookie>' node scripts/verify-v1.mjs
```

Verified development database connectivity and the live checks above are still required for a stable V1 claim. Further observed defects should be fixed within the frozen scope before release.
