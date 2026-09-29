# RackChief Backend V1 Goals

This document defines the remaining backend work required to reach a practical RackChief V1.

RackChief V1 should be able to describe a homelab accurately enough to answer:

- What assets do I own?
- Where are they physically located?
- What hardware is installed in them?
- What spare hardware do I have?
- What rack position does an asset occupy?
- What network interfaces and ports exist?
- How are physical ports connected?
- What IP addresses belong to which interfaces?
- What projects and purchases affect those assets?
- What relationships exist between assets?
- Can MCP clients read and update the important parts of this data?

The goal is a useful inventory and planning system, not a full NetBox replacement.

Do not add monitoring, SNMP polling, configuration management, DNS, DHCP, routing, firewall management, secrets management, or automatic discovery to V1.

---

# Current Backend State

The current backend already includes:

- TypeScript
- Express 5
- Drizzle ORM
- PostgreSQL hosted by Supabase
- Supabase Auth
- Zod validation
- OpenAPI / Swagger
- REST API versioned under `/api/v1`
- MCP endpoint at `/mcp`

Existing domain models:

- asset_types
- assets
- projects
- project_assets
- project_items
- project_updates
- app_settings
- mcp_tokens

Existing modules:

- assets
- asset-types
- projects
- mcp-admin
- MCP tools for assets/projects

Do not rewrite existing working modules unless required for compatibility with the new domain model.

---

# General Implementation Rules

For every new backend domain:

1. Add Drizzle schema.
2. Generate a new migration.
3. Inspect the generated migration.
4. Run the migration against the configured development Supabase database.
5. Add Zod request/response schemas.
6. Add repository functions.
7. Add service functions.
8. Add REST routes under `/api/v1`.
9. Add per-module OpenAPI registration.
10. Run `npm run build`.
11. Verify the new endpoints against the development database.
12. Only after the REST model is stable, add MCP tools where useful.

The development Supabase database is disposable.

Do not create:
- local PostgreSQL
- Docker PostgreSQL
- Testcontainers
- shadow databases
- temporary database instances
- alternate Supabase projects

Use the configured `DATABASE_URL`.

Prefer small, focused modules and match the architecture already used by `assets`, `projects`, and `mcp-admin`.

---

# Step 0 — Split Database Schema Before Adding More Tables

The current `src/db/schema.ts` is becoming too large.

Refactor it into domain-specific schema files before adding the remaining V1 tables.

Target structure:

```text
src/db/schema/
├── index.ts
├── assets.ts
├── components.ts
├── locations.ts
├── racks.ts
├── networking.ts
├── relationships.ts
├── projects.ts
└── settings.ts
```

`src/db/schema/index.ts` should re-export all schema objects and inferred types.

Existing imports should continue to work with minimal disruption.

Do not alter existing database behavior during this step.

## Acceptance criteria

- Existing migrations remain untouched.
- Existing API behavior does not change.
- `npm run build` succeeds.
- Existing assets/projects/MCP functionality still compiles.
- New schema layout is ready for additional V1 models.

---

# Step 1 — Hardware Components and Spare Inventory

Add generic hardware component inventory.

The goal is to inventory installed hardware and spare hardware without creating a separate table for every component category.

## New enum

Suggested component status values:

```text
installed
spare
planned
retired
failed
```

If a better naming scheme fits the existing conventions, preserve the intent.

## New table: `component_types`

Fields:

```text
id uuid PK
name text not null
slug text not null unique
description text nullable
built_in boolean not null default false
created_at timestamptz not null
updated_at timestamptz not null
```

Seed useful built-in types:

```text
CPU
Memory
Disk
SSD
GPU
Network Adapter
HBA
RAID Controller
Power Supply
Fan
Optical Drive
Other
```

Do not make this list hard-coded forever; built-in types should coexist with future custom types.

## New table: `components`

Fields:

```text
id uuid PK

asset_id uuid nullable FK assets
component_type_id uuid not null FK component_types

name text not null

manufacturer text nullable
model text nullable
part_number text nullable
serial_number text nullable

quantity integer not null default 1

status component_status not null

attributes jsonb not null default {}

storage_location text nullable

installed_at timestamptz nullable
removed_at timestamptz nullable

notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Important behavior:

- `asset_id` is nullable.
- A component with `asset_id = null` may represent a spare.
- `attributes` stores component-specific metadata without requiring many specialized tables.
- Do not build a generic EAV/property-table system in V1.

Example attributes:

Memory:

```json
{
  "capacityGb": 16,
  "speedMt": 2133,
  "memoryType": "DDR4",
  "rank": "2R",
  "ecc": true,
  "registered": true
}
```

Disk:

```json
{
  "capacityBytes": 4000787030016,
  "interface": "SAS",
  "rpm": 7200,
  "logicalSectorSize": 4096
}
```

GPU:

```json
{
  "vramGb": 16,
  "slotWidth": 1,
  "tdpWatts": 60
}
```

## REST API

Add:

```text
GET    /api/v1/component-types
GET    /api/v1/component-types/:id

