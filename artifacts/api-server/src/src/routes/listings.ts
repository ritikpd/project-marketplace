import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { db, listingsTable, usersTable, wishlistTable } from "@workspace/db";
import {
  CreateListingBody,
  UpdateListingBody,
  GetListingParams,
  UpdateListingParams,
  DeleteListingParams,
  GetSimilarListingsParams,
  ReportListingParams,
  ReportListingBody,
  ListListingsQueryParams,
  GetFeaturedListingsQueryParams,
  GetRecentListingsQueryParams,
  AdminListListingsQueryParams,
  AdminUpdateListingStatusParams,
  AdminUpdateListingStatusBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/requireAuth";
import { reportsTable } from "@workspace/db";

const router: IRouter = Router();

async function enrichListings(listings: any[], currentUserId?: string | null) {
  const sellerIds = [...new Set(listings.map((l) => l.sellerId))];
  let sellers: any[] = [];
  if (sellerIds.length > 0) {
    sellers = await db.select().from(usersTable).where(
      sql`${usersTable.clerkId} = ANY(${sql.raw(`ARRAY[${sellerIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(",")}]::text[]`)})`,
    );
  }
  const sellerMap = new Map(sellers.map((s) => [s.clerkId, s]));
  return listings.map((l) => {
    const seller = sellerMap.get(l.sellerId);
    return {
      ...l,
      sellerName: seller?.name ?? null,
      sellerAvatar: seller?.avatar ?? null,
      sellerVerified: seller?.isVerified ?? false,
      sellerRating: 4.5,
      createdAt: l.createdAt?.toISOString?.() ?? l.createdAt,
      updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt ?? null,
    };
  });
}

// GET /listings
router.get("/listings", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, category, location, condition, minPrice, maxPrice, sort, featured, page = 1, limit = 20 } = parsed.data;

  const conditions: any[] = [eq(listingsTable.status, "active")];
  if (q) conditions.push(ilike(listingsTable.title, `%${q}%`));
  if (category) conditions.push(eq(listingsTable.category, category));
  if (location) conditions.push(eq(listingsTable.location, location));
  if (condition) conditions.push(eq(listingsTable.condition, condition));
  if (minPrice != null) conditions.push(gte(listingsTable.price, minPrice));
  if (maxPrice != null) conditions.push(lte(listingsTable.price, maxPrice));
  if (featured) conditions.push(eq(listingsTable.featured, true));

  const whereClause = and(...conditions);
  const offset = (page - 1) * limit;

  let orderBy;
  switch (sort) {
    case "price_asc": orderBy = asc(listingsTable.price); break;
    case "price_desc": orderBy = desc(listingsTable.price); break;
    case "oldest": orderBy = asc(listingsTable.createdAt); break;
    default: orderBy = desc(listingsTable.createdAt); break;
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(whereClause);
  const rows = await db.select().from(listingsTable).where(whereClause).orderBy(orderBy).limit(limit).offset(offset);

  const enriched = await enrichListings(rows);
  res.json({ listings: enriched, total: countResult?.count ?? 0, page, limit });
});

// POST /listings
router.post("/listings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  const { latitude, longitude, ...rest } = parsed.data;
  const [listing] = await db.insert(listingsTable).values({
    ...rest,
    sellerId: clerkUserId,
    status: parsed.data.status ?? "active",
    images: parsed.data.images ?? [],
    latitude: latitude != null ? String(latitude) : null,
    longitude: longitude != null ? String(longitude) : null,
  }).returning();
  const enriched = await enrichListings([listing], clerkUserId);
  res.status(201).json(enriched[0]);
});

// GET /listings/featured
router.get("/listings/featured", async (req, res): Promise<void> => {
  const parsed = GetFeaturedListingsQueryParams.safeParse(req.query);
  const lim = parsed.data?.limit ?? 8;
  const rows = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.featured, true), eq(listingsTable.status, "active")))
    .orderBy(desc(listingsTable.createdAt))
    .limit(lim);
  const enriched = await enrichListings(rows);
  res.json(enriched);
});

