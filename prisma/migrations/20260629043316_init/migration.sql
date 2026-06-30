-- CreateEnum
CREATE TYPE "MochiState" AS ENUM ('happy', 'sleepy', 'idle', 'cheer');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('common', 'rare', 'epic', 'seasonal');

-- CreateEnum
CREATE TYPE "PreferenceKind" AS ENUM ('like', 'dislike', 'allergy');

-- CreateEnum
CREATE TYPE "MealMode" AS ENUM ('cook', 'eatout', 'convenience');

-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('ingredient', 'recipe', 'convenience');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "cooks_often" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preference_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "PreferenceKind" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "preference_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL DEFAULT 'common',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "rarity" "Rarity" NOT NULL DEFAULT 'common',

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" "MealMode" NOT NULL,
    "photo_url" TEXT,
    "memo" TEXT,
    "eaten_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "shield_count" INTEGER NOT NULL DEFAULT 1,
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "CollectionType" NOT NULL,
    "ref_id" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL DEFAULT 'common',
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mochi_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "state" "MochiState" NOT NULL DEFAULT 'idle',
    "growth_stage" INTEGER NOT NULL DEFAULT 1,
    "outfit" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mochi_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "preference_tags_user_id_idx" ON "preference_tags"("user_id");

-- CreateIndex
CREATE INDEX "ingredients_user_id_idx" ON "ingredients"("user_id");

-- CreateIndex
CREATE INDEX "meal_records_user_id_idx" ON "meal_records"("user_id");

-- CreateIndex
CREATE INDEX "weight_logs_user_id_idx" ON "weight_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_user_id_key" ON "streaks"("user_id");

-- CreateIndex
CREATE INDEX "collection_entries_user_id_idx" ON "collection_entries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_entries_user_id_type_ref_id_key" ON "collection_entries"("user_id", "type", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "mochi_profiles_user_id_key" ON "mochi_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preference_tags" ADD CONSTRAINT "preference_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_records" ADD CONSTRAINT "meal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_entries" ADD CONSTRAINT "collection_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mochi_profiles" ADD CONSTRAINT "mochi_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
