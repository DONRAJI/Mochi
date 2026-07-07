-- AlterTable
ALTER TABLE "users" ADD COLUMN     "seed_day" TEXT,
ADD COLUMN     "seeds_today" INTEGER NOT NULL DEFAULT 0;
