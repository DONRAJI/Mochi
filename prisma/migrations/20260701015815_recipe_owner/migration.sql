-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "owner_id" TEXT;

-- CreateIndex
CREATE INDEX "recipes_owner_id_idx" ON "recipes"("owner_id");
