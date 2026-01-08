---
name: api-patterns
description: >-
  Hono API route patterns, database queries, and backend conventions.
  Use when creating API endpoints, writing route handlers, querying
  the database with Drizzle, or implementing backend features.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bun:*)
---

# API Patterns

Backend patterns for Hono API routes and Drizzle database queries.

## Adding an API Route

API routes use the chained Hono pattern for RPC type inference:

```typescript
// apps/api/src/routes/api.tsx
const exampleRoutes = new Hono<{ Variables: AuthVariables }>()
  .use("*", requireAuth)
  .get("/", async (c) => {
    const items = await db.query.items.findMany();
    return c.json(items);
  })
  .post("/", async (c) => {
    const body = await c.req.json();
    // ... create item
    return c.json({ id: newId });
  });

// Compose into main apiRoutes
const apiRoutes = new Hono().route("/api/example", exampleRoutes);

export type ApiRoutes = typeof apiRoutes;
```

## Response Patterns

### Wrapped responses for lists with metadata

```typescript
// Return object with array, not raw array
return c.json({
  items: results,
  total: count,
  page: currentPage,
});
```

### Error responses

```typescript
// Consistent error shape
return c.json({ error: "Not found" }, 404);
return c.json({ error: "Unauthorized" }, 401);
return c.json({ errors: validationResult.error.flatten() }, 400);
```

## Database Queries

```typescript
import { db } from "../db";
import { parts } from "../db/schema";
import { eq } from "drizzle-orm";

// Query with relations
const items = await db.query.parts.findMany({
  where: eq(parts.teamId, teamId),
  with: { vendor: true },
});
```

## OAuth Callback URLs

**CRITICAL:** In development, OAuth callbacks must redirect to the frontend (port 5173), not the API server (port 3000).

```typescript
// apps/api/src/components/SocialAuth.tsx
const getCallbackURL = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    return `${frontendUrl}/dashboard`; // Dev: http://localhost:5173/dashboard
  }
  return "/dashboard"; // Prod: relative (API serves frontend)
};
```

**Environment variable required in `.env`:**

```bash
FRONTEND_URL=http://localhost:5173
```

**Why this matters:**

- After OAuth, Better Auth redirects to the API server's callback endpoint
- The API then redirects to `callbackURL`
- If `callbackURL` is relative (`/dashboard`), it goes to `localhost:3000/dashboard`
- In dev, this shows "React frontend is not built" since frontend is on :5173

## Anti-Patterns

- **Raw arrays for paginated data** - Always wrap in object with metadata
- **Inconsistent error shapes** - Use `{ error: string }` or `{ errors: object }`
- **Missing auth middleware** - All team routes need `requireAuth` and team middleware
- **N+1 queries** - Use `with:` for relations instead of separate queries
- **Relative OAuth callback URLs in dev** - Use `FRONTEND_URL` env var for absolute URLs

## File Locations

- Routes: `apps/api/src/routes/`
- Schema: `apps/api/src/db/schema.ts`
- Middleware: `apps/api/src/middleware/`
- Types: `apps/api/src/client.ts` (exported for frontend)
