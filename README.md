# RackChief Backend

RackChief is fully self-hostable. The backend requires PostgreSQL through `DATABASE_URL`; managed PostgreSQL is optional. Authentication is provided locally by Better Auth using email/password and HttpOnly session cookies. No Supabase project or other cloud service is required.

From `Backend/`, configure `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 random characters), and `BETTER_AUTH_URL`, then run `npm run build` and `npm start`. The backend applies pending Drizzle migrations before it starts listening; startup fails if PostgreSQL is unavailable or migrations cannot be applied.

On a new database, `GET /api/v1/setup/status` reports whether setup is required. `POST /api/v1/setup/admin` creates the first administrator; once a user exists, further setup attempts and public registration are rejected.

RackChief REST endpoints live under `/api/v1` and use Better Auth session cookies. Browser clients should send credentials; non-browser scripting should retain the cookie returned by Better Auth. A custom bearer/JWT API is intentionally out of scope for V1. `/health`, `/openapi.json`, `/docs`, and setup status are public. MCP remains separate: it is disabled by default and uses RackChief-owned hashed bearer tokens at `/mcp`.
