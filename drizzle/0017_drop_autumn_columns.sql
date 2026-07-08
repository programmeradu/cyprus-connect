-- Drop legacy Autumn subscription sync columns from the user table.
ALTER TABLE "user" DROP COLUMN IF EXISTS "autumn_customer_id";
ALTER TABLE "user" DROP COLUMN IF EXISTS "autumn_plan";
ALTER TABLE "user" DROP COLUMN IF EXISTS "last_autumn_sync";
