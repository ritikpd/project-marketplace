import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, wishlistTable, listingsTable, usersTable } from "@workspace/db";
import { AddToWishlistParams, RemoveFromWishlistParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /wishlist
// BEFORE: two sequential for-of loops issuing 1 DB query per listing and 1 per seller — O(2N) queries.
// AFTER:  two inArray batch queries — always exactly 2 queries regardless of wishlist size.
router.get("/wishlist", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId;

  const items = await db.select().from(wishlistTable).where(eq(wishlistTable.userId, clerkUserId));
  if (items.length === 0) {
    res.json([]);
    return;
  }

  const listingIds = items.map((i) => i.listingId);
  const allListings = await db.select().from(listingsTable).where(inArray(listingsTable.id, listingIds));

  const sellerIds = [...new Set(allListings.map((l) => l.sellerId))];
  const sellers = await db.select().from(usersTable).where(inArray(usersTable.clerkId, sellerIds));
  const sellerMap = new Map(sellers.map((s) => [s.clerkId, s]));

  const enriched = allListings.map((l) => {
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

  res.json(enriched);
});

// POST /wishlist/:listingId
router.post("/wishlist/:listingId", requireAuth, async (req, res): Promise<void> => {
  const params = AddToWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  const existing = await db.select().from(wishlistTable)
    .where(and(eq(wishlistTable.userId, clerkUserId), eq(wishlistTable.listingId, params.data.listingId)));
  if (existing.length === 0) {
    await db.insert(wishlistTable).values({ userId: clerkUserId, listingId: params.data.listingId });
  }
  res.status(201).json({ message: "Added to wishlist" });
});

// DELETE /wishlist/:listingId
router.delete("/wishlist/:listingId", requireAuth, async (req, res): Promise<void> => {
  const params = RemoveFromWishlistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  await db.delete(wishlistTable)
    .where(and(eq(wishlistTable.userId, clerkUserId), eq(wishlistTable.listingId, params.data.listingId)));
  res.sendStatus(204);
});

export default router;
