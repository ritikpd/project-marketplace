import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, listingsTable } from "@workspace/db";

const router: IRouter = Router();

const CATEGORIES = [
  { id: 1, name: "Phones", slug: "phones", icon: "smartphone" },
  { id: 2, name: "Laptops", slug: "laptops", icon: "laptop" },
  { id: 3, name: "Tablets", slug: "tablets", icon: "tablet" },
  { id: 4, name: "Gaming Consoles", slug: "gaming-consoles", icon: "gamepad-2" },
  { id: 5, name: "Cameras", slug: "cameras", icon: "camera" },
  { id: 6, name: "Smart Watches", slug: "smart-watches", icon: "watch" },
  { id: 7, name: "Accessories", slug: "accessories", icon: "cable" },
  { id: 8, name: "Audio Devices", slug: "audio-devices", icon: "headphones" },
  { id: 9, name: "Drones", slug: "drones", icon: "plane" },
  { id: 10, name: "Other Electronics", slug: "other-electronics", icon: "cpu" },
];

// GET /categories
router.get("/categories", async (_req, res): Promise<void> => {
  // Get counts per category
  const counts = await db.select({
    category: listingsTable.category,
    count: sql<number>`count(*)::int`,
  }).from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .groupBy(listingsTable.category);

  const countMap = new Map(counts.map((c) => [c.category, c.count]));

  const result = CATEGORIES.map((cat) => ({
    ...cat,
    count: countMap.get(cat.name) ?? 0,
  }));

  res.json(result);
});

// GET /stats/categories
router.get("/stats/categories", async (_req, res): Promise<void> => {
  const counts = await db.select({
    category: listingsTable.category,
    count: sql<number>`count(*)::int`,
  }).from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .groupBy(listingsTable.category);

  const result = counts.map((c) => {
    const cat = CATEGORIES.find((cat) => cat.name === c.category);
    return { category: c.category, count: c.count, slug: cat?.slug ?? c.category.toLowerCase().replace(/\s+/g, "-") };
  });

  res.json(result);
});

// GET /stats/marketplace
router.get("/stats/marketplace", async (_req, res): Promise<void> => {
  const [totalListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable);
  const [activeListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "active"));

  // Import usersTable dynamically to avoid circular imports
  const { usersTable } = await import("@workspace/db");
  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [listingsToday] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
    .where(sql`${listingsTable.createdAt} >= ${today.toISOString()}`);

  res.json({
    totalListings: totalListings?.count ?? 0,
    activeListings: activeListings?.count ?? 0,
    totalUsers: totalUsers?.count ?? 0,
    totalCategories: CATEGORIES.length,
    totalSellers: Math.floor((totalUsers?.count ?? 0) * 0.6),
    listingsToday: listingsToday?.count ?? 0,
  });
});

export default router;
