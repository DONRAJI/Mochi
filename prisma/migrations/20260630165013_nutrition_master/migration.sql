-- AlterTable
ALTER TABLE "convenience_items" ADD COLUMN     "kcal" INTEGER,
ADD COLUMN     "protein" INTEGER;

-- AlterTable
ALTER TABLE "menus" ADD COLUMN     "kcal" INTEGER,
ADD COLUMN     "protein" INTEGER;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "kcal" INTEGER,
ADD COLUMN     "protein" INTEGER;

-- CreateTable
CREATE TABLE "ingredient_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL DEFAULT 'common',
    "kcal" INTEGER,
    "protein" INTEGER,
    "aliases" TEXT[],

    CONSTRAINT "ingredient_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_masters_name_key" ON "ingredient_masters"("name");