GET    /api/v1/components
GET    /api/v1/components/:id
POST   /api/v1/components
PATCH  /api/v1/components/:id
DELETE /api/v1/components/:id
```

Useful filters for `GET /components`:

```text
assetId
componentTypeId
status
unassigned=true
```

Also consider:

```text
GET /api/v1/assets/:assetId/components
```

if that matches existing route patterns cleanly.

Permanent deletion may be allowed directly for components unless there is a strong existing archive convention to preserve.

## Asset response integration

Do not make asset list responses huge.

Prefer either:

- asset detail includes components, or
- asset detail exposes components through a dedicated route.

Choose the cleaner option based on existing response patterns.

## Acceptance criteria

- Installed components can belong to an asset.
- Spare components can exist without an asset.
- Custom component attributes round-trip correctly through JSON.
- Built-in component types are seeded.
- OpenAPI is synchronized.
- `npm run build` succeeds.

---

# Step 2 — Locations

Add a lightweight hierarchical location model.

Do not reproduce NetBox's full Site/Region/Tenant model.

## New table: `locations`

Fields:

```text
id uuid PK
name text not null
description text nullable
parent_id uuid nullable FK locations
created_at timestamptz not null
updated_at timestamptz not null
```

The hierarchy should support examples such as:

```text
Home
└── Basement
    ├── Server Rack Area
    └── Storage Shelf
```

Add optional location references where appropriate:

```text
assets.location_id nullable
components.location_id nullable
racks.location_id nullable
```

For spare components, `location_id` should eventually be preferred over freeform `storage_location`, but keeping both for V1 is acceptable if useful.

Prevent obvious self-parenting.

Do not implement complex recursive path caching unless actually needed.

## REST API

```text
GET    /api/v1/locations
GET    /api/v1/locations/:id
POST   /api/v1/locations
PATCH  /api/v1/locations/:id
DELETE /api/v1/locations/:id
```

Deletion should fail with a clear `409` if the location still contains referenced objects or child locations, unless a safe cascading design is intentionally chosen.

## Acceptance criteria

- Locations can be nested.
- Assets can optionally belong to a location.
- Components can optionally belong to a location.
- Racks can optionally belong to a location.
- No location is required for any existing asset.
- Existing asset data remains valid.

---

# Step 3 — Racks and Rack Placements

Rack layouts are optional.

Assets must remain valid without a rack placement.

Do not model rack location directly as only `asset.rack_id` and `asset.rack_unit`.

Use a separate placement entity.

## New table: `racks`

Fields:

```text
id uuid PK

name text not null
description text nullable

total_units integer not null
starting_unit integer not null default 1

location_id uuid nullable FK locations

notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Validate reasonable rack unit counts.

## New enum: rack orientation

```text
front
rear
```

Optional depth enum:

```text
full
half
shallow
```

Depth may be omitted from V1 if it adds unnecessary complexity.

## New table: `rack_placements`

Fields:

```text
id uuid PK

rack_id uuid not null FK racks
asset_id uuid not null FK assets

start_unit integer not null
height_units integer not null default 1

orientation rack_orientation not null default front

notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Constraints:

- `start_unit >= starting_unit`
- `height_units >= 1`
- placement must fit inside rack capacity
- an asset should normally have at most one active placement per orientation
- overlapping placements in the same orientation should be rejected

Implement overlap validation in the service layer if a database constraint would become overly complex.

## REST API

```text
GET    /api/v1/racks
GET    /api/v1/racks/:id
POST   /api/v1/racks
PATCH  /api/v1/racks/:id
DELETE /api/v1/racks/:id

GET    /api/v1/racks/:rackId/placements
POST   /api/v1/racks/:rackId/placements
PATCH  /api/v1/racks/:rackId/placements/:placementId
DELETE /api/v1/racks/:rackId/placements/:placementId
```

Rack detail should ideally include placement summaries.

Placement summaries should include enough asset data to render a rack layout without extra per-row requests.

## Acceptance criteria

- A rack can be created with total U capacity.
- Assets can optionally be placed in racks.
- Multi-U assets are supported.
- Overlapping placements are rejected.
- Unracked assets remain fully supported.
- Rack detail returns enough information for a frontend rack visualization.

---

# Step 4 — Network Interfaces

Move toward a more realistic network model without implementing full IPAM.

The current `assets.ip_address` field may remain for compatibility during V1.

Do not remove it yet.

## New enum: interface type

Suggested values:

```text
ethernet
wireless
virtual
bridge
bond
loopback
other
```

## New table: `network_interfaces`

Fields:

```text
id uuid PK

