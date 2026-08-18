import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/server/db";
import type { AuthTokenKind } from "@prisma/client";

/**
 * 메일 링크용 일회용 토큰 (이메일 인증 · 비밀번호 재설정) — security.md §2.
 *
 * 세션과 같은 원칙: **원문은 메일로만 나가고 DB엔 sha256 해시만** 둔다. DB가 유출돼도
 * 남의 계정 링크를 만들 수 없다. 1회용(usedAt)·만료·재발급 시 이전 것 폐기까지 여기서 강제한다.
 */

/** 인증 24시간 / 재설정 1시간 — 재설정이 더 위험하므로 창을 좁게. */
export const TOKEN_TTL_MS: Record<AuthTokenKind, number> = {
  email_verify: 24 * 60 * 60 * 1000,
  password_reset: 60 * 60 * 1000,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * 새 토큰 발급 → **원문**을 반환(메일 링크에 넣을 값). 호출한 쪽은 이 값을 저장하지 말 것.
 * 같은 종류의 기존 토큰은 폐기한다 — 재발송하면 옛 링크는 즉시 죽는다.
 */
export async function issueAuthToken(userId: string, kind: AuthTokenKind): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, kind } }),
    db.authToken.create({
      data: {
        userId,
        kind,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS[kind]),
      },
    }),
  ]);
  return token;
}

/**
 * 토큰 사용 — 유효하면 userId를 돌려주고 즉시 소진 처리(1회용). 아니면 null.
 * 만료·이미 사용됨·종류 불일치를 전부 같은 null로 처리해, 어떤 이유로 실패했는지 흘리지 않는다.
 */
export async function consumeAuthToken(
  token: string,
  kind: AuthTokenKind,
): Promise<string | null> {
  if (!token) return null;
  const row = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.kind !== kind || row.usedAt || row.expiresAt < new Date()) return null;

  // 동시에 두 번 눌러도 한 번만 통과 — 아직 안 쓴 것만 갱신하고, 갱신된 행이 없으면 실패로.
  const claimed = await db.authToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) return null;

  return row.userId;
}

/**
 * 이 유저의 소진·만료 토큰 청소 — 로그인 시 곁다리로 호출 (pruneExpiredSessions와 같은 패턴).
 * 재발급은 같은 종류만 지우므로, 사용된(usedAt) 토큰이 영구 누적되는 걸 여기서 막는다.
 */
export async function pruneStaleAuthTokens(userId: string): Promise<void> {
  await db.authToken
    .deleteMany({
      where: { userId, OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] },
    })
    .catch(() => {}); // 청소 실패가 로그인을 막으면 안 된다
}
