-- AlterEnum
ALTER TYPE "CollectionType" ADD VALUE 'mochi';

-- AlterEnum
ALTER TYPE "Rarity" ADD VALUE 'legendary';

-- AlterTable
ALTER TABLE "collection_entries" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mochi_seeds" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "mochi_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "image_url" TEXT NOT NULL,
    "flavor" TEXT NOT NULL,
    "food_theme" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mochi_cards_pkey" PRIMARY KEY ("id")
);
