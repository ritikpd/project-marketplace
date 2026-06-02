import { pgTable, text, serial, timestamp, boolean, real, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
