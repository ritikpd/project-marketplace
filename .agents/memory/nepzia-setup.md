---
name: NEPZIA Marketplace Setup
description: Bootstrap steps, key decisions, and gotchas for the NEPZIA full-stack marketplace
---

# NEPZIA Marketplace Setup

## What was done
Full stack assembled from a 114MB zip (original source at `/tmp/nepzia/Marketplace-Platform/`):
- DB schema in `lib/db/src/schema/` (listings, users, conversations, offers, notifications, reports, wishlist)
- API routes in `artifacts/api-server/src/routes/` (listings, users, messages, offers, notifications, categories, wishlist)
- Frontend in `artifacts/nepzia/src/` (pages, components, hooks, lib)
- Clerk provisioned via `setupClerkWhitelabelAuth()`, DB via `createDatabase()`

## Critical gotchas

**Dark mode**: Applied by `class="dark"` on `<html>` in `artifacts/nepzia/index.html`. Missing this makes the app render in light mode (the scaffold default doesn't include it).

**Why:** The NEPZIA CSS uses `.dark` selector for the navy/crimson theme; `:root` is the light fallback.

**Stats routes**: `/api/stats/marketplace` and `/api/stats/categories` are inside `artifacts/api-server/src/routes/categories.ts`, not a separate stats file. Do not create a separate stats router — it's already there.

**sellerId**: Text field holding Clerk user ID string (not DB integer FK). All seller lookups join via `usersTable.clerkId`.

**requireAuth**: Sets `(req as any).clerkUserId`. Never use `req.auth`. `optionalAuth` sets it to null if no session.

**Clerk proxy middleware**: Must be mounted before `express.json()` in `app.ts` — order is critical.

**DB imports**: Always import tables from `@workspace/db` (never `@workspace/db/schema`). The barrel export is `lib/db/src/index.ts`.

**After schema changes**: Run `pnpm run typecheck:libs` before API server rebuild — rebuilds composite declarations so new tables are visible.

**Route order in App.tsx**: `/listings/new` and `/listings/:id/edit` MUST come before `/listings/:id` — Wouter matches top-to-bottom.

## Working state (as of June 2026)
- All 3 workflows running: api-server (port 8080), nepzia frontend (port 21411, preview `/`), mockup-sandbox
- Zero TypeScript errors (`pnpm run typecheck` passes)
- DB tables created (`pnpm --filter @workspace/db run push`)
- Categories seeded in-code (not DB table) in categories.ts route
- Clerk development keys active (`pk_test_*`)
