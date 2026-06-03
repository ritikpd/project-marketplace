import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, listingsTable } from "@workspace/db";

const router: IRouter = Router();

const CATEGORIES = [
  // Electronics
  { id: 1,  name: "Phones",              slug: "phones",               icon: "smartphone",  group: "Electronics" },
  { id: 2,  name: "Laptops",             slug: "laptops",              icon: "laptop",       group: "Electronics" },
  { id: 3,  name: "Tablets",             slug: "tablets",              icon: "tablet",       group: "Electronics" },
  { id: 4,  name: "Smart Watches",       slug: "smart-watches",        icon: "watch",        group: "Electronics" },
  { id: 5,  name: "Cameras",             slug: "cameras",              icon: "camera",       group: "Electronics" },
  { id: 6,  name: "Gaming Consoles",     slug: "gaming-consoles",      icon: "gamepad-2",    group: "Electronics" },
  { id: 7,  name: "Accessories",         slug: "accessories",          icon: "cable",        group: "Electronics" },
  // Vehicles
  { id: 8,  name: "Cars",                slug: "cars",                 icon: "car",          group: "Vehicles" },
  { id: 9,  name: "Bikes",               slug: "bikes",                icon: "bike",         group: "Vehicles" },
  { id: 10, name: "Scooters",            slug: "scooters",             icon: "bike",         group: "Vehicles" },
  { id: 11, name: "Electric Vehicles",   slug: "electric-vehicles",    icon: "zap",          group: "Vehicles" },
  // Property
  { id: 12, name: "House Sale",          slug: "house-sale",           icon: "home",         group: "Property" },
  { id: 13, name: "House Rent",          slug: "house-rent",           icon: "home",         group: "Property" },
  { id: 14, name: "Flat Sale",           slug: "flat-sale",            icon: "building-2",   group: "Property" },
  { id: 15, name: "Flat Rent",           slug: "flat-rent",            icon: "building-2",   group: "Property" },
  { id: 16, name: "Land Sale",           slug: "land-sale",            icon: "trending-up",  group: "Property" },
  { id: 17, name: "Commercial Property", slug: "commercial-property",  icon: "store",        group: "Property" },
  // Jobs
  { id: 18, name: "Full Time",           slug: "full-time",            icon: "briefcase",    group: "Jobs" },
  { id: 19, name: "Part Time",           slug: "part-time",            icon: "briefcase",    group: "Jobs" },
  { id: 20, name: "Internship",          slug: "internship",           icon: "book-open",    group: "Jobs" },
  { id: 21, name: "Remote",             slug: "remote",               icon: "laptop",       group: "Jobs" },
  // Services
  { id: 22, name: "Repair",             slug: "repair",               icon: "wrench",       group: "Services" },
  { id: 23, name: "Cleaning",           slug: "cleaning",             icon: "sparkles",     group: "Services" },
  { id: 24, name: "Tutor",              slug: "tutor",                icon: "book-open",    group: "Services" },
  { id: 25, name: "Freelancer",         slug: "freelancer",           icon: "code",         group: "Services" },
];

// GET /categories
router.get("/categories", async (_req, res): Promise<void> => {
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
    return {
      category: c.category,
      count: c.count,
      slug: cat?.slug ?? c.category.toLowerCase().replace(/\s+/g, "-"),
    };
  });

  res.json(result);
});

// GET /stats/marketplace
router.get("/stats/marketplace", async (_req, res): Promise<void> => {
  const [totalListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable);
  const [activeListings] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "active"));

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