asset_id uuid not null FK assets

name text not null
description text nullable

mac_address text nullable
speed_mbps integer nullable

interface_type network_interface_type not null
enabled boolean not null default true

notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Use normalized MAC validation at the API layer.

Do not require a MAC address because virtual interfaces, bridges, and incomplete inventory may not have one.

## REST API

```text
GET    /api/v1/assets/:assetId/interfaces
POST   /api/v1/assets/:assetId/interfaces

GET    /api/v1/network-interfaces/:id
PATCH  /api/v1/network-interfaces/:id
DELETE /api/v1/network-interfaces/:id
```

A global list endpoint is optional but useful:

```text
GET /api/v1/network-interfaces
```

with asset filtering.

## Acceptance criteria

- Assets can have zero or more network interfaces.
- Interfaces may be physical or virtual.
- MAC address is optional.
- Existing asset `ipAddress` remains usable during migration.

---

# Step 5 — Network Ports

Add physical port inventory separately from logical interfaces.

This is especially important for switches, patching, servers with multi-port NICs, and infrastructure diagrams.

## New enum: port type

Suggested values:

```text
rj45
sfp
sfp_plus
sfp28
qsfp
qsfp28
fiber
other
```

Adjust names only if necessary for consistency.

## New table: `network_ports`

Fields:

```text
id uuid PK

asset_id uuid not null FK assets
interface_id uuid nullable FK network_interfaces

name text not null
port_number integer nullable

port_type network_port_type not null

speed_mbps integer nullable

poe_capable boolean not null default false
poe_enabled boolean not null default false
enabled boolean not null default true

description text nullable
notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Rules:

- A port always belongs to an asset.
- `interface_id` is optional.
- Do not require every server interface to have a separate physical port model if the user does not care.
- Switches may have many ports without separate logical interfaces.

## REST API

```text
GET    /api/v1/assets/:assetId/ports
POST   /api/v1/assets/:assetId/ports

GET    /api/v1/network-ports/:id
PATCH  /api/v1/network-ports/:id
DELETE /api/v1/network-ports/:id
```

Global listing/filtering is useful:

```text
GET /api/v1/network-ports?assetId=...
```

## Acceptance criteria

- A switch can have many physical ports.
- Server NIC ports can optionally reference network interfaces.
- PoE metadata is supported.
- Ports remain useful without requiring full IPAM.

---

# Step 6 — Network Connections

Add physical connection tracking.

Do not add cable serial numbers, cable inventory, or cable lifecycle management in V1.

## New enum: connection type

Suggested:

```text
copper
fiber
dac
wireless
virtual
other
```

If physical-only connection tracking is preferred, omit `wireless` and `virtual`.

## New table: `network_connections`

Fields:

```text
id uuid PK

port_a_id uuid not null FK network_ports
port_b_id uuid not null FK network_ports

connection_type network_connection_type nullable

label text nullable
notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Rules:

- `port_a_id != port_b_id`
- a physical port should normally participate in at most one active physical connection
- connection direction is not meaningful
- treat A/B as endpoints, not source/destination

## REST API

```text
GET    /api/v1/network-connections
GET    /api/v1/network-connections/:id
POST   /api/v1/network-connections
PATCH  /api/v1/network-connections/:id
DELETE /api/v1/network-connections/:id
```

Useful filters:

```text
assetId
portId
```

## Acceptance criteria

RackChief can represent:

```text
Artemis X520 Port 1
        ↕
USW Aggregation Port 3
```

without duplicating a connection in both directions.

---

# Step 7 — IP Addresses

Introduce addresses attached to network interfaces.

Do not attempt full subnet/VLAN/IPAM management in V1.

## New table: `ip_addresses`

Fields:

```text
id uuid PK

network_interface_id uuid not null FK network_interfaces

address inet not null
is_primary boolean not null default false

description text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Optional:

```text
hostname text nullable
```

Do not add subnet allocation, DHCP reservations, DNS zones, or VLAN management yet.

## Compatibility with `assets.ip_address`

Do not remove `assets.ip_address` during initial implementation.

Document it as legacy/convenience primary-address data.

After the new interface/address model is proven, a later migration may deprecate it.

Do not introduce automatic bidirectional synchronization unless there is a strong reason.

## REST API

```text
GET    /api/v1/network-interfaces/:interfaceId/ip-addresses
POST   /api/v1/network-interfaces/:interfaceId/ip-addresses

