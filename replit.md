# NEPZIA Marketplace

Nepal's premium tech marketplace for buying and selling phones, laptops, cameras, gaming consoles, and other electronics — with verified sellers, geolocation, messaging, offers, wishlists, and an admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nepzia run dev` — run the frontend (port 21411, preview at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS v4, Wouter router, TanStack Query
- Auth: Clerk (Replit-managed), provisioned via `setupClerkWhitelabelAuth()`
- API: Express 5 + Clerk middleware (`@clerk/express`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nepzia/src/` — React frontend (pages, components, hooks)
- `artifacts/api-server/src/routes/` — Express route handlers (listings, users, messages, offers, notifications, categories, wishlist)
- `artifacts/api-server/src/middlewares/` — `requireAuth.ts`, `clerkProxyMiddleware.ts`
- `lib/db/src/schema/` — Drizzle table definitions (listings, users, conversations, offers, notifications, reports, wishlist)
- `lib/db/src/schema/index.ts` — re-exports all tables; import from `@workspace/db` directly
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for API types)
- `lib/api-zod/src/` — Generated Zod schemas from OpenAPI
- `lib/api-client-react/src/` — Generated TanStack Query hooks from OpenAPI
- `artifacts/nepzia/public/` — Logo, favicon, OG image, sitemap, robots.txt

## Architecture decisions

- **Clerk auth**: `requireAuth` middleware sets `(req as any).clerkUserId`; user profile is JIT-provisioned on `GET /api/users/me`. Never use `req.auth` directly.
- **sellerId is a Clerk string**: The `sellerId` field on listings is the Clerk user ID (text), not a DB integer FK.
- **DB imports**: All tables are exported from `@workspace/db` (the root `lib/db/src/index.ts`). Never import from `@workspace/db/schema`.
- **Route order**: In `App.tsx`, `/listings/new` and `/listings/:id/edit` come before `/listings/:id` (Wouter matches top-to-bottom).
- **Dark mode**: Applied via `class="dark"` on the `<html>` element in `artifacts/nepzia/index.html` — not toggled at runtime.
- **Stats/categories**: Served by `artifacts/api-server/src/routes/categories.ts` (includes `/stats/marketplace`, `/stats/categories`, `/categories`).
- **Drizzle numeric columns** return `string` in TypeScript; coerce with `String()` before insert/update.

## Product

- **Browse & Search**: Filter by category, location, price range, condition; voice search; map view with Leaflet
- **Listings**: Create / edit / delete with image upload; condition, price, geolocation coordinates
- **Buy flow**: Make offer or Buy Now modal; offer negotiation with accept/reject
- **Wishlist**: Save listings for later
- **Messages**: Conversation threads between buyer and seller
- **Notifications**: In-app notification bell with real-time polling
- **Seller profiles**: Public profile page with seller's active listings
- **Dashboard**: Personal listing management, offer tracking, message inbox
- **Admin panel**: Moderation queue, listing status management, marketplace stats
- **i18n**: Nepali (नेपाली) language toggle

## User preferences

_Populate as you build._

## Gotchas

- After DB schema changes: run `pnpm run typecheck:libs` BEFORE the API server can use new tables (rebuilds composite lib declarations).
- `pnpm run build` (for artifact packages) requires workflow-provided `PORT` and `BASE_PATH` env vars — use `pnpm run typecheck` for verification from the shell instead.
- The Clerk proxy middleware must be mounted BEFORE `express.json()` (it streams raw bytes). Order in `app.ts` matters.
- The `@clerk/react` peer dependency warnings about React 19 (`~19.0.3`) are harmless — React 19.1.0 works fine.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk auth setup and customization
