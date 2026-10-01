-- 0033_home_tour.sql
-- Remembers on the account (not the browser) that the Home guided tour was
-- finished or skipped, so it does not reappear on a new device. Additive only.
-- Mirrors src/db/schema.ts (user.homeTourDoneAt).
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "home_tour_done_at" timestamp;
