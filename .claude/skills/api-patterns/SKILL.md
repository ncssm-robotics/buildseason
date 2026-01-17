---
name: api-patterns
description: >-
  Convex backend patterns, queries, mutations, and backend conventions.
  Use when creating Convex functions, writing queries and mutations,
  or implementing backend features.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bun:*)
---

# Convex Backend Patterns

Backend patterns for Convex queries, mutations, and database operations.

## Adding a Convex Function

### Query (read-only)

```typescript
// convex/parts.ts
import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireTeamMember } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId);

    return await ctx.db
      .query("parts")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
  },
});
```

### Mutation (write)

```typescript
// convex/parts.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireTeamMember } from "./lib/permissions";

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    quantity: v.number(),
    reorderPoint: v.number(),
  },
  handler: async (ctx, args) => {
    await requireTeamMember(ctx, args.teamId);

    const partId = await ctx.db.insert("parts", args);
    return partId;
  },
});
```

## Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  parts: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    quantity: v.number(),
    reorderPoint: v.number(),
    vendorId: v.optional(v.id("vendors")),
  })
    .index("by_team", ["teamId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["teamId"],
    }),
});
```

## Permission Patterns

### Check team membership

```typescript
import { requireTeamMember } from "./lib/permissions";

export const list = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireTeamMember(ctx, teamId); // Throws if not member
    // ... rest of handler
  },
});
```

### Check role level

```typescript
import { requireRole } from "./lib/permissions";

export const update = mutation({
  args: { vendorId: v.id("vendors"), name: v.string() },
  handler: async (ctx, { vendorId, name }) => {
    const vendor = await ctx.db.get(vendorId);
    if (vendor?.teamId) {
      await requireRole(ctx, vendor.teamId, "mentor"); // Requires mentor+
    }
    await ctx.db.patch(vendorId, { name });
  },
});
```

## Query Patterns

### Filter with index

```typescript
// Efficient: uses index
const parts = await ctx.db
  .query("parts")
  .withIndex("by_team", (q) => q.eq("teamId", teamId))
  .collect();
```

### Filter without index

```typescript
// Less efficient: scans table
const globalVendors = await ctx.db
  .query("vendors")
  .filter((q) => q.eq(q.field("isGlobal"), true))
  .collect();
```

### Get single item

```typescript
const vendor = await ctx.db.get(vendorId);
if (!vendor) {
  throw new Error("Vendor not found");
}
```

### Get unique by index

```typescript
const membership = await ctx.db
  .query("teamMembers")
  .withIndex("by_user_team", (q) => q.eq("userId", userId).eq("teamId", teamId))
  .unique();
```

## File Locations

```
convex/
├── _generated/          # Auto-generated types (don't edit)
├── lib/
│   └── permissions.ts   # Auth helpers
├── schema.ts            # Database schema
├── auth.ts              # Auth configuration
├── auth.config.ts       # OAuth providers
├── http.ts              # HTTP routes (webhooks)
├── parts.ts             # Parts queries/mutations
├── orders.ts            # Orders queries/mutations
├── teams.ts             # Teams queries/mutations
├── vendors.ts           # Vendors queries/mutations
└── ...
```

## Frontend Usage

```typescript
// src/routes/team/$teamId/parts.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function PartsPage({ teamId }) {
  const parts = useQuery(api.parts.list, { teamId });
  const createPart = useMutation(api.parts.create);

  const handleCreate = async () => {
    await createPart({
      teamId,
      name: "New Part",
      quantity: 0,
      reorderPoint: 5,
    });
  };

  if (!parts) return <Loading />;
  return <PartsList parts={parts} onCreate={handleCreate} />;
}
```

## Anti-Patterns

- **Missing permission checks** - Always verify team membership
- **Not using indexes** - Use `withIndex` for filtered queries
- **Returning too much data** - Select only needed fields
- **N+1 queries** - Batch operations where possible
- **Editing \_generated/** - Never modify generated files
