-- CreateEnum
CREATE TYPE "DisplayMode" AS ENUM ('cozy', 'detail');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "display_mode" "DisplayMode" NOT NULL DEFAULT 'cozy';
