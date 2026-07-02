-- CreateTable
CREATE TABLE "planned_meals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "slot" "MealSlot",
    "mode" "MealMode" NOT NULL,
    "ref_id" TEXT,
    "title" TEXT NOT NULL,
    "emoji" TEXT,
    "eaten" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planned_meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planned_meals_user_id_date_idx" ON "planned_meals"("user_id", "date");

-- AddForeignKey
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
