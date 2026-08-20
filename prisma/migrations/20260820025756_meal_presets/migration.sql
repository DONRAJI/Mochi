-- CreateTable
CREATE TABLE "meal_presets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_preset_items" (
    "id" TEXT NOT NULL,
    "preset_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "slot" "MealSlot",
    "mode" "MealMode" NOT NULL,
    "ref_id" TEXT,
    "title" TEXT NOT NULL,
    "emoji" TEXT,

    CONSTRAINT "meal_preset_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_presets_user_id_idx" ON "meal_presets"("user_id");

-- CreateIndex
CREATE INDEX "meal_preset_items_preset_id_idx" ON "meal_preset_items"("preset_id");

-- AddForeignKey
ALTER TABLE "meal_presets" ADD CONSTRAINT "meal_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_preset_items" ADD CONSTRAINT "meal_preset_items_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "meal_presets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
