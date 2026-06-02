import { Router } from "express";
import { db, offersTable, listingsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/listings/:id/offers", requireAuth, async (req, res) => {
  const listingId = Number(req.params.id);
  const clerkId = (req as any).clerkUserId as string;
  const { amount, message } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid offer amount required" });
  }

  const listing = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, listingId))
    .limit(1)
    .then(r => r[0]);

  if (!listing) return res.status(404).json({ error: "Listing not found" });
  if (listing.sellerId === clerkId) return res.status(400).json({ error: "Cannot offer on your own listing" });

  const [offer] = await db
    .insert(offersTable)
    .values({ listingId, buyerId: clerkId, sellerId: listing.sellerId, amount, message: message || null })
    .returning();

  const buyer = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1)
    .then(r => r[0]);

  await db.insert(notificationsTable).values({
    userId: listing.sellerId,
    type: "offer",
    title: "New Offer Received",
    body: `${buyer?.name ?? "Someone"} offered Rs. ${Number(amount).toLocaleString()} for "${listing.title}"`,
    data: JSON.stringify({ offerId: offer.id, listingId }),
  });

  return res.status(201).json({ ...offer, listingTitle: listing.title, listingImage: listing.images?.[0] ?? null });
});

router.get("/my/offers", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkUserId as string;

  const offers = await db
    .select({
      id: offersTable.id,
      listingId: offersTable.listingId,
      buyerId: offersTable.buyerId,
      sellerId: offersTable.sellerId,
      amount: offersTable.amount,
      message: offersTable.message,
      status: offersTable.status,
      counterAmount: offersTable.counterAmount,
      createdAt: offersTable.createdAt,
      listingTitle: listingsTable.title,
      listingImage: listingsTable.images,
      buyerName: usersTable.name,
    })
    .from(offersTable)
    .leftJoin(listingsTable, eq(offersTable.listingId, listingsTable.id))
    .leftJoin(usersTable, eq(offersTable.buyerId, usersTable.clerkId))
    .where(or(eq(offersTable.buyerId, clerkId), eq(offersTable.sellerId, clerkId)))
    .orderBy(offersTable.createdAt);

  return res.json(offers.map(o => ({ ...o, listingImage: (o.listingImage as string[] | null)?.[0] ?? null })));
});

router.patch("/offers/:id/respond", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const clerkId = (req as any).clerkUserId as string;
  const { action, counterAmount } = req.body;

  const offer = await db
    .select()
    .from(offersTable)
    .where(and(eq(offersTable.id, id), eq(offersTable.sellerId, clerkId)))
    .limit(1)
    .then(r => r[0]);

  if (!offer) return res.status(404).json({ error: "Offer not found or not authorized" });

  const statusMap: Record<string, string> = { accepted: "accepted", rejected: "rejected", countered: "countered" };
  const newStatus = statusMap[action];
  if (!newStatus) return res.status(400).json({ error: "Invalid action" });

  const [updated] = await db
    .update(offersTable)
    .set({ status: newStatus, counterAmount: action === "countered" ? counterAmount : null })
    .where(eq(offersTable.id, id))
    .returning();

  const listing = await db
    .select({ title: listingsTable.title })
    .from(listingsTable)
    .where(eq(listingsTable.id, offer.listingId))
    .limit(1)
    .then(r => r[0]);

  const offerAmount = Number(offer.amount);
  const notifBody = action === "accepted"
    ? `Your offer of Rs. ${offerAmount.toLocaleString()} for "${listing?.title}" was accepted!`
    : action === "rejected"
    ? `Your offer of Rs. ${offerAmount.toLocaleString()} for "${listing?.title}" was declined.`
    : `Seller countered with Rs. ${Number(counterAmount).toLocaleString()} for "${listing?.title}"`;

  await db.insert(notificationsTable).values({
    userId: offer.buyerId,
    type: `offer_${newStatus}`,
    title: action === "accepted" ? "Offer Accepted!" : action === "rejected" ? "Offer Declined" : "Counter Offer",
    body: notifBody,
    data: JSON.stringify({ offerId: id, listingId: offer.listingId }),
  });

  return res.json(updated);
});

export default router;
