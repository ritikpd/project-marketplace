import { pgTable, text, serial, timestamp, real, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// BEFORE: no indexes — queries filtering by listing_id, buyer_id, or seller_id scan the full table.
// AFTER:  indexes on listing_id, buyer_id, seller_id. The GET /my/offers query (which filters by
//         OR buyer_id = ? OR seller_id = ?) now uses index scans instead of sequential scans.
export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  amount: real("amount").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  counterAmount: real("counter_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("offers_listing_id_idx").on(table.listingId),
  index("offers_buyer_id_idx").on(table.buyerId),
  index("offers_seller_id_idx").on(table.sellerId),
  index("offers_status_idx").on(table.status),
]);

export const insertOfferSchema = createInsertSchema(offersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
