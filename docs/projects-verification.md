# Backend verification

Start the API against the configured PostgreSQL database; startup applies pending Drizzle migrations before opening the listening port. Verify `/health`, `/openapi.json`, `/docs`, and `/api/v1/setup/status`. Create the first administrator through `/api/v1/setup/admin`, sign in through `/api/auth/sign-in/email`, retain the returned HttpOnly session cookie, and use that cookie for authenticated `/api/v1` requests.

MCP remains independent: enable it through the authenticated MCP settings API, create a RackChief MCP token, and verify `/mcp` rejects missing or invalid MCP tokens. Do not use Supabase credentials or create a second database for verification.
