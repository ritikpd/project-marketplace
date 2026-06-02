import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, listingsTable } from "@workspace/db";
import { UpdateMeBody, GetUserProfileParams, GetSellerListingsParams } from "@workspace/api-zod";
import { requireAuth, requireAdmin, optionalAuth } from "../middlewares/requireAuth";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

// GET /users/me — get or JIT-provision current user
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId;
  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    // JIT provision
    const auth = getAuth(req);
    [user] = await db.insert(usersTable).values({
      clerkId: clerkUserId,
      email: null,
      name: null,
      avatar: null,
    }).returning();
  }
  res.json({
    ...user,
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
  });
});

// PATCH /users/me
router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.clerkId, clerkUserId)).returning();
  if (!user) {
    // Create if doesn't exist
    const [newUser] = await db.insert(usersTable).values({ clerkId: clerkUserId, ...parsed.data }).returning();
    res.json({ ...newUser, createdAt: newUser.createdAt?.toISOString?.() ?? newUser.createdAt });
    return;
  }
  res.json({ ...user, createdAt: user.createdAt?.toISOString?.() ?? user.createdAt });
});

// GET /users/:id — public seller profile
router.get("/users/:id", optionalAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const clerkId = raw;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(listingsTable)
    .where(eq(listingsTable.sellerId, clerkId));
  res.json({
    ...user,
    listingCount: countResult?.count ?? 0,
    rating: 4.5,
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
  });
});

// GET /users/:id/listings — seller's listings
router.get("/users/:id/listings", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rows = await db.select().from(listingsTable)
    .where(eq(listingsTable.sellerId, raw))
    .orderBy(desc(listingsTable.createdAt));

  const sellerRows = await db.select().from(usersTable).where(eq(usersTable.clerkId, raw));
  const seller = sellerRows[0];

  const enriched = rows.map((l) => ({
    ...l,
    sellerName: seller?.name ?? null,
    sellerAvatar: seller?.avatar ?? null,
    sellerVerified: seller?.isVerified ?? false,
    sellerRating: 4.5,
    createdAt: l.createdAt?.toISOString?.() ?? l.createdAt,
    updatedAt: l.updatedAt?.toISOString?.() ?? l.updatedAt ?? null,
  }));
  res.json(enriched);
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt?.toISOString?.() ?? u.createdAt })));
});

export default router;
