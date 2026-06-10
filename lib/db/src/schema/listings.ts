import { pgTable, text, serial, timestamp, boolean, real, integer, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// BEFORE: no indexes — every query filtering by seller_id, category, status, featured, or location
//         performs a full sequential scan of the entire listings table.
// AFTER:  dedicated indexes on every high-frequency filter/sort column. Queries like
//         GET /listings?category=X, GET /listings/featured, GET /my/listings, and
//         GET /listings/nearby all drop from O(N) scans to O(log N) index lookups.
export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  condition: text("condition").notNull().default("Good"),
  category: text("category").notNull(),
  location: text("location").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  images: text("images").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  featured: boolean("featured").notNull().default(false),
  boosted: boolean("boosted").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  sellerId: text("seller_id").notNull(),
  contactPhone: text("contact_phone"),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("listings_seller_id_idx").on(table.sellerId),
  index("listings_category_idx").on(table.category),
  index("listings_status_idx").on(table.status),
  index("listings_featured_status_idx").on(table.featured, table.status),
  index("listings_location_idx").on(table.location),
  index("listings_created_at_idx").on(table.createdAt),
  index("listings_price_idx").on(table.price),
]);

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