PATCH  /api/v1/ip-addresses/:id
DELETE /api/v1/ip-addresses/:id
```

Global read endpoint is optional:

```text
GET /api/v1/ip-addresses
```

## Acceptance criteria

- Interfaces may have multiple addresses.
- IPv4 and IPv6 are supported through PostgreSQL `inet`.
- One address may be marked primary.
- Full IPAM is explicitly out of scope.

---

# Step 8 — Asset Relationships

Add generic relationships between assets.

Avoid many specialized relationship tables.

## New enum or validated relationship type

Initial relationship types:

```text
hosts
runs_on
depends_on
backs_up_to
managed_by
powered_by
connected_to
other
```

If an enum feels too restrictive for V1, use text plus validation and document known values.

## New table: `asset_relationships`

Fields:

```text
id uuid PK

source_asset_id uuid not null FK assets
target_asset_id uuid not null FK assets

relationship_type text/enum not null

notes text nullable

created_at timestamptz not null
updated_at timestamptz not null
```

Rules:

- source and target cannot be the same asset
- prevent duplicate identical relationships

Direction matters for most relationship types.

Examples:

```text
Proxmox Host --hosts--> VM
NAS --backs_up_to--> Backup Target
UPS --powered_by / powers--> Server
```

Choose relationship names so direction remains obvious.

## REST API

```text
GET    /api/v1/asset-relationships
POST   /api/v1/asset-relationships
PATCH  /api/v1/asset-relationships/:id
DELETE /api/v1/asset-relationships/:id
```

Useful filter:

```text
assetId
```

Asset detail may include relationship summaries if doing so does not make the payload excessive.

## Acceptance criteria

- Arbitrary useful asset-to-asset relationships can be recorded.
- Duplicate relationships are prevented.
- Self-relations are rejected.

---

# Step 9 — Expand Asset Detail Without Bloated Asset Lists

At this stage, review the asset API.

The asset list should stay lightweight.

`GET /api/v1/assets` should not return every component, port, IP, connection, and rack placement.

For `GET /api/v1/assets/:id`, choose a useful V1 detail shape.

Suggested nested detail:

```text
asset
├── assetType
├── location summary
├── rackPlacement summary
├── components
├── interfaces
│   └── ipAddresses
├── ports
└── relationships
```

If this becomes too heavy, keep dedicated routes and include only summary counts/links in asset detail.

Optimize for the frontend needing a small number of requests, not for returning the entire database graph in one response.

## Acceptance criteria

- Asset list stays fast/simple.
- Asset detail is useful enough for a real inventory page.
- No accidental recursive relationship payloads.

---

# Step 10 — MCP V1 Expansion

Only after the REST/service model is stable, expose high-value infrastructure tools.

Do not create raw CRUD or database-query tools.

MCP tools should call the service layer.

Suggested read tools:

```text
assets_list
assets_get

components_list
components_get

racks_list
racks_get

network_ports_list
network_connections_list

projects_list
projects_get
```

Suggested action tools where useful:

```text
components_create
components_update

rack_place_asset
rack_remove_asset

network_connect_ports
network_disconnect_ports

projects_add_update
projects_add_item
projects_update_item
projects_delete_item
```

Avoid exposing every trivial admin action merely because a REST endpoint exists.

MCP tool descriptions should make clear what data is returned and what side effects occur.

## Acceptance criteria

- Infrastructure data can be queried meaningfully through MCP.
- MCP still contains no raw SQL or generic DB-access tool.
- MCP actions reuse service-layer validation.
- Existing MCP authentication model is unchanged.

---

# Step 11 — V1 API Consistency Review

Before calling the backend V1 complete, review all modules for consistency.

Check:

- route naming
- response naming
- timestamps
- archive/delete semantics
- pagination needs
- query filters
- Zod strictness
- error handling
- OpenAPI naming
- nullable vs optional semantics
- indexes on foreign keys
- unique constraints
- cascade vs restrict behavior

Pay particular attention to:

```text
project_assets.asset_id
rack_placements.asset_id
components.asset_id
network_interfaces.asset_id
network_ports.asset_id
network_connections port FKs
locations.parent_id
asset_relationships source/target FKs
```

Add covering indexes where normal lookup patterns require them.

Do not add pagination everywhere just for ceremony. If lists are expected to stay small in V1, simple arrays are acceptable.

---

# Step 12 — V1 Verification Dataset

Create a small realistic development dataset using the normal API or development database.

Do not add it as mandatory production seed data.

Suggested scenario:

```text
Location:
Home
└── Server Room

