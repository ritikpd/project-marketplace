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

## Production-Readiness Fixes Applied (June 2026)

**DB tables were never created** — schema is code-first Drizzle. Must run `pnpm --filter @workspace/db push` to apply schema after any DB provision. This creates all 8 tables. The only SQL migration file (`lib/db/migrations/0001_add_performance_indexes.sql`) creates indexes only — it assumes tables already exist.

**Why:** `drizzle-kit push` reads `lib/db/src/schema/index.ts` and syncs directly; there is no migration file for initial table creation.

**Object storage must be provisioned** via `setupObjectStorage()` in code_execution sandbox. Sets `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`. Without this, any upload attempt returns 500.

**ALLOWED_ORIGINS** must be set via `setEnvVars({ values: { ALLOWED_ORIGINS: "https://${REPLIT_DEV_DOMAIN},http://localhost:5173,..." } })`. Default is `http://localhost:5173` only, which blocks all browser API calls in Replit dev environment.

**After env var changes**: Always restart `artifacts/api-server: API Server` workflow so the new process reads the updated environment.

**Demo seed data**: 12 listings + 3 demo users inserted directly via `executeSql`. Uses placeholder image paths `/placeholder/*.jpg` (broken images, but good for demo structure).

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
- All 8 DB tables created + performance indexes applied
- Object storage provisioned (bucket: `replit-objstore-27061e50-a1ce-4121-bac6-0cee0c9fda51`)
- ALLOWED_ORIGINS set to Replit dev domain
- 12 demo listings seeded across 5 categories, 3 demo sellers
- Clerk development keys active (`pk_test_*`)
- Categories seeded in-code (not DB table) in categories.ts route
