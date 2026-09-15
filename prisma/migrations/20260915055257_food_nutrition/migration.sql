-- CreateTable
CREATE TABLE "food_nutrition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "search_key" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL,
    "serving_amount" DOUBLE PRECISION NOT NULL,
    "serving_unit" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "variant_count" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "food_nutrition_source_idx" ON "food_nutrition"("source");
