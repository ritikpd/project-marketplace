---
name: NEPZIA Critical Fixes
description: Key gotchas and patterns discovered while applying the production-readiness audit fixes.
---

## Helmet 7 CSP — upgradeInsecureRequests
**Rule:** Never pass `undefined` or `false` to `upgradeInsecureRequests`. Helmet 7 throws at startup.
**Fix:** Conditionally spread the key:
```ts
...(NODE_ENV === "production" ? { upgradeInsecureRequests: [] as string[] } : {})
```

## sql.raw → inArray for SQL safety
**Rule:** Replace all `sql.raw(ARRAY[...])` patterns with Drizzle's `inArray()` helper.
**Why:** Manual string escaping is fragile. `inArray()` generates parameterized queries.

## N+1 batch pattern for messages conversations
**Rule:** Use subquery join to get last-message-per-conversation in 1 query instead of N.
```ts
const subq = db.select({ conversationId, maxId: sql`MAX(id)`.as('max_id') })
  .from(messagesTable).where(inArray(...)).groupBy(conversationId).as('sq');
const lastMsgs = db.select(...).from(subq).innerJoin(messagesTable, eq(messagesTable.id, subq.maxId));
```

## Drizzle schema index syntax (v0.31+)
**Rule:** Pass indexes as second argument array to pgTable:
```ts
pgTable("table", { columns }, (t) => [
  index("idx_name").on(t.column),
  uniqueIndex("unique_idx").on(t.col1, t.col2),
])
```

## SEO canonical / og:url domain
**Rule:** Never hardcode `nepzia.replit.app` in canonical or og:url tags.
**Fix:** Always use `window.location.origin` so dev/staging/prod all emit the correct domain.
