-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- AlterTable
ALTER TABLE "meal_records" ADD COLUMN     "kcal" INTEGER,
ADD COLUMN     "ref_id" TEXT,
ADD COLUMN     "slot" "MealSlot";
