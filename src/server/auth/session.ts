import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/server/db";

/**
 * 세션 관리 (security.md §2).
 * - 쿠키: HttpOnly + Secure(프로덕션) + SameSite=Lax. JS 접근 불가, localStorage 저장 금지.
 * - DB에는 토큰 원문이 아니라 sha256 해시를 저장(유출 시 재사용 차단) + 만료로 폐기 가능.
 * - 미들웨어 가드와 쿠키 이름을 맞춘다(src/middleware.ts: SESSION_COOKIE).
 */
const COOKIE = "mochi_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7일

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAX_AGE_SEC * 1000);

  await db.session.create({
    data: { userId, refreshToken: hashToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

/** 현재 요청의 세션에서 userId를 꺼낸다. 없거나 만료면 null. (다층 방어: 서비스에서 재확인) */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { refreshToken: hashToken(token) },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.userId;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { refreshToken: hashToken(token) } });
  }
  cookieStore.delete(COOKIE);
}
