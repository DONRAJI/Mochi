-- AlterTable (추가형: 기존 재료는 전부 냉장으로)
ALTER TABLE "ingredients" ADD COLUMN "storage" TEXT NOT NULL DEFAULT 'fridge';
