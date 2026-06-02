import { Router, type IRouter } from "express";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable, listingsTable, usersTable } from "@workspace/db";
import { CreateConversationBody, GetMessagesParams, SendMessageBody, SendMessageParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /conversations
router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId;
  const convs = await db.select().from(conversationsTable)
    .where(or(eq(conversationsTable.buyerId, clerkUserId), eq(conversationsTable.sellerId, clerkUserId)))
    .orderBy(desc(conversationsTable.updatedAt));

  const enriched = await Promise.all(convs.map(async (conv) => {
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, conv.listingId));
    const otherPartyId = conv.buyerId === clerkUserId ? conv.sellerId : conv.buyerId;
    const [otherParty] = await db.select().from(usersTable).where(eq(usersTable.clerkId, otherPartyId));
    const [lastMsg] = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);
    return {
      ...conv,
      listingTitle: listing?.title ?? null,
      listingImage: listing?.images?.[0] ?? null,
      otherPartyName: otherParty?.name ?? null,
      otherPartyAvatar: otherParty?.avatar ?? null,
      lastMessage: lastMsg?.content ?? null,
      lastMessageAt: lastMsg?.createdAt?.toISOString?.() ?? null,
      unreadCount: 0,
      createdAt: conv.createdAt?.toISOString?.() ?? conv.createdAt,
    };
  }));

  res.json(enriched);
});

// POST /conversations
router.post("/conversations", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;

  // Check if conversation already exists
  const [existing] = await db.select().from(conversationsTable)
    .where(and(
      eq(conversationsTable.listingId, parsed.data.listingId),
      eq(conversationsTable.buyerId, clerkUserId),
      eq(conversationsTable.sellerId, parsed.data.sellerId),
    ));

  let conv = existing;
  if (!conv) {
    [conv] = await db.insert(conversationsTable).values({
      listingId: parsed.data.listingId,
      buyerId: clerkUserId,
      sellerId: parsed.data.sellerId,
    }).returning();

    // Send initial message if provided
    if (parsed.data.initialMessage) {
      await db.insert(messagesTable).values({
        conversationId: conv.id,
        senderId: clerkUserId,
        content: parsed.data.initialMessage,
      });
    }
  }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, conv.listingId));
  const otherPartyId = conv.buyerId === clerkUserId ? conv.sellerId : conv.buyerId;
  const [otherParty] = await db.select().from(usersTable).where(eq(usersTable.clerkId, otherPartyId));

  res.status(201).json({
    ...conv,
    listingTitle: listing?.title ?? null,
    listingImage: listing?.images?.[0] ?? null,
    otherPartyName: otherParty?.name ?? null,
    otherPartyAvatar: otherParty?.avatar ?? null,
    lastMessage: parsed.data.initialMessage ?? null,
    lastMessageAt: null,
    unreadCount: 0,
    createdAt: conv.createdAt?.toISOString?.() ?? conv.createdAt,
  });
});

// GET /conversations/:id/messages
router.get("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const params = GetMessagesParams.safeParse({ id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);
  res.json(msgs.map((m) => ({ ...m, createdAt: m.createdAt?.toISOString?.() ?? m.createdAt })));
});

// POST /conversations/:id/messages
router.post("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const params = SendMessageParams.safeParse({ id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const clerkUserId = (req as any).clerkUserId;
  const [msg] = await db.insert(messagesTable).values({
    conversationId: params.data.id,
    senderId: clerkUserId,
    content: parsed.data.content,
  }).returning();
  res.status(201).json({ ...msg, createdAt: msg.createdAt?.toISOString?.() ?? msg.createdAt });
});

export default router;
