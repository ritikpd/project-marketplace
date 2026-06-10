-- ============================================================
-- NEPZIA — Performance & Integrity Migration
-- Generated: 2026-06-10
-- Apply via: pnpm --filter @workspace/db push
-- Or run manually in psql if using file-based migrations.
-- ============================================================

-- ─── listings ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS listings_seller_id_idx          ON listings (seller_id);
CREATE INDEX IF NOT EXISTS listings_category_idx           ON listings (category);
CREATE INDEX IF NOT EXISTS listings_status_idx             ON listings (status);
CREATE INDEX IF NOT EXISTS listings_featured_status_idx    ON listings (featured, status);
CREATE INDEX IF NOT EXISTS listings_location_idx           ON listings (location);
CREATE INDEX IF NOT EXISTS listings_created_at_idx         ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS listings_price_idx              ON listings (price);

-- ─── offers ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS offers_listing_id_idx           ON offers (listing_id);
CREATE INDEX IF NOT EXISTS offers_buyer_id_idx             ON offers (buyer_id);
CREATE INDEX IF NOT EXISTS offers_seller_id_idx            ON offers (seller_id);
CREATE INDEX IF NOT EXISTS offers_status_idx               ON offers (status);

-- ─── conversations ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx      ON conversations (buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx     ON conversations (seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx    ON conversations (listing_id);

-- ─── messages ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx              ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx   ON messages (conversation_id, created_at DESC);

-- ─── wishlist ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS wishlist_user_id_idx                      ON wishlist (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_listing_unique_idx   ON wishlist (user_id, listing_id);

-- ─── notifications ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notifications_user_id_idx                 ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx         ON notifications (user_id, is_read);
