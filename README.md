# RackChief Backend

RackChief's Express API serves the V1 REST routes and the optional MCP endpoint in the same process and Docker image.

## MCP

The MCP Streamable HTTP endpoint is always `/mcp`. It is disabled by default: if `mcp.enabled` is absent or false in `app_settings`, `/mcp` returns 404. Changing the setting takes effect on the next request without restarting the backend. `/mcp` is a protocol endpoint and is not part of the REST OpenAPI document.

An authenticated RackChief user enables it with `PATCH /api/v1/settings/mcp` and `{"enabled":true}`. `GET /api/v1/settings/mcp` reads the current state. Normal V1 Supabase authentication protects these management routes and `GET/POST /api/v1/mcp-tokens` plus `PATCH/DELETE /api/v1/mcp-tokens/{id}`.

Create a separately named MCP token for each integration, such as Hermes, MetaMCP, or an OpenWebUI-compatible MCP client. The `POST /api/v1/mcp-tokens` response shows the raw token **once**. Save it then; later list and update responses contain only metadata. The database stores only its SHA-256 hash. Clients send:

```http
Authorization: Bearer rc_mcp_xxxxx
```

MCP tokens are distinct from Supabase JWTs. Disabled, expired, or deleted tokens fail authentication immediately. Token expiration is optional and can be changed or cleared through the management API. The token's `lastUsedAt` changes after successful authentication.

Use HTTPS in production. Treat MCP tokens like passwords, create separate tokens per integration, revoke unused tokens, and set expiration dates when appropriate. No MCP-specific environment variable, container, or process is needed.

The exposed tools are `assets_list`, `assets_get`, `projects_list`, `projects_get`, `projects_add_update`, `projects_add_item`, `projects_update_item`, and `projects_delete_item`. They call the same application services as the V1 REST API.

After pulling this change, run `npm install`, `npm run db:migrate`, and `npm run build` from `Backend/` before restarting the existing backend process. Database migrations must run before enabling MCP or using its management routes.
