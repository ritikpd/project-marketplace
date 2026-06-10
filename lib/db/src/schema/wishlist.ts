import { pgTable, text, serial, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// BEFORE: no indexes and no unique constraint — GET /wishlist scans the full table by user_id,
//         and the application-level duplicate check (select then insert) has a race condition
//         that can allow duplicate (user_id, listing_id) pairs.
// AFTER:  uniqueIndex enforces at the database level that a user cannot add the same listing
//         twice, even under concurrent requests. The user_id index speeds up GET /wishlist.
export const wishlistTable = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  listingId: integer("listing_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("wishlist_user_id_idx").on(table.userId),
  uniqueIndex("wishlist_user_listing_unique_idx").on(table.userId, table.listingId),
]);

export const insertWishlistSchema = createInsertSchema(wishlistTable).omit({ id: true, createdAt: true });
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlistTable.$inferSelect;
