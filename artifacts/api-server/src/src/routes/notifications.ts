import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkUserId as string;
  const notifs = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, clerkId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  return res.json(notifs);
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const clerkId = (req as any).clerkUserId as string;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, clerkId), eq(notificationsTable.isRead, false)));
  return res.status(204).end();
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const clerkId = (req as any).clerkUserId as string;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, clerkId)));
  return res.status(204).end();
});

export default router;