// GET /listings/nearby
router.get("/listings/nearby", async (req, res): Promise<void> => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 50;
  const lim = parseInt(req.query.limit as string) || 12;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  // Haversine distance in km using approximate city coords
  // Returns all active listings whose location city is within radius km
  const CITY_COORDS: Record<string, [number, number]> = {
    "Kathmandu": [27.7172, 85.3240],
    "Lalitpur": [27.6588, 85.3247],
    "Bhaktapur": [27.6710, 85.4298],
    "Pokhara": [28.2096, 83.9856],
    "Chitwan": [27.5291, 84.3542],
    "Butwal": [27.7006, 83.4532],
    "Dharan": [26.8065, 87.2846],
    "Biratnagar": [26.4525, 87.2718],
    "Nepalgunj": [28.0500, 81.6167],
    "Janakpur": [26.7288, 85.9233],
  };

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const nearbyCities = Object.entries(CITY_COORDS)
    .filter(([, [clat, clng]]) => haversine(lat, lng, clat, clng) <= radius)
    .map(([city]) => city);

  if (nearbyCities.length === 0) {
    res.json([]);
    return;
  }

  const rows = await db.select().from(listingsTable)
    .where(and(
      eq(listingsTable.status, "active"),
      sql`${listingsTable.location} = ANY(${sql.raw(`ARRAY[${nearbyCities.map(c => `'${c.replace(/'/g, "''")}'`).join(",")}]::text[]`)})`
    ))
    .orderBy(desc(listingsTable.createdAt))
    .limit(lim);

  const enriched = await enrichListings(rows);
  res.json(enriched);
});

// GET /listings/recent
router.get("/listings/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentListingsQueryParams.safeParse(req.query);
  const lim = parsed.data?.limit ?? 12;
  const rows = await db.select().from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .orderBy(desc(listingsTable.createdAt))
    .limit(lim);
  const enriched = await enrichListings(rows);
  res.json(enriched);
});

// GET /listings/:id
router.get("/listings/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  // Increment view count
  await db.update(listingsTable).set({ viewCount: listing.viewCount + 1 }).where(eq(listingsTable.id, listing.id));
  const enriched = await enrichListings([listing]);
  res.json(enriched[0]);
});

// PATCH /listings/:id
router.patch("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (existing.sellerId !== clerkUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { latitude: lat2, longitude: lng2, ...restUpdate } = parsed.data;
  const updateData = {
    ...restUpdate,
    ...(lat2 !== undefined ? { latitude: lat2 != null ? String(lat2) : null } : {}),
    ...(lng2 !== undefined ? { longitude: lng2 != null ? String(lng2) : null } : {}),
  };
  const [updated] = await db.update(listingsTable).set(updateData).where(eq(listingsTable.id, params.data.id)).returning();
  const enriched = await enrichListings([updated], clerkUserId);
  res.json(enriched[0]);
});

// DELETE /listings/:id
router.delete("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  if (existing.sellerId !== clerkUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(listingsTable).where(eq(listingsTable.id, params.data.id));
  res.sendStatus(204);
});

// GET /listings/:id/similar
router.get("/listings/:id/similar", async (req, res): Promise<void> => {
  const params = GetSimilarListingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, params.data.id));
  if (!listing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const rows = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.category, listing.category), eq(listingsTable.status, "active"), sql`${listingsTable.id} != ${listing.id}`))
    .orderBy(desc(listingsTable.createdAt))
    .limit(6);
  const enriched = await enrichListings(rows);
  res.json(enriched);
});

// POST /listings/:id/report
router.post("/listings/:id/report", requireAuth, async (req, res): Promise<void> => {
  const params = ReportListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ReportListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  await db.insert(reportsTable).values({
    listingId: params.data.id,
    reporterId: clerkUserId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });
  res.status(201).json({ message: "Report submitted" });
});

// GET /my/listings
router.get("/my/listings", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId;
  const rows = await db.select().from(listingsTable)
    .where(eq(listingsTable.sellerId, clerkUserId))
    .orderBy(desc(listingsTable.createdAt));
  const enriched = await enrichListings(rows, clerkUserId);
  res.json(enriched);
});

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /admin/listings
router.get("/admin/listings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminListListingsQueryParams.safeParse(req.query);
  const status = parsed.data?.status;
  const conditions = status ? [eq(listingsTable.status, status)] : [];
  const rows = await db.select().from(listingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(listingsTable.createdAt));
  const enriched = await enrichListings(rows);
  res.json(enriched);
});

// PATCH /admin/listings/:id/status
router.patch("/admin/listings/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateListingStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateListingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(listingsTable).set({ status: parsed.data.status }).where(eq(listingsTable.id, params.data.id)).returning();
  const enriched = await enrichListings([updated]);
  res.json(enriched[0]);
});

export default router;
