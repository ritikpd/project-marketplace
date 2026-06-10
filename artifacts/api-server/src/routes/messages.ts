import { Router, type IRouter } from "express";
import { eq, and, or, desc, inArray, sql } from "drizzle-orm";
import { db, conversationsTable, messagesTable, listingsTable, usersTable } from "@workspace/db";
import { CreateConversationBody, GetMessagesParams, SendMessageBody, SendMessageParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /conversations
// BEFORE: N+1 — 3 queries per conversation (listing + other party + last message).
// AFTER:  4 total queries regardless of conversation count using inArray batch fetches
//         and a subquery join to get the last message per conversation efficiently.
router.get("/conversations", requireAuth, async (req, res): Promise<void> => {
  const clerkUserId = (req as any).clerkUserId;

  const convs = await db.select().from(conversationsTable)
    .where(or(eq(conversationsTable.buyerId, clerkUserId), eq(conversationsTable.sellerId, clerkUserId)))
    .orderBy(desc(conversationsTable.updatedAt));

  if (convs.length === 0) {
    res.json([]);
    return;
  }

  // Batch fetch all referenced listings (1 query)
  const listingIds = [...new Set(convs.map((c) => c.listingId))];
  const listings = await db.select().from(listingsTable).where(inArray(listingsTable.id, listingIds));
  const listingMap = new Map(listings.map((l) => [l.id, l]));

  // Batch fetch all other parties (1 query)
  const otherPartyIds = [...new Set(convs.map((c) => c.buyerId === clerkUserId ? c.sellerId : c.buyerId))];
  const otherParties = await db.select().from(usersTable).where(inArray(usersTable.clerkId, otherPartyIds));
  const otherPartyMap = new Map(otherParties.map((u) => [u.clerkId, u]));

  // Batch fetch last message per conversation using subquery join (1 query)
  // Subquery: SELECT conversation_id, MAX(id) AS max_id FROM messages WHERE conversation_id IN (...) GROUP BY conversation_id
  const convIds = convs.map((c) => c.id);
  const lastMsgSubq = db
    .select({
      conversationId: messagesTable.conversationId,
      maxId: sql<number>`MAX(${messagesTable.id})`.as("max_id"),
    })
    .from(messagesTable)
    .where(inArray(messagesTable.conversationId, convIds))
    .groupBy(messagesTable.conversationId)
    .as("last_msg_ids");

  const lastMsgRows = await db
    .select({
      conversationId: lastMsgSubq.conversationId,
      content: messagesTable.content,
      createdAt: messagesTable.createdAt,
    })
    .from(lastMsgSubq)
    .innerJoin(messagesTable, eq(messagesTable.id, lastMsgSubq.maxId));

  const lastMessageMap = new Map(lastMsgRows.map((m) => [m.conversationId, m]));

  const enriched = convs.map((conv) => {
    const listing = listingMap.get(conv.listingId);
    const otherPartyId = conv.buyerId === clerkUserId ? conv.sellerId : conv.buyerId;
    const otherParty = otherPartyMap.get(otherPartyId);
    const lastMsg = lastMessageMap.get(conv.id);
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
  });

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

  // Prevent starting a conversation with yourself
  if (parsed.data.sellerId === clerkUserId) {
    res.status(400).json({ error: "Cannot start a conversation with yourself" });
    return;
  }

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
// BEFORE: no authorization check — any authenticated user could read any conversation.
// AFTER:  verifies the requesting user is buyerId or sellerId before returning messages.
router.get("/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const params = GetMessagesParams.safeParse({ id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const clerkUserId = (req as any).clerkUserId;
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conv.buyerId !== clerkUserId && conv.sellerId !== clerkUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(messagesTable.createdAt);
  res.json(msgs.map((m) => ({ ...m, createdAt: m.createdAt?.toISOString?.() ?? m.createdAt })));
});

// POST /conversations/:id/messages
// BEFORE: no authorization check — any authenticated user could post messages to any conversation.
// AFTER:  verifies the requesting user is buyerId or sellerId before allowing message insert.
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
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, params.data.id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conv.buyerId !== clerkUserId && conv.sellerId !== clerkUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: params.data.id,
    senderId: clerkUserId,
    content: parsed.data.content,
  }).returning();
  res.status(201).json({ ...msg, createdAt: msg.createdAt?.toISOString?.() ?? msg.createdAt });
});

export default router;
