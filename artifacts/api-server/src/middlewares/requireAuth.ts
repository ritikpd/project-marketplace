import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced Authentication Middleware
// ─────────────────────────────────────────────────────────────────────────────

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;

  if (!userId) {
    logger.warn(
      { path: req.path, method: req.method, ip: req.ip },
      "Unauthorized access attempt",
    );
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Verify userId is valid format (alphanumeric, underscore, hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    logger.error({ userId }, "Invalid Clerk user ID format");
    res.status(401).json({ error: "Invalid authentication" });
    return;
  }

  (req as any).clerkUserId = userId;
  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    logger.warn(
      { path: req.path, method: req.method },
      "Admin access attempt without auth",
    );
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Verify clerkId format
  if (!/^[a-zA-Z0-9_-]+$/.test(clerkId)) {
    logger.error({ clerkId }, "Invalid Clerk user ID format");
    res.status(401).json({ error: "Invalid authentication" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkId));

    if (!user?.isAdmin) {
      logger.warn(
        { userId: clerkId, path: req.path },
        "Forbidden admin access attempt",
      );
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    (req as any).clerkUserId = clerkId;
    next();
  } catch (error) {
    logger.error({ error, clerkId }, "Error checking admin status");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const auth = getAuth(req);
  const userId = auth?.userId ?? null;

  // Validate userId format if present
  if (userId && !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    logger.warn({ userId }, "Invalid Clerk user ID format in optional auth");
    (req as any).clerkUserId = null;
  } else {
    (req as any).clerkUserId = userId;
  }

  next();
};