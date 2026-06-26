import "server-only"; // 클라 번들 유입 차단 (security.md §7)
import { PrismaClient } from "@prisma/client";

/** Prisma Client 싱글톤. 개발 중 HMR로 커넥션이 늘어나는 걸 막는다. */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
