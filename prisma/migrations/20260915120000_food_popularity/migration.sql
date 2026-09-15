-- AlterTable (추가형: 기존 행은 1로 채워지고, 재적재 때 실제 값으로 바뀐다)
ALTER TABLE "food_nutrition" ADD COLUMN "popularity" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "food_nutrition_source_popularity_idx" ON "food_nutrition"("source", "popularity");