Rack:
Primary Rack
37U

Assets:
- Artemis / Server
- NAS / Storage
- USW Aggregation / Switch
- UPS / UPS

Components:
Artemis:
- CPU
- Memory
- GPU
- HBA
- SSDs

Spare:
- HBA
- SSD

Rack placements:
- Artemis
- NAS
- USW Aggregation
- UPS

Network:
- Artemis 10Gb interface
- Artemis SFP+ port
- USW Aggregation SFP+ port
- physical connection between them
- primary IP on Artemis interface

Relationships:
- UPS powers Artemis
- Artemis hosts one logical/VM asset if desired

Project:
- infrastructure upgrade with one purchase item
```

Use this dataset to verify realistic cross-domain behavior.

---

# Step 13 — Backend V1 Documentation

Update Backend README with:

- project purpose
- requirements
- environment variables
- Supabase/Postgres setup assumptions
- migrations
- development commands
- authentication model
- REST base path
- Swagger/OpenAPI locations
- MCP overview
- high-level domain model
- explicit V1 non-goals

Add a short domain overview such as:

```text
Assets
├── Components
├── Rack Placement
├── Interfaces
│   └── IP Addresses
├── Ports
│   └── Connections
└── Relationships

Projects
├── Assets
├── Items
└── Updates
```

---

# Step 14 — Backend V1 Release Checklist

Do not tag V1 until all required V1 backend goals below are complete.

## Required domain functionality

- [x] Assets
- [x] Asset types
- [x] Projects
- [x] Project asset associations
- [x] Project work/purchase items
- [x] Project updates/history
- [x] MCP configuration and tokens
- [x] Base MCP project/asset tools

Implemented:

- [x] Schema split
- [x] Component types
- [x] Hardware components
- [x] Spare hardware inventory
- [x] Locations
- [x] Racks
- [x] Rack placements
- [x] Network interfaces
- [x] Network ports
- [x] Network connections
- [x] Interface IP addresses
- [x] Asset relationships
- [x] Infrastructure MCP tools
- [x] V1 API consistency review
- [x] Realistic verification dataset
- [x] Backend README/documentation update

## Required technical checks

- [x] `npm run build` passes
- [x] all migrations apply successfully against development Supabase
- [x] `/health` works
- [x] `/openapi.json` generates successfully
- [x] Swagger UI works
- [x] all REST modules are represented in OpenAPI
- [x] MCP remains disabled by default
- [x] MCP authentication still works
- [x] no raw MCP token values are stored in the database
- [x] no secrets are committed
- [x] foreign-key lookup columns have appropriate indexes
- [x] existing assets/projects still work after migrations
- [x] no temporary/local PostgreSQL infrastructure was introduced

---

# Explicit V1 Non-Goals

Do not implement the following before backend V1 unless explicitly requested:

- monitoring
- alerting
- metrics
- SNMP polling
- automatic discovery
- virtualization synchronization
- Proxmox synchronization
- TrueNAS synchronization
- VLAN management
- subnet allocation
- DHCP
- DNS
- routing
- firewall management
- configuration management
- secret storage
- software/package inventory
- warranty API integrations
- purchase scraping
- vendor integrations
- cable serial-number inventory
- power usage telemetry
- automatic rack power calculations
- full ITSM/ticketing
- tenant/customer management
- custom-field framework
- generic EAV schema
- plugin system

These may be considered after V1.

---

# Definition of Backend V1

RackChief Backend V1 is complete when a user can:

1. Create assets and classify them by asset type.
2. Record detailed hardware installed in an asset.
3. Track spare components that are not currently installed.
4. Create locations and optionally assign infrastructure to them.
5. Create racks and place assets into rack units.
6. Inventory logical network interfaces.
7. Inventory physical network ports.
8. Record physical port-to-port connections.
9. Assign IPv4/IPv6 addresses to interfaces.
10. Record useful relationships between assets.
11. Create upgrade/planning projects tied to assets.
12. Track project work, purchases, costs, orders, and updates.
13. Read and update useful inventory/project information through authenticated REST APIs.
14. Access a useful subset of the same functionality through MCP.
15. Run all of this using the existing hosted Supabase/PostgreSQL development architecture.

The guiding V1 principle is:

> RackChief should describe what the homelab contains, where it is, how it is connected, and what changes are planned — without becoming a monitoring or infrastructure-control platform.
