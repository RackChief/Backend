# RackChief Backend

RackChief is a homelab inventory and planning API. It records assets, installed and spare hardware, physical locations and racks, network interfaces and ports, IP addresses, physical connections, asset relationships, and projects. It uses Express 5, TypeScript, Drizzle ORM, a hosted PostgreSQL database, and Supabase Auth.

## Requirements and setup

- Node.js with npm (use the version supported by the checked-in dependencies)
- Access to the configured Supabase PostgreSQL development database
- A Supabase project for authentication

Create a local `.env` in `Backend/` with these variables. Do not commit it.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by Drizzle and migrations |
| `SUPABASE_URL` | Supabase Auth project URL |
| `SUPABASE_PUBLISHABLE_KEY` | JWT validation and development sign-in |
| `SUPABASE_SECRET_KEY` | Required by the current backend environment configuration |
| `PORT` | HTTP port; defaults to `3000` |
| `SUPABASE_TEST_EMAIL`, `SUPABASE_TEST_PASSWORD` | Optional credentials for `npm run auth:token` during development |

The configured development Supabase database is disposable. Use it for migrations and verification; this repository does not require another PostgreSQL instance. From `Backend/`:

```bash
npm install
npm run db:migrate
npm run build
npm run dev
```

For schema changes, edit `src/db/schema/`, run `npm run db:generate`, inspect the new SQL in `drizzle/`, then run `npm run db:migrate`. Keep previous migrations intact.

## HTTP API

REST endpoints live under `/api/v1` and require a Supabase bearer JWT. `GET /health`, `GET /openapi.json`, and the Swagger UI at `/docs` are public. OpenAPI is generated from per-module Zod registrations.

The main API resources are:

- `/assets`, `/asset-types`, `/components`, `/component-types`, `/locations`, `/racks`
- `/network-interfaces`, `/network-ports`, `/network-connections`, `/ip-addresses`, `/asset-relationships`
- `/projects`, `/settings/mcp`, `/mcp-tokens`

`GET /api/v1/assets` stays lightweight. `GET /api/v1/assets/{id}/detail` includes the asset's location, rack placement, components, interfaces and their IP addresses, ports, and direct relationships. Rack detail includes placement rows with asset summaries. Assets can exist without locations or rack placements, and components can exist without an asset as spares.

`assets.ipAddress` remains a legacy convenience field. Interface IP addresses are managed separately; neither field automatically updates the other. Full subnet and VLAN management is outside V1.

For development authentication, `npm run --silent auth:token` obtains a JWT using the optional test credentials. Do not print, save in source, or commit tokens.

## Domain model

```text
Locations
├── Assets
│   ├── Components
│   ├── Rack Placements → Racks
│   ├── Network Interfaces → IP Addresses
│   ├── Network Ports → Network Connections
│   └── Asset Relationships → Assets
└── Racks

Projects
├── Assets
├── Work and purchase items
└── Updates
```

Component types include seeded built-in categories and can be extended through `POST /api/v1/component-types`. Hardware-specific component details belong in the `attributes` JSON object. A network port can optionally reference an interface on the same asset. Each port can have one physical connection, and each interface can have one primary IP address.

## MCP

The Streamable HTTP endpoint is `/mcp`. It is disabled by default and returns 404 until an authenticated user sets `PATCH /api/v1/settings/mcp` to `{ "enabled": true }`. The MCP endpoint requires a separate RackChief MCP bearer token; Supabase JWTs manage settings and tokens through `/api/v1/settings/mcp` and `/api/v1/mcp-tokens`.

`POST /api/v1/mcp-tokens` reveals the raw token once. The database stores only its SHA-256 hash. Disable or delete tokens that are no longer used. MCP tools call the same services as REST and include asset and project reads/actions, component reads/updates, rack placement actions, and network port/connection reads/actions. MCP exposes neither raw SQL nor a generic database tool.

## V1 verification data

`scripts/verify-v1.mjs` is an optional, idempotent development dataset and API check. It creates a demo location hierarchy, 37U rack, server, NAS, switch, UPS, installed and spare components, placements, network interfaces and ports, IPv4 and IPv6 addresses, a connection, an asset relationship, and a project purchase item. It also checks several conflict responses and the assembled asset detail. Run only against the development environment while the API is running:

```bash
RACKCHIEF_TEST_TOKEN=$(npm run --silent auth:token) node scripts/verify-v1.mjs
```

The script never runs as part of migrations or production startup.

## V1 scope

V1 is inventory and planning. Monitoring, polling, automatic discovery, infrastructure synchronization, DNS, DHCP, routing, firewall management, secrets, VLAN/subnet allocation, configuration management, vendor integrations, and cable inventory are outside its scope.
