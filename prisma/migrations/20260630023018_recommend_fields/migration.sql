-- AlterTable
ALTER TABLE "convenience_items" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "emoji" TEXT;

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "emoji" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "ingredients" TEXT[],
ADD COLUMN     "steps" TEXT[];
