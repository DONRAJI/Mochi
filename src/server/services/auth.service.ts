import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/lib/api-response";
import { messages } from "@/lib/messages";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession, getSessionUserId } from "@/server/auth/session";
import type { SignupRequest, LoginRequest, AuthUserResponse } from "@/features/auth/types";

/**
 * auth 서비스 — 비즈니스 로직·Prisma는 여기서만 (structure.md 레이어 규칙).
 * Prisma User를 그대로 반환하지 않고 AuthUserResponse로 변환(passwordHash 노출 금지 — security.md).
 */
function toAuthUser(user: {
  id: string;
  email: string;
  nickname: string;
  cooksOften: boolean;
}): AuthUserResponse {
  return { id: user.id, email: user.email, nickname: user.nickname, cooksOften: user.cooksOften };
}

export async function signup(input: SignupRequest): Promise<AuthUserResponse> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError("EMAIL_TAKEN", messages.auth.emailTaken, 400);

  const passwordHash = await hashPassword(input.password);

  // 멀티 스텝 쓰기는 트랜잭션으로 (가입 = 유저 + 모찌 + 스트릭 + 온보딩 태그 한 번에)
  const user = await db.$transaction((tx) =>
    tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        nickname: input.nickname,
        cooksOften: input.cooksOften,
        mochi: { create: {} }, // 기본 idle 상태
        streak: { create: {} }, // 보호권 1개 기본
        preferences: input.tags?.length
          ? { create: input.tags.map((t) => ({ kind: t.kind, label: t.label })) }
          : undefined,
      },
    }),
  );

  await createSession(user.id);
  return toAuthUser(user);
}

export async function login(input: LoginRequest): Promise<AuthUserResponse> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError("INVALID_CREDENTIALS", messages.auth.invalidCredentials, 401);
  }
  await createSession(user.id);
  return toAuthUser(user);
}

export async function logout(): Promise<void> {
  await destroySession();
}

export async function getMe(): Promise<AuthUserResponse> {
  const userId = await getSessionUserId();
  if (!userId) throw new AppError("UNAUTHORIZED", messages.auth.loginRequired, 401);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("UNAUTHORIZED", messages.auth.loginRequired, 401);
  return toAuthUser(user);
}
